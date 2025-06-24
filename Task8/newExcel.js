const TOTAL_ROWS = 100000;
const TOTAL_COLUMNS = 500;
const DEFAULT_ROW_HEIGHT = 28;
const DEFAULT_COLUMN_WIDTH = 100;
const HEADER_HEIGHT = 28;
const HEADER_WIDTH = 50;

const VISIBLE_ROWS_PER_CANVAS_TILE = 50;
const VISIBLE_COLS_PER_CANVAS_TILE = 30;

const TILE_BUFFER_ROWS = 1;
const TILE_BUFFER_COLS = 1;
class Column {
    constructor(index, initialWidth = DEFAULT_COLUMN_WIDTH) {
        this.index = index;
        this.Width = initialWidth; // Use a private-like variable
    }

    get width() {
        return this.Width;
    }

    set width(newWidth) {
        // Enforce a minimum width
        this.Width = Math.max(10, newWidth);
    }

    // You could add more properties here, e.g.,
    // this.isHidden = false;
    // this.isFrozen = false;
}
class Row {
    constructor(index, initialHeight = DEFAULT_ROW_HEIGHT) {
        this.index = index;
        this._height = initialHeight; // Use a private-like variable
    }

    get height() {
        return this._height;
    }

    set height(newHeight) {
        // Enforce a minimum height
        this._height = Math.max(10, newHeight);
    }

    // You could add more properties here, e.g.,
    // this.isHidden = false;
    // this.isFrozen = false;
}
function getColumnName(colIndex) {
    let dividend = colIndex + 1;
    let columnName = '';
    let modulo;

    while (dividend > 0) {
        modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
    }
    return columnName;
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

class Cell {
    constructor(rowIndex, colIndex, value = '') {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.value = value;
    }

    getContent() {
        if (this.value) {
            return this.value;
        }
        return `R${this.rowIndex + 1}C${this.colIndex + 1}`;
    }
}

class CanvasTile {
    constructor(canvasElement, grid, tileRowIndex, tileColIndex) {
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.grid = grid;
        this.tileRowIndex = tileRowIndex;
        this.tileColIndex = tileColIndex;

        this.startGlobalRow = tileRowIndex * VISIBLE_ROWS_PER_CANVAS_TILE;
        this.endGlobalRow = Math.min(this.startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS);
        this.startGlobalCol = tileColIndex * VISIBLE_COLS_PER_CANVAS_TILE;
        this.endGlobalCol = Math.min(this.startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS);

        this.calculateDimensions();
        this.updateDimensionsAndPosition();
    }

    calculateDimensions() {
        let width = 0;
        for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
            width += this.grid.columns[c].width; // Get width from Column object
        }
        let height = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            height += this.grid.rows[r].height; // Get height from Row object
        }
        this.width = width;
        this.height = height;
    }

    updateDimensionsAndPosition() {
        this.calculateDimensions();

        this.canvasElement.width = this.width * window.devicePixelRatio;
        this.canvasElement.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.canvasElement.style.width = `${this.width}px`;
        this.canvasElement.style.height = `${this.height}px`;

        const tileLeft = this.grid.getCumulativeColumnWidth(this.startGlobalCol);
        const tileTop = this.grid.getCumulativeRowHeight(this.startGlobalRow);

        this.canvasElement.style.left = `${tileLeft}px`;
        this.canvasElement.style.top = `${tileTop}px`;
        this.canvasElement.dataset.tileRow = this.tileRowIndex;
        this.canvasElement.dataset.tileCol = this.tileColIndex;
    }

    draw() {
        const dpr = window.devicePixelRatio;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this.canvasElement.width = this.width * dpr;
        this.canvasElement.height = this.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = '#e5e7eb';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151';

        // Draw rows
        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.rows[r].height; // Get height from Row object
            ctx.beginPath();
            ctx.moveTo(0, currentY);
            ctx.lineTo(this.width, currentY);
            ctx.lineWidth = 1;
            ctx.stroke();
            currentY += rowHeight;
        }
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(this.width, this.height);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw columns
        let currentX = 0;
        for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
            const colWidth = this.grid.columns[c].width; // Get width from Column object
            ctx.beginPath();
            ctx.moveTo(currentX, 0);
            ctx.lineTo(currentX, this.height);
            ctx.lineWidth = 1;
            ctx.stroke();
            currentX += colWidth;
        }
        ctx.beginPath();
        ctx.moveTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    dispose() {
        // Cleanup if necessary
    }
}


