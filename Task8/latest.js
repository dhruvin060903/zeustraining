const TOTAL_ROWS = 100000; // Support 1 lakh rows
const TOTAL_COLUMNS = 500; // Support 500 columns
const ROW_HEIGHT = 28; // Height of each row in pixels
const COLUMN_WIDTH = 100; // Width of each column in pixels
const HEADER_HEIGHT = 28; // Height of the fixed column header row
const HEADER_WIDTH = 50; // Width of the fixed row header column

const VISIBLE_ROWS_PER_CANVAS_TILE = 50;
const VISIBLE_COLS_PER_CANVAS_TILE = 30;

const TILE_BUFFER_ROWS = 1;
const TILE_BUFFER_COLS = 1;

/**
 * Converts a column index (0-based) to its Excel-style column name (A, B, AA, AB, etc.).
 * @param {number} colIndex - The 0-based column index.
 * @returns {string} The Excel-style column name.
 */
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

/**
 * Debounces a function, ensuring it's only called after a certain delay.
 * @param {function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {function} The debounced function.
 */
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
        this.formula = '';
        this.isSelected = false;
        // In a real application, you'd add more properties like:
        // this.style = {};
        // this.dataType = 'text';
    }

    // Example method to get cell content for display
    getContent() {
        if (this.value) {
            return this.value;
        }
        return ''; // Empty cell
    }

    setValue(value) {
        this.value = value;
    }

    setFormula(formula) {
        this.formula = formula;
        // In a real implementation, you'd calculate the value from the formula
        this.value = formula; // Simplified for now
    }
}

class InputCell {
    constructor(grid) {
        this.grid = grid;
        this.isActive = false;
        this.currentCell = null;
        this.inputElement = null;
        this.createInputElement();
        this.setupEventListeners();
    }

    createInputElement() {
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'cell-input';
        this.inputElement.style.cssText = `
            position: absolute;
            border: 2px solid #3b82f6;
            outline: none;
            font-family: Arial, sans-serif;
            font-size: 12px;
            padding: 2px 4px;
            background-color: white;
            z-index: 1000;
            display: none;
            box-sizing: border-box;
        `;
        document.body.appendChild(this.inputElement);
    }

