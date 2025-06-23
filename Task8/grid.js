/**
 * Constants for grid dimensions and rendering.
 * These define the visual size of cells and the logical size of canvas tiles.
 */
const ROW_HEIGHT = 28; // Height of each row in pixels
const COL_WIDTH = 100; // Width of each column in pixels
const HEADER_ROW_HEIGHT = 28; // Height of the column header row
const HEADER_COL_WIDTH = 60;  // Width of the row header column

// Define the dimensions of each canvas tile in terms of rows and columns.
// This is crucial for virtualization and dynamic canvas creation.
const TILE_ROWS = 28; // Number of rows per canvas tile
const TILE_COLS = 30; // Number of columns per canvas tile

/**
 * Utility function to convert a column index to its Excel-style letter representation (e.g., 0 -> A, 25 -> Z, 26 -> AA).
 * @param {number} colIndex - The 0-based column index.
 * @returns {string} The Excel-style column letter.
 */
function getColumnLetter(colIndex) {
    let letter = '';
    let tempColIndex = colIndex;
    do {
        // Calculate the remainder when divided by 26 (number of letters in alphabet)
        const remainder = tempColIndex % 26;
        // Convert remainder to ASCII character (A=65, B=66, etc.)
        letter = String.fromCharCode(65 + remainder) + letter;
        // Update colIndex for next iteration: integer division by 26, then subtract 1 because our system is 0-indexed (A=0), but Excel's is 1-indexed (A=1) for this calculation.
        tempColIndex = Math.floor(tempColIndex / 26) - 1;
    } while (tempColIndex >= 0); // Continue until there are no more "digits"
    return letter;
}

/**
 * Class representing a rectangular range of cells.
 * Used for selection and other range-based operations.
 */
class CellRange {
    /**
     * @param {number} startRow - The starting row index of the range.
     * @param {number} startCol - The starting column index of the range.
     * @param {number} endRow - The ending row index of the range.
     * @param {number} endCol - The ending column index of the range.
     */
    constructor(startRow, startCol, endRow, endCol) {
        this.startRow = Math.min(startRow, endRow);
        this.startCol = Math.min(startCol, endCol);
        this.endRow = Math.max(startRow, endRow);
        this.endCol = Math.max(startCol, endCol);
    }

    /**
     * Checks if a given row and column are within this range.
     * @param {number} row - The row index to check.
     * @param {number} col - The column index to check.
     * @returns {boolean} True if the cell is within the range, false otherwise.
     */
    contains(row, col) {
        return row >= this.startRow && row <= this.endRow &&
            col >= this.startCol && col <= this.endCol;
    }

    /**
     * Checks if this range overlaps with another given range.
     * @param {CellRange} otherRange - The other range to check for overlap.
     * @returns {boolean} True if the ranges overlap, false otherwise.
     */
    overlaps(otherRange) {
        return !(this.endCol < otherRange.startCol ||
            this.startCol > otherRange.endCol ||
            this.endRow < otherRange.startRow ||
            this.startRow > otherRange.endRow);
    }
}

/**
 * Manages the selection state of the grid, including single cell and range selections.
 */
class SelectionManager {
    /**
     * @param {Grid} grid - Reference to the main Grid instance.
     */
    constructor(grid) {
        this.grid = grid;
        this.selectedRange = null; // Stores the current CellRange object
        this.activeCell = { row: 0, col: 0 }; // The actively focused cell (for editing)
        this.isSelecting = false; // Flag to indicate if a drag selection is in progress
        this.startSelectionCell = null; // The cell where a drag selection started
    }

    /**
     * Sets the active cell and triggers a redraw of relevant tiles.
     * @param {number} row - The row index of the cell.
     * @param {number} col - The column index of the cell.
     */
    setActiveCell(row, col) {
        // Clamp to grid boundaries
        this.activeCell.row = Math.max(0, Math.min(row, this.grid.totalRows - 1));
        this.activeCell.col = Math.max(0, Math.min(col, this.grid.totalCols - 1));

        // When setting active cell, clear any range selection unless a drag is in progress
        if (!this.isSelecting) {
            this.selectedRange = null;
        }

        // Trigger redraw for old active cell and new active cell
        this.grid.renderVisibleTiles();
    }

