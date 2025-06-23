// main.js

// --- Configuration Constants ---
const TOTAL_ROWS = 100000; // Support 1 lakh rows
const TOTAL_COLUMNS = 500; // Support 500 columns
const ROW_HEIGHT = 28; // Height of each row in pixels
const COLUMN_WIDTH = 100; // Width of each column in pixels
const HEADER_HEIGHT = 28; // Height of the fixed column header row
const HEADER_WIDTH = 50; // Width of the fixed row header column

// Number of rows/columns to display per canvas tile.
// This determines the size of each dynamically loaded canvas.
// Adjust these based on typical screen size to ensure a reasonable number of cells per tile.
const VISIBLE_ROWS_PER_CANVAS_TILE = 50;
const VISIBLE_COLS_PER_CANVAS_TILE = 30;

// Buffer for tiles: how many extra tiles to render around the visible area
const TILE_BUFFER_ROWS = 1;
const TILE_BUFFER_COLS = 1;

// --- Utility Functions ---

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

// --- Cell Class (Data Representation) ---
// This class primarily holds data for a cell. For a large grid, we only
// instantiate these for visible cells or cells with specific data/styles.
class Cell {
    constructor(rowIndex, colIndex, value = '') {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.value = value;
        // In a real application, you'd add properties like:
        // this.formula = '';
        // this.style = {};
    }

    // Example method to get cell content for display
    getContent() {
        if (this.value) {
            return this.value;
        }
        return `R${this.rowIndex + 1}C${this.colIndex + 1}`; // Default content
    }
}

// --- CanvasTile Class ---
// Manages a single HTML Canvas element and draws a specific portion of the grid data.
// It no longer draws its own headers.
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
    }

    /**
     * Draws the grid lines and cell content for this tile.
     * No headers are drawn here anymore.
     */
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151'; // Text color
        ctx.strokeStyle = '#e5e7eb'; // Lighter lines for grid

        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
                // Calculate local coordinates within this tile's canvas
                const x = (c - this.startGlobalCol) * COLUMN_WIDTH;
                const y = (r - this.startGlobalRow) * ROW_HEIGHT;

                // Draw cell border
                ctx.strokeRect(x, y, COLUMN_WIDTH, ROW_HEIGHT);

                // Get cell content (using a dummy cell for now)
                const cell = new Cell(r, c);
                ctx.fillText(cell.getContent(), x + COLUMN_WIDTH / 2, y + ROW_HEIGHT / 2, COLUMN_WIDTH - 4); // Add padding
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
        this.container.addEventListener('scroll', this.handleScroll);

        // Listen for window resize to adjust header canvas sizes and redraw
        this.handleResize = debounce(this._handleResize.bind(this), 100);
        window.addEventListener('resize', this.handleResize);

        // Initial render
        this.renderVisibleTiles();
        this.drawHeaders(); // Initial draw of headers
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
        colCtx.font = '12px Inter';
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

            // Draw column background and border
            colCtx.fillStyle = '#f8f8f8';
            colCtx.fillRect(x, 0, COLUMN_WIDTH, HEADER_HEIGHT);
            colCtx.strokeRect(x, 0, COLUMN_WIDTH, HEADER_HEIGHT);

            // Draw column name
            colCtx.fillStyle = '#4b5563';
            colCtx.fillText(getColumnName(c), x + COLUMN_WIDTH / 2, HEADER_HEIGHT / 2);
        }

        // --- Draw Row Headers ---
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Inter';
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

            // Draw row background and border
            rowCtx.fillStyle = '#f8f8f8';
            rowCtx.fillRect(0, y, HEADER_WIDTH, ROW_HEIGHT);
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

        // Update the content sizer's dimensions based on the *current* maximum rendered area.
        // This makes the scrollbar thumb adapt to the visible and buffered tile extent.
        // The effective width/height should not be less than the container's scrollable dimensions
        // to prevent scrollbar jumping when reaching the "end" of the currently loaded area.
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

    /**
     * Initial render of the visible tiles.
     */
    renderVisibleTiles() {
        this._handleScroll(); // Trigger initial tile rendering
    }
}

// --- Initialize the Grid when the DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');
});