class Grid {
    constructor(containerId) {
        this.gridWrapper = document.getElementById('grid-wrapper');
        this.container = document.getElementById(containerId);
        if (!this.container || !this.gridWrapper) {
            console.error(`Required grid elements not found.`);
            return;
        }

        this.canvasTiles = new Map();
        this.contentSizer = document.getElementById('grid-content-sizer');

        this.colHeaderCanvas = document.getElementById('column-header-canvas');
        this.colHeaderCtx = this.colHeaderCanvas.getContext('2d');
        this.rowHeaderCanvas = document.getElementById('row-header-canvas');
        this.rowHeaderCtx = this.rowHeaderCanvas.getContext('2d');

        // Initialize collections of Column and Row objects
        this.columns = Array.from({ length: TOTAL_COLUMNS }, (_, i) => new Column(i));
        this.rows = Array.from({ length: TOTAL_ROWS }, (_, i) => new Row(i));

        // Resizing state
        this.isResizingCol = false;
        this.isResizingRow = false;
        this.resizingIndex = -1;
        this.initialPos = 0;
        this.initialSize = 0;

        this.updateHeaderCanvasSizes();

        this.container.addEventListener('scroll', debounce(this._handleScroll.bind(this), 50));
        window.addEventListener('resize', debounce(this._handleResize.bind(this), 100));

        // Event listeners for resizing headers
        this.colHeaderCanvas.addEventListener('mousedown', this._handleColHeaderMouseDown.bind(this));
        this.rowHeaderCanvas.addEventListener('mousedown', this._handleRowHeaderMouseDown.bind(this));
        window.addEventListener('mousemove', this._handleMouseMove.bind(this));
        window.addEventListener('mouseup', this._handleMouseUp.bind(this));

        // Add a visual resizer line (optional, but good for UX)
        this.resizerLine = document.getElementById('resizer-line'); // Use the existing HTML element

        this.drawHeaders();
        this.renderVisibleTiles();
    }

