import { GridRow } from "./row.js";
import { GridColumn } from "./column.js";
import { Cell } from "./cell.js";
import { CanvasTile } from "./canvasTile.js";
import { getColumnName } from "./column.js";
import {
    TOTAL_ROWS,
    TOTAL_COLUMNS,
    DEFAULT_ROW_HEIGHT,
    DEFAULT_COLUMN_WIDTH,
    HEADER_HEIGHT,
    HEADER_WIDTH,
    VISIBLE_ROWS_PER_CANVAS_TILE,
    VISIBLE_COLS_PER_CANVAS_TILE,
    TILE_BUFFER_ROWS,
    TILE_BUFFER_COLS
} from './config.js';


// for reduce multiple calling
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}


class Grid {
    constructor(containerId) {
        this.gridWrapper = document.getElementById('grid-wrapper');
        this.container = document.getElementById(containerId);
        if (!this.container || !this.gridWrapper) {
            console.error('Required grid elements not found.');
            return;
        }

        this.columns = [];
        this.rows = [];
        this.cells = new Map();

        for (let i = 0; i < TOTAL_COLUMNS; i++) {
            this.columns.push(new GridColumn(i));
        }

        for (let i = 0; i < TOTAL_ROWS; i++) {
            this.rows.push(new GridRow(i));
        }

        this.canvasTiles = new Map();
        this.contentSizer = document.getElementById('grid-content-sizer');
        this.colHeaderCanvas = document.getElementById('column-header-canvas');
        this.colHeaderCtx = this.colHeaderCanvas.getContext('2d');
        this.rowHeaderCanvas = document.getElementById('row-header-canvas');
        this.rowHeaderCtx = this.rowHeaderCanvas.getContext('2d');

        this.resizeHandles = [];
        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.resizeStartPos = 0;
        this.resizeStartSize = 0;
        this.selectedCell = null;
        this.isEditing = false;
        this.cellInput = null;
        this.initializeResizeHandling();
        this.updateHeaderCanvasSizes();
        this.drawHeaders();
        this.renderVisibleTiles();

        this.handleScroll = debounce(this.HandleScroll.bind(this), 10);
        this.container.addEventListener('scroll', this.handleScroll);

        this.handleResize = debounce(this.HandleResize.bind(this), 100);
        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('click', this.handleCellClick.bind(this));
        this.container.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));
    }
    handleCellClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.selectCell(cellCoords.row, cellCoords.col);
            }
        }
    }

    handleCellDoubleClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.startCellEdit(cellCoords.row, cellCoords.col);
            }
        }
    }

    getCellFromPosition(x, y, tileRow, tileCol) {
        const startGlobalRow = tileRow * VISIBLE_ROWS_PER_CANVAS_TILE;
        const startGlobalCol = tileCol * VISIBLE_COLS_PER_CANVAS_TILE;

        let currentY = 0;
        for (let r = startGlobalRow; r < Math.min(startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS); r++) {
            const rowHeight = this.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                let currentX = 0;
                for (let c = startGlobalCol; c < Math.min(startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS); c++) {
                    const colWidth = this.getColumnWidth(c);
                    if (x >= currentX && x < currentX + colWidth) {
                        return { row: r, col: c };
                    }
                    currentX += colWidth;
                }
            }
            currentY += rowHeight;
        }
        return null;
    }

    selectCell(row, col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        const previousSelection = this.selectedCell;
        this.selectedCell = { row, col };

        // Redraw affected tiles
        if (previousSelection) {
            this.redrawCellInTiles(previousSelection.row, previousSelection.col);
        }
        this.redrawCellInTiles(row, col);
    }

    startCellEdit(row, col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        this.selectCell(row, col);
        this.isEditing = true;

        // Create input element
        this.cellInput = document.createElement('input');
        this.cellInput.type = 'text';
        this.cellInput.className = 'cell-input';

        const cell = this.getCell(row, col);
        this.cellInput.value = cell.value || '';

        // Position the input
        this.positionCellInput(row, col);

        // Add event listeners
        this.cellInput.addEventListener('blur', this.finishCellEdit.bind(this));
        this.cellInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishCellEdit();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.cancelCellEdit();
                e.preventDefault();
            }
        });

        this.container.appendChild(this.cellInput);
        this.cellInput.focus();
        this.cellInput.select();
    }

    positionCellInput(row, col) {
        let left = 0;
        for (let c = 0; c < col; c++) {
            left += this.getColumnWidth(c);
        }

        let top = 0;
        for (let r = 0; r < row; r++) {
            top += this.getRowHeight(r);
        }

        const colWidth = this.getColumnWidth(col);
        const rowHeight = this.getRowHeight(row);

        this.cellInput.style.position = 'absolute';
        this.cellInput.style.left = `${left}px`;
        this.cellInput.style.top = `${top}px`;
        this.cellInput.style.width = `${colWidth - 1}px`;
        this.cellInput.style.height = `${rowHeight - 1}px`;
        this.cellInput.style.border = '2px solid #137E43';
        this.cellInput.style.outline = 'none';
        this.cellInput.style.fontSize = '12px';
        this.cellInput.style.padding = '2px';
        this.cellInput.style.zIndex = '1000';
    }

    finishCellEdit() {
        if (!this.isEditing || !this.cellInput) return;

        const newValue = this.cellInput.value;
        const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        const oldValue = cell.value || '';

        // Only update and redraw if value actually changed
        if (newValue !== oldValue) {
            cell.setValue(newValue);
            // Redraw only the edited cell
            this.redrawCellInTiles(this.selectedCell.row, this.selectedCell.col);
        }

        this.container.removeChild(this.cellInput);
        this.cellInput = null;
        this.isEditing = false;
    }

    cancelCellEdit() {
        if (!this.isEditing || !this.cellInput) return;

        this.container.removeChild(this.cellInput);
        this.cellInput = null;
        this.isEditing = false;
    }

    redrawCellInTiles(row, col) {
        const tileRow = Math.floor(row / VISIBLE_ROWS_PER_CANVAS_TILE);
        const tileCol = Math.floor(col / VISIBLE_COLS_PER_CANVAS_TILE);
        const tileKey = `${tileRow}_${tileCol}`;

        const tile = this.canvasTiles.get(tileKey);
        if (tile) {
            tile.drawSingleCell(row, col); // Use optimized method
        }
    }


    getColumnWidth(index) {
        return this.columns[index]?.width || DEFAULT_COLUMN_WIDTH;
    }

    getRowHeight(index) {
        return this.rows[index]?.height || DEFAULT_ROW_HEIGHT;
    }

    setColumnWidth(index, width) {
        if (this.columns[index]) {
            this.columns[index].setWidth(width);
            this.redrawGrid();
        }
    }

    setRowHeight(index, height) {
        if (this.rows[index]) {
            this.rows[index].setHeight(height);
            this.redrawGrid();
        }
    }

    getCell(rowIndex, colIndex) {
        const key = `${rowIndex}_${colIndex}`;
        if (!this.cells.has(key)) {
            this.cells.set(key, new Cell(rowIndex, colIndex));
        }
        return this.cells.get(key);
    }
    cellHasContent(row, col) {
        const cell = this.getCell(row, col);
        return cell.hasContent();
    }

    initializeResizeHandling() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    createResizeHandles() {
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = [];

        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;

        const colHeaderContainer = document.getElementById('column-header-container');

        let currentX = 0;
        let startCol = 0;

        while (currentX < scrollLeft && startCol < TOTAL_COLUMNS) {
            currentX += this.getColumnWidth(startCol);
            startCol++;
        }
        if (startCol > 0) {
            startCol--;
            currentX -= this.getColumnWidth(startCol);
        }


        const visibleCols = Math.ceil(colHeaderContainer.clientWidth / DEFAULT_COLUMN_WIDTH) + 3;
        for (let i = 0; i < visibleCols && (startCol + i) < TOTAL_COLUMNS; i++) {
            const c = startCol + i;
            const colWidth = this.getColumnWidth(c);
            currentX += colWidth;

            const handleX = currentX - scrollLeft - 2;

            if (handleX >= -5 && handleX <= colHeaderContainer.clientWidth + 5) {
                const handle = document.createElement('div');
                handle.className = 'resize-handle col-resize-handle';
                handle.style.left = `${handleX}px`;
                handle.style.top = '0px';
                // handle.style.marginLeft = '2px';

                handle.dataset.type = 'column';
                handle.dataset.index = c;
                if (colWidth <= 0.5) {
                    handle.classList.add("collapsHandle");
                }
                else {

                    handle.classList.remove("collapsHandle");
                }


                handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
                colHeaderContainer.appendChild(handle);
                this.resizeHandles.push(handle);
            }
        }


        const rowHeaderContainer = document.getElementById('row-header-container');

        let currentY = 0;
        let startRow = 0;

        while (currentY < scrollTop && startRow < TOTAL_ROWS) {
            currentY += this.getRowHeight(startRow);
            startRow++;
        }
        if (startRow > 0) {
            startRow--;
            currentY -= this.getRowHeight(startRow);
        }

        const visibleRows = Math.ceil(rowHeaderContainer.clientHeight / DEFAULT_ROW_HEIGHT) + 3;
        for (let i = 0; i < visibleRows && (startRow + i) < TOTAL_ROWS; i++) {
            const r = startRow + i;
            const rowHeight = this.getRowHeight(r);
            currentY += rowHeight;

            const handleY = currentY - scrollTop - 2;

            if (handleY >= -5 && handleY <= rowHeaderContainer.clientHeight + 5) {
                const handle = document.createElement('div');
                handle.className = 'resize-handle row-resize-handle';
                handle.style.left = '0px';
                handle.style.top = `${handleY}px`;
                handle.dataset.type = 'row';
                handle.dataset.index = r;
                if (rowHeight <= 0.5) {
                    handle.classList.add("collapsHandleHorizontal");
                }
                else {

                    handle.classList.remove("collapsHandleHorizontal");
                }
                handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
                rowHeaderContainer.appendChild(handle);
                this.resizeHandles.push(handle);
            }
        }
    }

    handleResizeStart(e) {
        e.preventDefault();
        this.isResizing = true;
        this.resizeType = e.target.dataset.type;
        this.resizeIndex = parseInt(e.target.dataset.index);

        if (this.resizeType === 'column') {
            this.resizeStartPos = e.clientX;
            this.resizeStartSize = this.getColumnWidth(this.resizeIndex);
        } else {
            this.resizeStartPos = e.clientY;
            this.resizeStartSize = this.getRowHeight(this.resizeIndex);
        }

        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.display = 'block';
        if (this.resizeType === 'column') {
            resizerLine.className = 'vertical-line';
            resizerLine.style.width = '2px';
            resizerLine.style.height = `${window.innerHeight}px`;
            resizerLine.style.left = `${e.clientX}px`;
            resizerLine.style.top = '0px';
        } else {
            resizerLine.className = 'horizontal-line';
            resizerLine.style.width = '100%';
            resizerLine.style.height = '2px';
            resizerLine.style.left = '0px';
            resizerLine.style.top = `${e.clientY}px`;
        }

        document.body.style.cursor = this.resizeType === 'column' ? 'col-resize' : 'row-resize';
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;

        const resizerLine = document.getElementById('resizer-line');

        if (this.resizeType === 'column' && this.resizeStartPos - this.resizeStartSize <= e.clientX) {
            resizerLine.style.left = `${e.clientX}px`;
        } else if (this.resizeType === 'row' && this.resizeStartPos - this.resizeStartSize < e.clientY) {
            resizerLine.style.top = `${e.clientY}px`;
        }
    }

    handleMouseUp(e) {
        if (!this.isResizing) return;

        const delta = this.resizeType === 'column'
            ? e.clientX - this.resizeStartPos
            : e.clientY - this.resizeStartPos;

        const newSize = this.resizeStartSize + delta;

        if (this.resizeType === 'column') {
            this.setColumnWidth(this.resizeIndex, newSize);
        } else {
            this.setRowHeight(this.resizeIndex, newSize);
        }

        // Hide resize line
        document.getElementById('resizer-line').style.display = 'none';
        document.body.style.cursor = 'default';

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
    }

    redrawGrid() {
        for (const [key, tile] of this.canvasTiles.entries()) {
            tile.draw();
        }
        this.drawHeaders();
        this.createResizeHandles();
        // this.updateContentSizer();
    }

    updateContentSizer() {
        let totalWidth = 0;
        let totalHeight = 0;

        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            totalWidth += this.getColumnWidth(c);
        }

        for (let r = 0; r < TOTAL_ROWS; r++) {
            totalHeight += this.getRowHeight(r);
        }

        this.contentSizer.style.width = `${totalWidth}px`;
        this.contentSizer.style.height = `${totalHeight}px`;
    }

    updateHeaderCanvasSizes() {
        const wrapperWidth = this.gridWrapper.clientWidth;
        const wrapperHeight = this.gridWrapper.clientHeight;

        const colHeaderWidth = wrapperWidth - HEADER_WIDTH;
        const colHeaderHeight = HEADER_HEIGHT;
        this.colHeaderCanvas.width = colHeaderWidth * window.devicePixelRatio;
        this.colHeaderCanvas.height = colHeaderHeight * window.devicePixelRatio;
        this.colHeaderCanvas.style.width = `${colHeaderWidth}px`;
        this.colHeaderCanvas.style.height = `${colHeaderHeight}px`;
        this.colHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const rowHeaderWidth = HEADER_WIDTH;
        const rowHeaderHeight = wrapperHeight - HEADER_HEIGHT;
        this.rowHeaderCanvas.width = rowHeaderWidth * window.devicePixelRatio;
        this.rowHeaderCanvas.height = rowHeaderHeight * window.devicePixelRatio;
        this.rowHeaderCanvas.style.width = `${rowHeaderWidth}px`;
        this.rowHeaderCanvas.style.height = `${rowHeaderHeight}px`;
        this.rowHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    drawHeaders() {
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;

        // Draw column headers
        const colCtx = this.colHeaderCtx;
        colCtx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
        colCtx.font = '12px Arial';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.fillStyle = '#4b5563';
        colCtx.lineWidth = 1;
        colCtx.strokeStyle = '#d1d5db';

        let currentX = -scrollLeft;
        let startCol = 0;

        // Find starting column
        while (currentX < 0 && startCol < TOTAL_COLUMNS) {
            currentX += this.getColumnWidth(startCol);
            startCol++;
        }
        if (startCol > 0) {
            startCol--;
            currentX -= this.getColumnWidth(startCol);
        }

        // Draw visible columns
        for (let c = startCol; c < TOTAL_COLUMNS && currentX < this.colHeaderCanvas.clientWidth; c++) {
            const colWidth = this.getColumnWidth(c);

            colCtx.fillStyle = '#f8f8f8';
            colCtx.fillRect(currentX, 0, colWidth, HEADER_HEIGHT);
            colCtx.strokeRect(currentX, 0, colWidth, HEADER_HEIGHT);
            colCtx.fillStyle = '#4b5563';
            if (colWidth > 10)
                colCtx.fillText(getColumnName(c), currentX + colWidth / 2, HEADER_HEIGHT / 2);

            currentX += colWidth;
        }

        // Draw row headers
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Arial';
        rowCtx.textAlign = 'center';
        rowCtx.textBaseline = 'middle';
        rowCtx.fillStyle = '#4b5563';
        rowCtx.lineWidth = 1;
        rowCtx.strokeStyle = '#d1d5db';

        let currentY = -scrollTop;
        let startRow = 0;

        // Find starting row
        while (currentY < 0 && startRow < TOTAL_ROWS) {
            currentY += this.getRowHeight(startRow);
            startRow++;
        }
        if (startRow > 0) {
            startRow--;
            currentY -= this.getRowHeight(startRow);
        }

        // Draw visible rows
        for (let r = startRow; r < TOTAL_ROWS && currentY < this.rowHeaderCanvas.clientHeight; r++) {
            const rowHeight = this.getRowHeight(r);

            rowCtx.fillStyle = '#f8f8f8';
            rowCtx.fillRect(0, currentY, HEADER_WIDTH, rowHeight);
            rowCtx.strokeRect(0, currentY, HEADER_WIDTH, rowHeight);
            rowCtx.fillStyle = '#4b5563';
            if (rowHeight > 10)
                rowCtx.fillText(`${r + 1}`, HEADER_WIDTH / 2, currentY + rowHeight / 2);

            currentY += rowHeight;
        }

        this.createResizeHandles();
    }

    HandleResize() {
        this.updateHeaderCanvasSizes();
        this.HandleScroll();
    }

    HandleScroll() {
        this.renderVisibleTiles();
    }

    renderVisibleTiles() {
        this.drawHeaders();
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const containerHeight = this.container.clientHeight;
        const containerWidth = this.container.clientWidth;

        // Calculate tile ranges (simplified for now)
        const avgTileHeight = VISIBLE_ROWS_PER_CANVAS_TILE * DEFAULT_ROW_HEIGHT;
        const avgTileWidth = VISIBLE_COLS_PER_CANVAS_TILE * DEFAULT_COLUMN_WIDTH;

        const startVisibleTileRow = Math.floor(scrollTop / avgTileHeight);
        const endVisibleTileRow = Math.ceil((scrollTop + containerHeight) / avgTileHeight);
        const startVisibleTileCol = Math.floor(scrollLeft / avgTileWidth);
        const endVisibleTileCol = Math.ceil((scrollLeft + containerWidth) / avgTileWidth);

        const bufferedStartTileRow = Math.max(0, startVisibleTileRow - TILE_BUFFER_ROWS);
        const bufferedEndTileRow = Math.min(Math.ceil(TOTAL_ROWS / VISIBLE_ROWS_PER_CANVAS_TILE), endVisibleTileRow + TILE_BUFFER_ROWS);
        const bufferedStartTileCol = Math.max(0, startVisibleTileCol - TILE_BUFFER_COLS);
        const bufferedEndTileCol = Math.min(Math.ceil(TOTAL_COLUMNS / VISIBLE_COLS_PER_CANVAS_TILE), endVisibleTileCol + TILE_BUFFER_COLS);

        const tilesToRender = new Set();

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
                tile.draw();
            }
        }

        // Remove tiles that are no longer visible
        for (const [key, tileInstance] of this.canvasTiles.entries()) {
            if (!tilesToRender.has(key)) {
                this.container.removeChild(tileInstance.canvasElement);
                this.canvasTiles.delete(key);
            }
        }

        // this.updateContentSizer();f
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');
});