    /**
     * Selects a single cell, making it the active cell and clearing any range.
     * @param {number} row - The row index of the cell.
     * @param {number} col - The column index of the cell.
     */
    selectCell(row, col) {
        this.setActiveCell(row, col);
        this.selectedRange = null; // Clear any existing range selection
        this.grid.hideCellEditor();
        this.grid.renderVisibleTiles(); // Ensure redraw to remove old selection
    }

    /**
     * Starts a new range selection from a given cell.
     * @param {number} row - The starting row index.
     * @param {number} col - The starting column index.
     */
    startRangeSelection(row, col) {
        this.isSelecting = true;
        this.startSelectionCell = { row, col };
        this.selectedRange = new CellRange(row, col, row, col);
        this.setActiveCell(row, col); // Active cell is the start of selection
        this.grid.hideCellEditor();
        this.grid.renderVisibleTiles();
    }

    /**
     * Updates the current range selection as the mouse drags.
     * @param {number} row - The current row index of the mouse.
     * @param {number} col - The current column index of the mouse.
     */
    updateRangeSelection(row, col) {
        if (!this.isSelecting || !this.startSelectionCell) return;

        const prevRange = this.selectedRange; // Store old range for redraw optimization
        this.selectedRange = new CellRange(
            this.startSelectionCell.row,
            this.startSelectionCell.col,
            row,
            col
        );

        // Determine affected tiles for redraw: previous range and current range
        const tilesToRedraw = new Set();
        if (prevRange) {
            this.grid.getTilesInRect(prevRange.startRow, prevRange.startCol, prevRange.endRow, prevRange.endCol)
                .forEach(tile => tilesToRedraw.add(tile));
        }
        this.grid.getTilesInRect(this.selectedRange.startRow, this.selectedRange.startCol, this.selectedRange.endRow, this.selectedRange.endCol)
            .forEach(tile => tilesToRedraw.add(tile));

        tilesToRedraw.forEach(tile => tile.draw());
        this.setActiveCell(row, col); // Active cell follows the mouse during drag
    }

    /**
     * Ends the current range selection.
     */
    endRangeSelection() {
        this.isSelecting = false;
        this.startSelectionCell = null;
        this.grid.renderVisibleTiles(); // Final redraw to ensure selection is correct
    }

    /**
     * Draws the selection rectangle(s) and active cell border on a given canvas context.
     * This method is called by CanvasTile instances during their draw cycle.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     * @param {number} canvasStartRow - The global starting row index this canvas tile represents.
     * @param {number} canvasStartCol - The global starting column index this canvas tile represents.
     * @param {number} canvasWidth - The width of the canvas element.
     * @param {number} canvasHeight - The height of the canvas element.
     */
    drawSelection(ctx, canvasStartRow, canvasStartCol, canvasWidth, canvasHeight) {
        // Draw active cell border
        const activeCellRow = this.activeCell.row;
        const activeCellCol = this.activeCell.col;

        if (activeCellRow >= canvasStartRow && activeCellRow < canvasStartRow + TILE_ROWS &&
            activeCellCol >= canvasStartCol && activeCellCol < canvasStartCol + TILE_COLS) {
            const x = (activeCellCol - canvasStartCol) * COL_WIDTH;
            const y = (activeCellRow - canvasStartRow) * ROW_HEIGHT;

            ctx.strokeStyle = '#3b82f6'; // Blue-500
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, COL_WIDTH, ROW_HEIGHT);
        }

        // Draw selection range if active
        if (this.selectedRange) {
            // Calculate intersection of selection range and canvas tile's range
            const intersectStartRow = Math.max(this.selectedRange.startRow, canvasStartRow);
            const intersectStartCol = Math.max(this.selectedRange.startCol, canvasStartCol);
            const intersectEndRow = Math.min(this.selectedRange.endRow, canvasStartRow + TILE_ROWS - 1);
            const intersectEndCol = Math.min(this.selectedRange.endCol, canvasStartCol + TILE_COLS - 1);

            if (intersectStartRow <= intersectEndRow && intersectStartCol <= intersectEndCol) {
                // Draw a semi-transparent rectangle for the selected range
                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Blue-500 with 10% opacity
                const x = (intersectStartCol - canvasStartCol) * COL_WIDTH;
                const y = (intersectStartRow - canvasStartRow) * ROW_HEIGHT;
                const width = (intersectEndCol - intersectStartCol + 1) * COL_WIDTH;
                const height = (intersectEndRow - intersectStartRow + 1) * ROW_HEIGHT;
                ctx.fillRect(x, y, width, height);

                // Draw a thinner border for the entire selection range if it covers multiple cells
                if (this.selectedRange.endRow !== this.selectedRange.startRow ||
                    this.selectedRange.endCol !== this.selectedRange.startCol) {
                    ctx.strokeStyle = '#3b82f6'; // Blue-500
                    ctx.lineWidth = 1; // Thinner border
                    ctx.strokeRect(x, y, width, height);
                }
            }
        }
    }
}