    setupEventListeners() {
        // Handle input completion
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.commitEdit();
                this.moveToNextCell('down');
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.commitEdit();
                this.moveToNextCell(e.shiftKey ? 'left' : 'right');
            } else if (e.key === 'Escape') {
                this.cancelEdit();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Allow arrow keys within input unless at edge
                if (this.isAtInputEdge(e.key)) {
                    e.preventDefault();
                    this.commitEdit();
                    this.moveToNextCell(this.getDirectionFromKey(e.key));
                }
            }
        });

        // Handle losing focus
        this.inputElement.addEventListener('blur', () => {
            if (this.isActive) {
                this.commitEdit();
            }
        });

        // Prevent input from losing focus when clicking on grid
        this.inputElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    }

    isAtInputEdge(key) {
        const input = this.inputElement;
        const selStart = input.selectionStart;
        const selEnd = input.selectionEnd;
        const value = input.value;

        switch (key) {
            case 'ArrowLeft':
                return selStart === 0 && selEnd === 0;
            case 'ArrowRight':
                return selStart === value.length && selEnd === value.length;
            case 'ArrowUp':
            case 'ArrowDown':
                return true; // Always move to next cell for up/down
            default:
                return false;
        }
    }

    getDirectionFromKey(key) {
        const directions = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        return directions[key];
    }

    startEdit(rowIndex, colIndex, initialValue = '') {
        if (this.isActive) {
            this.commitEdit();
        }

        this.currentCell = { rowIndex, colIndex };
        this.isActive = true;

        // Get or create the cell
        const cellKey = `${rowIndex}_${colIndex}`;
        if (!this.grid.cells.has(cellKey)) {
            this.grid.cells.set(cellKey, new Cell(rowIndex, colIndex));
        }
        const cell = this.grid.cells.get(cellKey);

        // Position the input element
        this.positionInput(rowIndex, colIndex);

        // Set initial value
        this.inputElement.value = initialValue || cell.getContent();
        this.inputElement.style.display = 'block';
        this.inputElement.focus();
        this.inputElement.select();

        // Update selection
        this.grid.setSelectedCell(rowIndex, colIndex);
    }

    positionInput(rowIndex, colIndex) {
        // Calculate the position relative to the viewport
        const gridRect = this.grid.container.getBoundingClientRect();
        const scrollTop = this.grid.container.scrollTop;
        const scrollLeft = this.grid.container.scrollLeft;

        // Cell position within the grid
        const cellX = colIndex * COLUMN_WIDTH - scrollLeft;
        const cellY = rowIndex * ROW_HEIGHT - scrollTop;

        // Absolute position on the page
        const left = gridRect.left + cellX;
        const top = gridRect.top + cellY;

        this.inputElement.style.left = `${left}px`;
        this.inputElement.style.top = `${top}px`;
        this.inputElement.style.width = `${COLUMN_WIDTH}px`;
        this.inputElement.style.height = `${ROW_HEIGHT}px`;
    }

    commitEdit() {
        if (!this.isActive || !this.currentCell) return;

        const value = this.inputElement.value;
        const { rowIndex, colIndex } = this.currentCell;
        const cellKey = `${rowIndex}_${colIndex}`;

        // Get or create the cell
        if (!this.grid.cells.has(cellKey)) {
            this.grid.cells.set(cellKey, new Cell(rowIndex, colIndex));
        }
        const cell = this.grid.cells.get(cellKey);

        // Update cell value
        if (value.startsWith('=')) {
            cell.setFormula(value);
        } else {
            cell.setValue(value);
        }

        this.hideInput();
        this.grid.redrawTileForCell(rowIndex, colIndex);
    }

    cancelEdit() {
        this.hideInput();
    }

    hideInput() {
        this.isActive = false;
        this.currentCell = null;
        this.inputElement.style.display = 'none';
        this.inputElement.value = '';
    }

    moveToNextCell(direction) {
        if (!this.currentCell) return;

        let { rowIndex, colIndex } = this.currentCell;

        switch (direction) {
            case 'up':
                rowIndex = Math.max(0, rowIndex - 1);
                break;
            case 'down':
                rowIndex = Math.min(TOTAL_ROWS - 1, rowIndex + 1);
                break;
            case 'left':
                colIndex = Math.max(0, colIndex - 1);
                break;
            case 'right':
                colIndex = Math.min(TOTAL_COLUMNS - 1, colIndex + 1);
                break;
        }

        // Ensure the new cell is visible
        this.grid.ensureCellVisible(rowIndex, colIndex);

        // Start editing the new cell
        setTimeout(() => {
            this.startEdit(rowIndex, colIndex);
        }, 10); // Small delay to ensure scroll is complete
    }

    updatePosition() {
        if (this.isActive && this.currentCell) {
            this.positionInput(this.currentCell.rowIndex, this.currentCell.colIndex);
        }
    }
}

class CanvasTile {
    /**
     * @param {HTMLCanvasElement} canvasElement - The canvas DOM element.
     * @param {Grid} grid - Reference to the main Grid instance.
     * @param {number} tileRowIndex - The 0-based row index of this tile in the grid of tiles.
     * @param {number} tileColIndex - The 0-based column index of this tile in the grid of tiles.
     */
    constructor(canvasElement, grid, tileRowIndex, tileColIndex) {
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.grid = grid;
        this.tileRowIndex = tileRowIndex;
        this.tileColIndex = tileColIndex;

        // Calculate the global start and end row/column for this tile
        this.startGlobalRow = tileRowIndex * VISIBLE_ROWS_PER_CANVAS_TILE;
        this.endGlobalRow = Math.min(this.startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS);
        this.startGlobalCol = tileColIndex * VISIBLE_COLS_PER_CANVAS_TILE;
        this.endGlobalCol = Math.min(this.startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS);

        // Calculate actual dimensions of this specific tile's content area
        const actualTileRows = this.endGlobalRow - this.startGlobalRow;
        const actualTileCols = this.endGlobalCol - this.startGlobalCol;

        // Tile width/height is just for its content, no headers included here
        this.width = (actualTileCols * COLUMN_WIDTH);
        this.height = (actualTileRows * ROW_HEIGHT);

        // Set canvas dimensions
        this.canvasElement.width = this.width * window.devicePixelRatio;
        this.canvasElement.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Position the canvas element within the grid-container (which is the scrollable area)
        this.canvasElement.style.width = `${this.width}px`;
        this.canvasElement.style.height = `${this.height}px`;
        // These positions are relative to the grid-container's top-left (0,0)
        this.canvasElement.style.left = `${this.tileColIndex * (VISIBLE_COLS_PER_CANVAS_TILE * COLUMN_WIDTH)}px`;
        this.canvasElement.style.top = `${this.tileRowIndex * (VISIBLE_ROWS_PER_CANVAS_TILE * ROW_HEIGHT)}px`;
        this.canvasElement.dataset.tileRow = tileRowIndex;
        this.canvasElement.dataset.tileCol = tileColIndex;

        // Add click event listener
        this.canvasElement.addEventListener('click', this.handleClick.bind(this));
        this.canvasElement.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    }