    // Helper to get total width/height of actual columns/rows
    getTotalColumnWidth(count) {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += this.columns[i].width;
        }
        return total;
    }

    getTotalRowHeight(count) {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += this.rows[i].height;
        }
        return total;
    }

    // New: Calculate cumulative widths/heights up to a certain index
    getCumulativeColumnWidth(colIndex) {
        let width = 0;
        for (let i = 0; i < colIndex; i++) {
            width += this.columns[i].width;
        }
        return width;
    }

    getCumulativeRowHeight(rowIndex) {
        let height = 0;
        for (let i = 0; i < rowIndex; i++) {
            height += this.rows[i].height;
        }
        return height;
    }


    updateHeaderCanvasSizes() {
        const wrapperWidth = this.gridWrapper.clientWidth;
        const wrapperHeight = this.gridWrapper.clientHeight;

        const colHeaderWidth = wrapperWidth - HEADER_WIDTH;
        const colHeaderHeight = HEADER_HEIGHT;
        this.colHeaderCanvas.width = colHeaderWidth * window.devicePixelRatio;
        this.colHeaderCanvas.height = colHeaderHeight * window.devicePixelRatio;
        this.colHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.colHeaderCanvas.style.width = `${colHeaderWidth}px`;
        this.colHeaderCanvas.style.height = `${colHeaderHeight}px`;

        const rowHeaderWidth = HEADER_WIDTH;
        const rowHeaderHeight = wrapperHeight - HEADER_HEIGHT;
        this.rowHeaderCanvas.width = rowHeaderWidth * window.devicePixelRatio;
        this.rowHeaderCanvas.height = rowHeaderHeight * window.devicePixelRatio;
        this.rowHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.rowHeaderCanvas.style.width = `${rowHeaderWidth}px`;
        this.rowHeaderCanvas.style.height = `${rowHeaderHeight}px`;
    }

    drawHeaders() {
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;

        // Draw Column Headers
        const colCtx = this.colHeaderCtx;
        colCtx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
        colCtx.font = '12px Inter';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.fillStyle = '#4b5563';
        colCtx.lineWidth = 1;
        colCtx.strokeStyle = '#d1d5db';

        // Determine visible columns based on scrollLeft and container width
        let currentX = 0;
        let startCol = 0;
        for (let i = 0; i < TOTAL_COLUMNS; i++) {
            const colWidth = this.columns[i].width; // Get width from Column object
            if (currentX + colWidth > scrollLeft) {
                startCol = i;
                break;
            }
            currentX += colWidth;
        }

        let drawnWidth = 0;
        for (let c = startCol; c < TOTAL_COLUMNS; c++) {
            const colWidth = this.columns[c].width; // Get width from Column object
            const x = currentX - scrollLeft;

            if (drawnWidth > this.colHeaderCanvas.clientWidth + DEFAULT_COLUMN_WIDTH * TILE_BUFFER_COLS) break;

            colCtx.fillStyle = '#f8f8f8';
            colCtx.fillRect(x, 0, colWidth, HEADER_HEIGHT);
            colCtx.strokeRect(x, 0, colWidth, HEADER_HEIGHT);
            colCtx.fillStyle = '#4b5563';
            colCtx.fillText(getColumnName(c), x + colWidth / 2, HEADER_HEIGHT / 2);

            currentX += colWidth;
            drawnWidth += colWidth;
        }


        // Draw Row Headers
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Inter';
        rowCtx.textAlign = 'center';
        rowCtx.textBaseline = 'middle';
        rowCtx.fillStyle = '#4b5563';
        rowCtx.lineWidth = 1;
        rowCtx.strokeStyle = '#d1d5db';

        // Determine visible rows based on scrollTop and container height
        let currentY = 0;
        let startRow = 0;
        for (let i = 0; i < TOTAL_ROWS; i++) {
            const rowHeight = this.rows[i].height; // Get height from Row object
            if (currentY + rowHeight > scrollTop) {
                startRow = i;
                break;
            }
            currentY += rowHeight;
        }

        let drawnHeight = 0;
        for (let r = startRow; r < TOTAL_ROWS; r++) {
            const rowHeight = this.rows[r].height; // Get height from Row object
            const y = currentY - scrollTop;

            if (drawnHeight > this.rowHeaderCanvas.clientHeight + DEFAULT_ROW_HEIGHT * TILE_BUFFER_ROWS) break;

            rowCtx.fillStyle = '#f8f8f8';
            rowCtx.fillRect(0, y, HEADER_WIDTH, rowHeight);
            rowCtx.strokeRect(0, y, HEADER_WIDTH, rowHeight);
            rowCtx.fillStyle = '#4b5563';
            rowCtx.fillText(`${r + 1}`, HEADER_WIDTH / 2, y + rowHeight / 2);

            currentY += rowHeight;
            drawnHeight += rowHeight;
        }
    }

    _handleResize() {
        this.updateHeaderCanvasSizes();
        this._handleScroll();
    }

    _handleScroll() {
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const containerHeight = this.container.clientHeight;
        const containerWidth = this.container.clientWidth;

        this.drawHeaders();
        const startVisibleTileRow = Math.floor(scrollTop / (VISIBLE_ROWS_PER_CANVAS_TILE * DEFAULT_ROW_HEIGHT));
        const endVisibleTileRow = Math.ceil((scrollTop + containerHeight) / (VISIBLE_ROWS_PER_CANVAS_TILE * DEFAULT_ROW_HEIGHT));
        const startVisibleTileCol = Math.floor(scrollLeft / (VISIBLE_COLS_PER_CANVAS_TILE * DEFAULT_COLUMN_WIDTH));
        const endVisibleTileCol = Math.ceil((scrollLeft + containerWidth) / (VISIBLE_COLS_PER_CANVAS_TILE * DEFAULT_COLUMN_WIDTH));


        const bufferedStartTileRow = Math.max(0, startVisibleTileRow - TILE_BUFFER_ROWS);
        const bufferedEndTileRow = Math.min(
            Math.ceil(TOTAL_ROWS / VISIBLE_ROWS_PER_CANVAS_TILE),
            endVisibleTileRow + TILE_BUFFER_ROWS
        );
        const bufferedStartTileCol = Math.max(0, startVisibleTileCol - TILE_BUFFER_COLS);
        const bufferedEndTileCol = Math.min(
            Math.ceil(TOTAL_COLUMNS / VISIBLE_COLS_PER_CANVAS_TILE),
            endVisibleTileCol + TILE_BUFFER_COLS
        );

        const tilesToRender = new Set();
        let currentMaxGlobalRow = 0;
        let currentMaxGlobalCol = 0;
        let maxRenderedGlobalRowIndex = -1; // Track the highest global row index covered by a tile
        let maxRenderedGlobalColIndex = -1;
        for (let r = bufferedStartTileRow; r < bufferedEndTileRow; r++) {
            for (let c = bufferedStartTileCol; c < bufferedEndTileCol; c++) {
                const tileKey = `${r}_${c}`;
                tilesToRender.add(tileKey);

                let tile = this.canvasTiles.get(tileKey);
                if (!tile) {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.className = 'grid-canvas-tile';
                    this.container.appendChild(newCanvas);
                    tile = new CanvasTile(newCanvas, this, r, c);
                    this.canvasTiles.set(tileKey, tile);
                }
                tile.updateDimensionsAndPosition(); // Update on scroll/resize
                tile.draw();

                currentMaxGlobalRow = Math.max(currentMaxGlobalRow, tile.endGlobalRow);
                currentMaxGlobalCol = Math.max(currentMaxGlobalCol, tile.endGlobalCol);
            }
        }

        // Remove old tiles
        for (const [key, tileInstance] of this.canvasTiles.entries()) {
            if (!tilesToRender.has(key)) {
                this.container.removeChild(tileInstance.canvasElement);
                tileInstance.dispose();
                this.canvasTiles.delete(key);
            }
        }

        // Update content sizer based on actual content dimensions
        const effectiveGridWidth = Math.max(
            containerWidth,
            this.getCumulativeColumnWidth(Math.min(TOTAL_COLUMNS, maxRenderedGlobalColIndex + 1)) // +1 to get width up to this column
        );
        const effectiveGridHeight = Math.max(
            containerHeight,
            this.getCumulativeRowHeight(Math.min(TOTAL_ROWS, maxRenderedGlobalRowIndex + 1)) // +1 to get height up to this row
        );

        this.contentSizer.style.width = `${effectiveGridWidth}px`;
        this.contentSizer.style.height = `${effectiveGridHeight}px`;
    }

    renderVisibleTiles() {
        this._handleScroll();
    }

    // --- Resizing Logic ---

    _handleColHeaderMouseDown(e) {
        const rect = this.colHeaderCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        let currentX = 0;
        for (let i = 0; i < TOTAL_COLUMNS; i++) {
            const colWidth = this.columns[i].width; // Use Column object
            const colRight = currentX + colWidth;

            if (mouseX >= colRight - 5 && mouseX <= colRight + 5) {
                this.isResizingCol = true;
                this.resizingIndex = i;
                this.initialPos = e.clientX;
                this.initialSize = colWidth;
                this.resizerLine.classList.add("vertical-line");
                this.resizerLine.classList.remove("horizontal-line");

                this.resizerLine.style.display = 'block';
                this.resizerLine.style.width = '2px';
                this.resizerLine.style.height = `${this.gridWrapper.clientHeight}px`;
                this.resizerLine.style.left = `${rect.left + colRight + this.container.scrollLeft}px`;
                this.resizerLine.style.top = '0px';
                this.gridWrapper.style.cursor = 'col-resize';
                return;
            }
            currentX += colWidth;
        }
    }

    _handleRowHeaderMouseDown(e) {
        const rect = this.rowHeaderCanvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;

        let currentY = 0;
        for (let i = 0; i < TOTAL_ROWS; i++) {
            const rowHeight = this.rows[i].height; // Use Row object
            const rowBottom = currentY + rowHeight;

            if (mouseY >= rowBottom - 5 && mouseY <= rowBottom + 5) {
                this.isResizingRow = true;
                this.resizingIndex = i;
                this.initialPos = e.clientY;
                this.initialSize = rowHeight;

                this.resizerLine.style.display = 'block';
                this.resizerLine.style.height = '2px';
                this.resizerLine.classList.remove("vertical-line");

                this.resizerLine.classList.add("horizontal-line");
                this.resizerLine.style.width = `${this.gridWrapper.clientWidth}px`;
                this.resizerLine.style.top = `${rect.top + rowBottom + this.container.scrollTop}px`;
                this.resizerLine.style.left = '0px';
                this.gridWrapper.style.cursor = 'row-resize';
                return;
            }
            currentY += rowHeight;
        }
    }

    _handleMouseMove(e) {
        if (this.isResizingCol) {
            const deltaX = e.clientX - this.initialPos;
            // Update the width property of the Column object
            this.columns[this.resizingIndex].width = this.initialSize + deltaX;

            const colHeaderRect = this.colHeaderCanvas.getBoundingClientRect();
            const currentResizerLineX = colHeaderRect.left + this.getCumulativeColumnWidth(this.resizingIndex + 1) - this.container.scrollLeft;
            this.resizerLine.style.left = `${currentResizerLineX}px`;
        } else if (this.isResizingRow) {
            const deltaY = e.clientY - this.initialPos;
            // Update the height property of the Row object
            this.rows[this.resizingIndex].height = this.initialSize + deltaY;

            const rowHeaderRect = this.rowHeaderCanvas.getBoundingClientRect();
            const currentResizerLineY = rowHeaderRect.top + this.getCumulativeRowHeight(this.resizingIndex + 1) - this.container.scrollTop;
            this.resizerLine.style.top = `${currentResizerLineY}px`;
        } else {
            const colHeaderRect = this.colHeaderCanvas.getBoundingClientRect();
            const rowHeaderRect = this.rowHeaderCanvas.getBoundingClientRect();

            const mouseX = e.clientX - colHeaderRect.left;
            const mouseY = e.clientY - rowHeaderRect.top;

            let cursorChanged = false;
            // Check for column resize hover
            let currentX = 0;
            for (let i = 0; i < TOTAL_COLUMNS; i++) {
                const colWidth = this.columns[i].width; // Use Column object
                const colRight = currentX + colWidth;
                if (mouseX >= colRight - 5 && mouseX <= colRight + 5) {
                    this.gridWrapper.style.cursor = 'col-resize';
                    cursorChanged = true;
                    break;
                }
                currentX += colWidth;
            }

            // Check for row resize hover
            let currentY = 0;
            for (let i = 0; i < TOTAL_ROWS; i++) {
                const rowHeight = this.rows[i].height; // Use Row object
                const rowBottom = currentY + rowHeight;
                if (mouseY >= rowBottom - 5 && mouseY <= rowBottom + 5) {
                    this.gridWrapper.style.cursor = 'row-resize';
                    cursorChanged = true;
                    break;
                }
                currentY += rowHeight;
            }

            if (!cursorChanged) {
                this.gridWrapper.style.cursor = 'default';
            }
        }
    }

    _handleMouseUp() {
        if (this.isResizingCol || this.isResizingRow) {
            this.isResizingCol = false;
            this.isResizingRow = false;
            this.resizingIndex = -1;
            this.resizerLine.style.display = 'none';
            this.gridWrapper.style.cursor = 'default';
            this._handleScroll(); // Trigger full redraw after resize
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');
});