/**
 * Manages the data for cells. Uses a sparse map to store only edited cells.
 */
class CellManager {
    constructor() {
        // Stores cell values in a map: { "row,col": "value" }
        this.cellValues = new Map();
    }

    /**
     * Gets the value of a specific cell.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {string} The cell value, or an empty string if not set.
     */
    getCellValue(row, col) {
        return this.cellValues.get(`${row},${col}`) || '';
    }

    /**
     * Sets the value of a specific cell.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @param {string} value - The value to set.
     * @returns {boolean} True if the value was changed, false otherwise.
     */
    setCellValue(row, col, value) {
        const key = `${row},${col}`;
        const oldValue = this.cellValues.get(key);
        if (oldValue === value) {
            return false; // No change
        }
        if (value === '') {
            this.cellValues.delete(key); // Remove if empty
        } else {
            this.cellValues.set(key, value);
        }
        return true;
    }
}

/**
 * Represents a single HTML Canvas element that draws a specific tile of the grid.
 */
class CanvasTile {
    /**
     * @param {Grid} grid - Reference to the main Grid instance.
     * @param {number} tileRowIndex - The row index of this tile in the overall tile grid.
     * @param {number} tileColIndex - The column index of this tile in the overall tile grid.
     * @param {HTMLElement} container - The DOM element to append the canvas to.
     */
    constructor(grid, tileRowIndex, tileColIndex, container) {
        this.grid = grid;
        this.tileRowIndex = tileRowIndex;
        this.tileColIndex = tileColIndex;
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;

        // Calculate global grid coordinates covered by this tile
        this.startRow = tileRowIndex * TILE_ROWS;
        this.startCol = tileColIndex * TILE_COLS;
        this.endRow = Math.min(this.startRow + TILE_ROWS - 1, grid.totalRows - 1);
        this.endCol = Math.min(this.startCol + TILE_COLS - 1, grid.totalCols - 1);

        // Calculate actual pixel dimensions of this tile
        this.width = (this.endCol - this.startCol + 1) * COL_WIDTH;
        this.height = (this.endRow - this.startRow + 1) * ROW_HEIGHT;

        this.createElement();
        this.isInitialized = true;
    }

    /**
     * Creates the canvas element, sets its attributes, and appends it to the container.
     */
    createElement() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'grid-canvas-tile';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.left = `${this.startCol * COL_WIDTH}px`;
        this.canvas.style.top = `${this.startRow * ROW_HEIGHT}px`;

        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        // console.log(`Created tile: (${this.tileRowIndex},${this.tileColIndex}) @ (${this.startRow},${this.startCol}) dimensions: ${this.width}x${this.height}`);
    }

    /**
     * Draws the grid lines, cell content, and selection on this tile.
     */
    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the entire canvas tile

        ctx.font = '14px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        // Draw grid lines
        ctx.strokeStyle = '#e0e0e0'; // Light gray for grid lines
        ctx.lineWidth = 1;

        // Draw horizontal lines
        for (let r = 0; r <= (this.endRow - this.startRow + 1); r++) {
            const y = r * ROW_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Draw vertical lines
        for (let c = 0; c <= (this.endCol - this.startCol + 1); c++) {
            const x = c * COL_WIDTH;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Draw cell content
        for (let r = this.startRow; r <= this.endRow; r++) {
            for (let c = this.startCol; c <= this.endCol; c++) {
                const value = this.grid.cellManager.getCellValue(r, c);
                if (value) {
                    const x = (c - this.startCol) * COL_WIDTH + 5; // Padding
                    const y = (r - this.startRow) * ROW_HEIGHT + ROW_HEIGHT / 2; // Centered vertically
                    ctx.fillStyle = '#333333'; // Dark gray for text
                    ctx.fillText(value, x, y, COL_WIDTH - 10); // Max width to prevent overflow
                }
            }
        }

        // Draw selection and active cell (delegated to SelectionManager)
        this.grid.selectionManager.drawSelection(ctx, this.startRow, this.startCol, this.width, this.height);
    }

    /**
     * Removes the canvas element from the DOM.
     */
    destroy() {
        if (this.canvas && this.container) {
            // console.log(`Destroyed tile: (${this.tileRowIndex},${this.tileColIndex})`);
            this.container.removeChild(this.canvas);
            this.canvas = null;
            this.ctx = null;
        }
    }
}