    handleClick(event) {
        const rect = this.canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate which cell was clicked
        const localCol = Math.floor(x / COLUMN_WIDTH);
        const localRow = Math.floor(y / ROW_HEIGHT);
        const globalCol = this.startGlobalCol + localCol;
        const globalRow = this.startGlobalRow + localRow;

        // Update selection
        this.grid.setSelectedCell(globalRow, globalCol);
    }

    handleDoubleClick(event) {
        const rect = this.canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate which cell was double-clicked
        const localCol = Math.floor(x / COLUMN_WIDTH);
        const localRow = Math.floor(y / ROW_HEIGHT);
        const globalCol = this.startGlobalCol + localCol;
        const globalRow = this.startGlobalRow + localRow;

        // Start editing
        this.grid.inputCell.startEdit(globalRow, globalCol);
    }

    /**
     * Draws the grid lines and cell content for this tile.
     * No headers are drawn here anymore.
     */
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151'; // Text color
        ctx.strokeStyle = '#e5e7eb'; // Lighter lines for grid

        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
                // Calculate local coordinates within this tile's canvas
                const x = (c - this.startGlobalCol) * COLUMN_WIDTH;
                const y = (r - this.startGlobalRow) * ROW_HEIGHT;

                // Check if this cell is selected
                const isSelected = this.grid.selectedCell &&
                    this.grid.selectedCell.rowIndex === r &&
                    this.grid.selectedCell.colIndex === c;

                // Draw cell background
                if (isSelected) {
                    ctx.fillStyle = '#dbeafe'; // Light blue background for selected cell
                    ctx.fillRect(x, y, COLUMN_WIDTH, ROW_HEIGHT);
                }

                // Draw cell border
                ctx.strokeStyle = isSelected ? '#3b82f6' : '#e5e7eb';
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.strokeRect(x, y, COLUMN_WIDTH, ROW_HEIGHT);

                // Get cell content
                const cellKey = `${r}_${c}`;
                const cell = this.grid.cells.get(cellKey) || new Cell(r, c);
                const content = cell.getContent();

                if (content) {
                    ctx.fillStyle = '#374151';
                    ctx.fillText(content, x + 4, y + ROW_HEIGHT / 2, COLUMN_WIDTH - 8);
                }

                // Reset line width
                ctx.lineWidth = 1;
            }
        }
    }
}