/**
 * The main Grid class that manages the entire Excel-like interface.
 * Handles virtualization, rendering, scrolling, and user interactions.
 */
class Grid {
    /**
     * @param {HTMLElement} containerWrapper - The main wrapper div for the grid (e.g., #grid-container-wrapper).
     * @param {number} totalRows - The total number of rows in the grid.
     * @param {number} totalCols - The total number of columns in the grid.
     */
    constructor(containerWrapper, totalRows, totalCols) {
        this.containerWrapper = containerWrapper;
        this.scrollArea = containerWrapper.querySelector('#scroll-area');
        this.rowHeaderContainer = containerWrapper.querySelector('#row-header-container');
        this.colHeaderContainer = containerWrapper.querySelector('#col-header-container');
        this.topLeftCorner = containerWrapper.querySelector('#top-left-corner');
        this.cellEditor = containerWrapper.querySelector('#cell-editor');

        this.totalRows = totalRows;
        this.totalCols = totalCols;

        this.cellManager = new CellManager();
        this.selectionManager = new SelectionManager(this);

        this.activeTiles = new Map(); // Map to store active CanvasTile instances: { "tileRowIndex,tileColIndex": CanvasTile }

        this.scrollLeft = 0;
        this.scrollTop = 0;

        this.init();
    }

    /**
     * Initializes the grid: sets up dimensions, event listeners, and initial rendering.
     */
    init() {
        // Set CSS variables for header dimensions
        document.documentElement.style.setProperty('--header-row-height', `${HEADER_ROW_HEIGHT}px`);
        document.documentElement.style.setProperty('--header-col-width', `${HEADER_COL_WIDTH}px`);

        // Adjust scroll area padding to account for sticky headers
        this.scrollArea.style.paddingLeft = `${HEADER_COL_WIDTH}px`;
        this.scrollArea.style.paddingTop = `${HEADER_ROW_HEIGHT}px`;

        // Configure scroll area total dimensions
        this.scrollArea.style.width = `${this.totalCols * COL_WIDTH + HEADER_COL_WIDTH}px`;
        this.scrollArea.style.height = `${this.totalRows * ROW_HEIGHT + HEADER_ROW_HEIGHT}px`;

        // Apply sticky positioning to header containers
        this.rowHeaderContainer.style.top = `${HEADER_ROW_HEIGHT}px`; // Below top-left corner
        this.colHeaderContainer.style.left = `${HEADER_COL_WIDTH}px`; // Right of top-left corner

        this.addEventListeners();
        this.renderVisibleTiles(); // Initial render
        this.drawHeaders();
        this.selectionManager.selectCell(0, 0); // Select initial cell (A1)
    }