// --- Grid Class ---
// Manages the overall grid, its container, and the dynamic loading/unloading of canvas tiles.
class Grid {
    /**
     * @param {string} containerId - The ID of the HTML element that will contain the grid.
     */
    constructor(containerId) {
        this.gridWrapper = document.getElementById('grid-wrapper');
        this.container = document.getElementById(containerId); // This is now the scrollable content area
        if (!this.container || !this.gridWrapper) {
            console.error(`Required grid elements not found.`);
            return;
        }

        // Initialize cell storage
        this.cells = new Map(); // Map<key: string "row_col", value: Cell>
        this.selectedCell = null;

        // Initialize input cell functionality
        this.inputCell = new InputCell(this);

        // Set CSS variables for header dimensions on the wrapper
        this.gridWrapper.style.setProperty('--header-width', `${HEADER_WIDTH}px`);
        this.gridWrapper.style.setProperty('--header-height', `${HEADER_HEIGHT}px`);

        this.canvasTiles = new Map(); // Stores active CanvasTile instances: Map<key: string "row_col", value: CanvasTile>
        this.contentSizer = document.getElementById('grid-content-sizer');

        // Header canvases
        this.colHeaderCanvas = document.getElementById('column-header-canvas');
        this.colHeaderCtx = this.colHeaderCanvas.getContext('2d');
        this.rowHeaderCanvas = document.getElementById('row-header-canvas');
        this.rowHeaderCtx = this.rowHeaderCanvas.getContext('2d');

        // Set initial header canvas sizes
        this.updateHeaderCanvasSizes();

        // Initially, the content sizer reflects the minimum visible area.
        // It will expand as the user scrolls and new tiles are rendered.
        this.contentSizer.style.width = `${this.container.clientWidth}px`;
        this.contentSizer.style.height = `${this.container.clientHeight}px`;

        // Debounce the scroll handling to improve performance
        // Reduced debounce delay for smoother header synchronization
        this.handleScroll = debounce(this._handleScroll.bind(this), 10); // Changed from 50 to 10
        this.container.addEventListener('scroll', () => {
            this.handleScroll();
            // Update input position while scrolling
            if (this.inputCell.isActive) {
                this.inputCell.updatePosition();
            }
        });

        // Listen for window resize to adjust header canvas sizes and redraw
        this.handleResize = debounce(this._handleResize.bind(this), 100);
        window.addEventListener('resize', this.handleResize);

        // Handle keyboard navigation
        this.setupKeyboardHandling();

        // Initial render
        this.renderVisibleTiles();
        this.drawHeaders(); // Initial draw of headers
    }