    /**
     * Adds all necessary event listeners for scrolling, mouse interactions, and keyboard inputs.
     */
    addEventListeners() {
        // Scroll event for the main scroll area (where canvases are)
        this.scrollArea.addEventListener('scroll', () => {
            this.scrollLeft = this.scrollArea.scrollLeft;
            this.scrollTop = this.scrollArea.scrollTop;
            this.renderVisibleTiles();
            this.drawHeaders(); // Redraw headers as they scroll with the content
        });

        // Mouse down on grid for selection
        this.scrollArea.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'CANVAS') {
                const { row, col } = this.getCellCoordsFromMouseEvent(e);
                this.selectionManager.startRangeSelection(row, col);
                this.hideCellEditor();
                e.preventDefault(); // Prevent default browser drag behavior
            }
        });

        // Mouse move for range selection
        this.scrollArea.addEventListener('mousemove', (e) => {
            if (this.selectionManager.isSelecting && e.target.tagName === 'CANVAS') {
                const { row, col } = this.getCellCoordsFromMouseEvent(e);
                this.selectionManager.updateRangeSelection(row, col);
            }
        });

        // Mouse up to end selection
        window.addEventListener('mouseup', () => {
            if (this.selectionManager.isSelecting) {
                this.selectionManager.endRangeSelection();
            }
        });

        // Double click for cell editing
        this.scrollArea.addEventListener('dblclick', (e) => {
            if (e.target.tagName === 'CANVAS') {
                const { row, col } = this.getCellCoordsFromMouseEvent(e);
                this.selectionManager.setActiveCell(row, col); // Ensure this cell is active
                this.showCellEditor(row, col);
            }
        });

        // Handle clicks outside the editor to hide it
        document.addEventListener('mousedown', (e) => {
            if (this.cellEditor.style.display !== 'none' && !this.cellEditor.contains(e.target) && e.target.tagName !== 'CANVAS') {
                this.hideCellEditor();
            }
        });

        // Keyboard navigation and editing
        document.addEventListener('keydown', (e) => {
            const activeRow = this.selectionManager.activeCell.row;
            const activeCol = this.selectionManager.activeCell.col;

            // If editor is active, let it handle key presses first
            if (this.cellEditor.style.display !== 'none' && this.cellEditor === document.activeElement) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent new line in textarea
                    this.hideCellEditor();
                    // Move to next row if Enter is pressed (Excel-like behavior)
                    this.selectionManager.setActiveCell(activeRow + 1, activeCol);
                    this.scrollToCell(activeRow + 1, activeCol);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.hideCellEditor();
                    this.selectionManager.setActiveCell(activeRow, activeCol + 1);
                    this.scrollToCell(activeRow, activeCol + 1);
                }
                return;
            }

            // Global keydown events for navigation and immediate editing
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectionManager.setActiveCell(activeRow - 1, activeCol);
                this.scrollToCell(activeRow - 1, activeCol);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectionManager.setActiveCell(activeRow + 1, activeCol);
                this.scrollToCell(activeRow + 1, activeCol);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.selectionManager.setActiveCell(activeRow, activeCol - 1);
                this.scrollToCell(activeRow, activeCol - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.selectionManager.setActiveCell(activeRow, activeCol + 1);
                this.scrollToCell(activeRow, activeCol + 1);
            } else if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if applicable
                this.showCellEditor(activeRow, activeCol);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.selectionManager.setActiveCell(activeRow, activeCol + 1);
                this.scrollToCell(activeRow, activeCol + 1);
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // If a printable character is pressed, start editing immediately
                this.showCellEditor(activeRow, activeCol, e.key);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                // Clear cell content
                this.cellManager.setCellValue(activeRow, activeCol, '');
                this.renderVisibleTiles();
            }
        });
    }

    /**
     * Calculates the row and column index from a mouse event's coordinates relative to the scroll area.
     * @param {MouseEvent} e - The mouse event.
     * @returns {{row: number, col: number}} The calculated row and column.
     */
    getCellCoordsFromMouseEvent(e) {
        // Get coordinates relative to the scroll area, then account for scroll position
        const rect = this.scrollArea.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Calculate x and y relative to the grid content (accounting for scroll and header offsets)
        const xInGrid = (clientX - rect.left) + this.scrollArea.scrollLeft - HEADER_COL_WIDTH;
        const yInGrid = (clientY - rect.top) + this.scrollArea.scrollTop - HEADER_ROW_HEIGHT;

        const col = Math.floor(xInGrid / COL_WIDTH);
        const row = Math.floor(yInGrid / ROW_HEIGHT);

        // Clamp to valid grid dimensions
        const clampedCol = Math.max(0, Math.min(col, this.totalCols - 1));
        const clampedRow = Math.max(0, Math.min(row, this.totalRows - 1));

        return { row: clampedRow, col: clampedCol };
    }

    /**
     * Scrolls the grid to make a specific cell visible.
     * @param {number} row - The target row.
     * @param {number} col - The target column.
     */
    scrollToCell(row, col) {
        const targetX = col * COL_WIDTH;
        const targetY = row * ROW_HEIGHT;

        // Check if the cell is already fully visible
        const currentScrollLeft = this.scrollArea.scrollLeft;
        const currentScrollTop = this.scrollArea.scrollTop;
        const visibleWidth = this.scrollArea.clientWidth - HEADER_COL_WIDTH;
        const visibleHeight = this.scrollArea.clientHeight - HEADER_ROW_HEIGHT;

        let newScrollLeft = currentScrollLeft;
        let newScrollTop = currentScrollTop;

        // Scroll horizontally if needed
        if (targetX < currentScrollLeft) { // Cell is to the left of current view
            newScrollLeft = targetX;
        } else if (targetX + COL_WIDTH > currentScrollLeft + visibleWidth) { // Cell is to the right
            newScrollLeft = targetX + COL_WIDTH - visibleWidth;
        }

        // Scroll vertically if needed
        if (targetY < currentScrollTop) { // Cell is above current view
            newScrollTop = targetY;
        } else if (targetY + ROW_HEIGHT > currentScrollTop + visibleHeight) { // Cell is below
            newScrollTop = targetY + ROW_HEIGHT - visibleHeight;
        }

        // Apply scroll if changed
        if (newScrollLeft !== currentScrollLeft || newScrollTop !== currentScrollTop) {
            this.scrollArea.scrollTo({
                left: newScrollLeft,
                top: newScrollTop,
                behavior: 'smooth' // Smooth scrolling
            });
        } else {
            // If no scroll needed, just redraw to update selection
            this.renderVisibleTiles();
        }
    }

    /**
     * Shows the cell editor (textarea) at the position of the active cell.
     * @param {number} row - The row index of the cell to edit.
     * @param {number} col - The column index of the cell to edit.
     * @param {string} [initialText=''] - Optional initial text for the editor.
     */
    showCellEditor(row, col, initialText = '') {
        // Ensure the editor is shown at the *active* cell
        this.selectionManager.setActiveCell(row, col);

        const x = col * COL_WIDTH - this.scrollLeft + HEADER_COL_WIDTH;
        const y = row * ROW_HEIGHT - this.scrollTop + HEADER_ROW_HEIGHT;

        this.cellEditor.style.left = `${x}px`;
        this.cellEditor.style.top = `${y}px`;
        this.cellEditor.style.width = `${COL_WIDTH + 2}px`; // +2 for border
        this.cellEditor.style.height = `${ROW_HEIGHT + 2}px`; // +2 for border
        this.cellEditor.style.display = 'block';

        const currentValue = this.cellManager.getCellValue(row, col);
        this.cellEditor.value = initialText || currentValue; // If initialText provided, use it
        this.cellEditor.focus();
        // Place cursor at the end if initialText is provided, otherwise select all
        if (initialText) {
            this.cellEditor.setSelectionRange(initialText.length, initialText.length);
        } else {
            this.cellEditor.select();
        }
    }

    /**
     * Hides the cell editor and saves its content to the active cell.
     */
    hideCellEditor() {
        if (this.cellEditor.style.display === 'block') {
            this.cellEditor.style.display = 'none';
            const value = this.cellEditor.value;
            const { row, col } = this.selectionManager.activeCell;

            if (this.cellManager.setCellValue(row, col, value)) {
                // If value changed, redraw affected tile
                this.getTilesInRect(row, col, row, col).forEach(tile => tile.draw());
            }
            this.cellEditor.value = ''; // Clear for next use
            this.scrollArea.focus(); // Return focus to the scroll area for keyboard nav
        }
    }

    /**
     * Draws the row and column headers based on the current scroll position.
     */
    drawHeaders() {
        // Update column headers
        this.colHeaderContainer.innerHTML = '';
        const visibleStartCol = Math.floor(this.scrollLeft / COL_WIDTH);
        const visibleEndCol = Math.min(this.totalCols - 1, Math.floor((this.scrollLeft + this.scrollArea.clientWidth - HEADER_COL_WIDTH) / COL_WIDTH));

        for (let c = visibleStartCol; c <= visibleEndCol; c++) {
            const headerDiv = document.createElement('div');
            headerDiv.textContent = getColumnLetter(c);
            headerDiv.style.position = 'absolute';
            headerDiv.style.left = `${c * COL_WIDTH + HEADER_COL_WIDTH}px`;
            headerDiv.style.top = '0';
            headerDiv.style.width = `${COL_WIDTH}px`;
            headerDiv.style.height = `${HEADER_ROW_HEIGHT}px`;
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.justifyContent = 'center';
            headerDiv.style.borderRight = '1px solid #e0e0e0';
            headerDiv.style.borderBottom = '1px solid #e0e0e0';
            headerDiv.style.boxSizing = 'border-box';
            this.colHeaderContainer.appendChild(headerDiv);
        }

        // Update row headers
        this.rowHeaderContainer.innerHTML = '';
        const visibleStartRow = Math.floor(this.scrollTop / ROW_HEIGHT);
        const visibleEndRow = Math.min(this.totalRows - 1, Math.floor((this.scrollTop + this.scrollArea.clientHeight - HEADER_ROW_HEIGHT) / ROW_HEIGHT));

        for (let r = visibleStartRow; r <= visibleEndRow; r++) {
            const headerDiv = document.createElement('div');
            headerDiv.textContent = (r + 1).toString();
            headerDiv.style.position = 'absolute';
            headerDiv.style.top = `${r * ROW_HEIGHT + HEADER_ROW_HEIGHT}px`;
            headerDiv.style.left = '0';
            headerDiv.style.width = `${HEADER_COL_WIDTH}px`;
            headerDiv.style.height = `${ROW_HEIGHT}px`;
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.justifyContent = 'center';
            headerDiv.style.borderRight = '1px solid #e0e0e0';
            headerDiv.style.borderBottom = '1px solid #e0e0e0';
            headerDiv.style.boxSizing = 'border-box';
            this.rowHeaderContainer.appendChild(headerDiv);
        }
    }

    /**
     * Determines which canvas tiles should be visible based on scroll position,
     * creates new ones if needed, and removes hidden ones. Then redraws all visible tiles.
     */
    renderVisibleTiles() {
        const visibleAreaWidth = this.scrollArea.clientWidth - HEADER_COL_WIDTH;
        const visibleAreaHeight = this.scrollArea.clientHeight - HEADER_ROW_HEIGHT;

        // Calculate the range of tile indices that are currently visible
        const startTileRow = Math.floor(this.scrollTop / (TILE_ROWS * ROW_HEIGHT));
        const endTileRow = Math.min(
            Math.ceil((this.scrollTop + visibleAreaHeight) / (TILE_ROWS * ROW_HEIGHT)) - 1,
            Math.ceil(this.totalRows / TILE_ROWS) - 1
        );

        const startTileCol = Math.floor(this.scrollLeft / (TILE_COLS * COL_WIDTH));
        const endTileCol = Math.min(
            Math.ceil((this.scrollLeft + visibleAreaWidth) / (TILE_COLS * COL_WIDTH)) - 1,
            Math.ceil(this.totalCols / TILE_COLS) - 1
        );

        const newActiveTiles = new Map();

        // Create or activate visible tiles
        for (let r = startTileRow; r <= endTileRow; r++) {
            for (let c = startTileCol; c <= endTileCol; c++) {
                const tileKey = `${r},${c}`;
                let tile = this.activeTiles.get(tileKey);
                if (!tile) {
                    // Create new tile if it doesn't exist
                    tile = new CanvasTile(this, r, c, this.scrollArea);
                    tile.draw(); // Draw immediately upon creation
                } else {
                    tile.draw(); // Redraw existing tile (e.g., for selection changes)
                }
                newActiveTiles.set(tileKey, tile);
            }
        }

        // Destroy tiles that are no longer visible
        for (const [key, tile] of this.activeTiles.entries()) {
            if (!newActiveTiles.has(key)) {
                tile.destroy();
            }
        }
        this.activeTiles = newActiveTiles;
    }

    /**
     * Gets an array of CanvasTile instances that cover a given rectangular area.
     * Useful for efficiently redrawing only relevant tiles.
     * @param {number} startRow - Start row of the rectangle.
     * @param {number} startCol - Start column of the rectangle.
     * @param {number} endRow - End row of the rectangle.
     * @param {number} endCol - End column of the rectangle.
     * @returns {Array<CanvasTile>} An array of CanvasTile instances.
     */
    getTilesInRect(startRow, startCol, endRow, endCol) {
        const tiles = [];
        const startTileRow = Math.floor(startRow / TILE_ROWS);
        const endTileRow = Math.floor(endRow / TILE_ROWS);
        const startTileCol = Math.floor(startCol / TILE_COLS);
        const endTileCol = Math.floor(endCol / TILE_COLS);

        for (let r = startTileRow; r <= endTileRow; r++) {
            for (let c = startTileCol; c <= endTileCol; c++) {
                const tile = this.activeTiles.get(`${r},${c}`);
                if (tile) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
    }
}

// Initialize the grid once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    const gridContainerWrapper = document.getElementById('grid-container-wrapper');
    // Instantiate the grid with 100,000 rows and 500 columns as requested.
    const grid = new Grid(gridContainerWrapper, 100, 500);
});