    setupKeyboardHandling() {
        document.addEventListener('keydown', (e) => {
            // Only handle keys if input is not active and we have a selected cell
            if (this.inputCell.isActive || !this.selectedCell) return;

            const { rowIndex, colIndex } = this.selectedCell;
            let newRow = rowIndex;
            let newCol = colIndex;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRow = Math.max(0, rowIndex - 1);
                    break;
                case 'ArrowDown':
                case 'Enter':
                    e.preventDefault();
                    newRow = Math.min(TOTAL_ROWS - 1, rowIndex + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCol = Math.max(0, colIndex - 1);
                    break;
                case 'ArrowRight':
                case 'Tab':
                    e.preventDefault();
                    newCol = Math.min(TOTAL_COLUMNS - 1, colIndex + 1);
                    break;
                case 'F2':
                    e.preventDefault();
                    this.inputCell.startEdit(rowIndex, colIndex);
                    return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.clearCell(rowIndex, colIndex);
                    return;
                default:
                    // Start editing with the typed character
                    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                        this.inputCell.startEdit(rowIndex, colIndex, e.key);
                        return;
                    }
            }

            // Move selection if row or column changed
            if (newRow !== rowIndex || newCol !== colIndex) {
                this.ensureCellVisible(newRow, newCol);
                this.setSelectedCell(newRow, newCol);
            }
        });
    }

    setSelectedCell(rowIndex, colIndex) {
        const previousCell = this.selectedCell;
        this.selectedCell = { rowIndex, colIndex };

        // Redraw affected tiles
        if (previousCell) {
            this.redrawTileForCell(previousCell.rowIndex, previousCell.colIndex);
        }
        this.redrawTileForCell(rowIndex, colIndex);
    }

    clearCell(rowIndex, colIndex) {
        const cellKey = `${rowIndex}_${colIndex}`;
        if (this.cells.has(cellKey)) {
            this.cells.get(cellKey).setValue('');
            this.redrawTileForCell(rowIndex, colIndex);
        }
    }

    redrawTileForCell(rowIndex, colIndex) {
        const tileRow = Math.floor(rowIndex / VISIBLE_ROWS_PER_CANVAS_TILE);
        const tileCol = Math.floor(colIndex / VISIBLE_COLS_PER_CANVAS_TILE);
        const tileKey = `${tileRow}_${tileCol}`;

        const tile = this.canvasTiles.get(tileKey);
        if (tile) {
            tile.draw();
        }
    }

    ensureCellVisible(rowIndex, colIndex) {
        const cellTop = rowIndex * ROW_HEIGHT;
        const cellLeft = colIndex * COLUMN_WIDTH;
        const cellBottom = cellTop + ROW_HEIGHT;
        const cellRight = cellLeft + COLUMN_WIDTH;

        const containerTop = this.container.scrollTop;
        const containerLeft = this.container.scrollLeft;
        const containerBottom = containerTop + this.container.clientHeight;
        const containerRight = containerLeft + this.container.clientWidth;

        let newScrollTop = containerTop;
        let newScrollLeft = containerLeft;

        // Check vertical scrolling
        if (cellTop < containerTop) {
            newScrollTop = cellTop;
        } else if (cellBottom > containerBottom) {
            newScrollTop = cellBottom - this.container.clientHeight;
        }

        // Check horizontal scrolling
        if (cellLeft < containerLeft) {
            newScrollLeft = cellLeft;
        } else if (cellRight > containerRight) {
            newScrollLeft = cellRight - this.container.clientWidth;
        }

        // Scroll if needed
        if (newScrollTop !== containerTop || newScrollLeft !== containerLeft) {
            this.container.scrollTo(newScrollLeft, newScrollTop);
        }
    }

    /**
     * Adjusts the dimensions of the header canvases based on container size.
     */
    updateHeaderCanvasSizes() {
        const wrapperWidth = this.gridWrapper.clientWidth;
        const wrapperHeight = this.gridWrapper.clientHeight;

        // Column header canvas
        const colHeaderWidth = wrapperWidth - HEADER_WIDTH;
        const colHeaderHeight = HEADER_HEIGHT;
        this.colHeaderCanvas.width = colHeaderWidth * window.devicePixelRatio;
        this.colHeaderCanvas.height = colHeaderHeight * window.devicePixelRatio;
        this.colHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.colHeaderCanvas.style.width = `${colHeaderWidth}px`;
        this.colHeaderCanvas.style.height = `${colHeaderHeight}px`;

        // Row header canvas
        const rowHeaderWidth = HEADER_WIDTH;
        const rowHeaderHeight = wrapperHeight - HEADER_HEIGHT;
        this.rowHeaderCanvas.width = rowHeaderWidth * window.devicePixelRatio;
        this.rowHeaderCanvas.height = rowHeaderHeight * window.devicePixelRatio;
        this.rowHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.rowHeaderCanvas.style.width = `${rowHeaderWidth}px`;
        this.rowHeaderCanvas.style.height = `${rowHeaderHeight}px`;
    }

    /**
     * Draws the fixed row and column headers.
     */
    drawHeaders() {
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;

        // --- Draw Column Headers ---
        const colCtx = this.colHeaderCtx;
        colCtx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
        colCtx.font = '12px Arial';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.fillStyle = '#4b5563'; // Darker text for headers
        colCtx.strokeStyle = '#d1d5db';

        // Calculate the first visible column based on scrollLeft
        const startCol = Math.floor(scrollLeft / COLUMN_WIDTH);
        // Calculate how many columns can fit in the visible header area
        const visibleColsCount = Math.ceil(this.colHeaderCanvas.clientWidth / COLUMN_WIDTH) + TILE_BUFFER_COLS;

        for (let c = startCol; c < Math.min(TOTAL_COLUMNS, startCol + visibleColsCount); c++) {
            // Position relative to the *header canvas itself* (adjust for scrollLeft)
            const x = (c * COLUMN_WIDTH) - scrollLeft;

            // Check if this column is selected
            const isSelected = this.selectedCell && this.selectedCell.colIndex === c;

            // Draw column background and border
            colCtx.fillStyle = isSelected ? '#dbeafe' : '#f8f8f8';
            colCtx.fillRect(x, 0, COLUMN_WIDTH, HEADER_HEIGHT);
            colCtx.strokeStyle = isSelected ? '#3b82f6' : '#d1d5db';
            colCtx.strokeRect(x, 0, COLUMN_WIDTH, HEADER_HEIGHT);

            // Draw column name
            colCtx.fillStyle = '#4b5563';
            colCtx.fillText(getColumnName(c), x + COLUMN_WIDTH / 2, HEADER_HEIGHT / 2);
        }

        // --- Draw Row Headers ---
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Arial';
        rowCtx.textAlign = 'center';
        rowCtx.textBaseline = 'middle';
        rowCtx.fillStyle = '#4b5563'; // Darker text for headers
        rowCtx.strokeStyle = '#d1d5db';

        // Calculate the first visible row based on scrollTop
        const startRow = Math.floor(scrollTop / ROW_HEIGHT);
        // Calculate how many rows can fit in the visible header area
        const visibleRowsCount = Math.ceil(this.rowHeaderCanvas.clientHeight / ROW_HEIGHT) + TILE_BUFFER_ROWS;

        for (let r = startRow; r < Math.min(TOTAL_ROWS, startRow + visibleRowsCount); r++) {
            // Position relative to the *header canvas itself* (adjust for scrollTop)
            const y = (r * ROW_HEIGHT) - scrollTop;

            // Check if this row is selected
            const isSelected = this.selectedCell && this.selectedCell.rowIndex === r;

            // Draw row background and border
            rowCtx.fillStyle = isSelected ? '#dbeafe' : '#f8f8f8';
            rowCtx.fillRect(0, y, HEADER_WIDTH, ROW_HEIGHT);
            rowCtx.strokeStyle = isSelected ? '#3b82f6' : '#d1d5db';
            rowCtx.strokeRect(0, y, HEADER_WIDTH, ROW_HEIGHT);

            // Draw row number
            rowCtx.fillStyle = '#4b5563';
            rowCtx.fillText(`${r + 1}`, HEADER_WIDTH / 2, y + ROW_HEIGHT / 2);
        }
    }

    /**
     * Handles window resize events to update header canvas sizes and redraw everything.
     */
    _handleResize() {
        this.updateHeaderCanvasSizes();
        this._handleScroll(); // Redraw tiles and headers based on new size

        // Update input position if active
        if (this.inputCell.isActive) {
            this.inputCell.updatePosition();
        }
    }

    /**
     * Calculates which canvas tiles should be visible and manages their creation/removal.
     * Also updates the virtual content sizer size.
     */
    _handleScroll() {
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const containerHeight = this.container.clientHeight;
        const containerWidth = this.container.clientWidth;

        // Draw the fixed headers
        this.drawHeaders();

        // Calculate the range of tile indices that should be visible
        const startVisibleTileRow = Math.floor(scrollTop / (VISIBLE_ROWS_PER_CANVAS_TILE * ROW_HEIGHT));
        const endVisibleTileRow = Math.ceil((scrollTop + containerHeight) / (VISIBLE_ROWS_PER_CANVAS_TILE * ROW_HEIGHT));
        const startVisibleTileCol = Math.floor(scrollLeft / (VISIBLE_COLS_PER_CANVAS_TILE * COLUMN_WIDTH));
        const endVisibleTileCol = Math.ceil((scrollLeft + containerWidth) / (VISIBLE_COLS_PER_CANVAS_TILE * COLUMN_WIDTH));

        // Determine the buffered range for tile rendering
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

        const tilesToRender = new Set(); // Keep track of tiles that should be present
        let currentMaxGlobalRow = 0;
        let currentMaxGlobalCol = 0;

        // Create or update necessary tiles
        for (let r = bufferedStartTileRow; r < bufferedEndTileRow; r++) {
            for (let c = bufferedStartTileCol; c < bufferedEndTileCol; c++) {
                const tileKey = `${r}_${c}`;
                tilesToRender.add(tileKey);

                let tile = this.canvasTiles.get(tileKey);
                if (!tile) {
                    // Create new canvas element
                    const newCanvas = document.createElement('canvas');
                    newCanvas.className = 'grid-canvas-tile';
                    this.container.appendChild(newCanvas);

                    // Create CanvasTile instance and store it
                    tile = new CanvasTile(newCanvas, this, r, c);
                    this.canvasTiles.set(tileKey, tile);
                    tile.draw(); // Draw the new tile
                }
                // Update max global row/column based on currently active tiles
                currentMaxGlobalRow = Math.max(currentMaxGlobalRow, tile.endGlobalRow);
                currentMaxGlobalCol = Math.max(currentMaxGlobalCol, tile.endGlobalCol);
            }
        }

        // Remove off-screen tiles
        for (const [key, tileInstance] of this.canvasTiles.entries()) {
            if (!tilesToRender.has(key)) {
                this.container.removeChild(tileInstance.canvasElement);
                this.canvasTiles.delete(key);
            }
        }

        const effectiveGridWidth = Math.max(
            containerWidth,
            currentMaxGlobalCol * COLUMN_WIDTH
        );
        const effectiveGridHeight = Math.max(
            containerHeight,
            currentMaxGlobalRow * ROW_HEIGHT
        );

        this.contentSizer.style.width = `${effectiveGridWidth}px`;
        this.contentSizer.style.height = `${effectiveGridHeight}px`;
    }

    renderVisibleTiles() {
        this._handleScroll();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');



});