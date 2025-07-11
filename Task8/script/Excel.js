import { GridRow } from "./row.js";
import { GridColumn } from "./column.js";
import { Cell } from "./cell.js";
import { CanvasTile } from "./canvasTile.js";
import { getColumnName } from "./column.js";
import { SelectionManager, CellSelection, ColumnSelection, RowSelection, RangeSelection } from "./Selection.js";
import { ColResizeHandler } from "./ColResizeHandler.js";
import { RowResizeHandler } from "./RowResizeHandler.js";
import { CommandManager, EditCellCommand } from "./CommandManager.js";
import { EventManager } from "./EventManager.js";
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
import { ColumnSelectionHandler } from "./ColumnSelectionHandler.js";
import { RowSelectionHandler } from "./RowSelectionHandler.js";
import { CellInputManager } from "./CellInputManager.js";


// for reduce multiple calling
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}



/**
 * Main Grid class for managing spreadsheet/grid logic, rendering, and user interaction.
 */
class Grid {

    /**
     * Constructs a new Grid instance and initializes the grid.
     * @param {string} containerId - The DOM id of the grid container element.
     */
    constructor(containerId) {
        this.gridWrapper = document.getElementById('grid-wrapper');
        this.container = document.getElementById(containerId);
        if (!this.container || !this.gridWrapper) {
            console.error('Required grid elements not found.');
            return;
        }
        this.initializeUndoRedoShortcuts();
        this.initializeVariables(); // Initialize grid variables
        this.columns = []; // Array of GridColumn objects representing all columns in the grid
        this.rows = [];    // Array of GridRow objects representing all rows in the grid
        this.cells = new Map(); // Map to store Cell objects, keyed by 'row_col' string
        for (let i = 0; i < TOTAL_COLUMNS; i++) {
            this.columns.push(new GridColumn(i));
        }
        for (let i = 0; i < TOTAL_ROWS; i++) {
            this.rows.push(new GridRow(i));
        }
        this.canvasTiles = new Map(); // Map of CanvasTile objects for visible grid regions
        this.contentSizer = document.getElementById('grid-content-sizer'); // DOM element for sizing grid content
        this.colHeaderCanvas = document.getElementById('column-header-canvas'); // Canvas for column headers
        this.colHeaderCtx = this.colHeaderCanvas.getContext('2d'); // 2D context for column header canvas
        this.rowHeaderCanvas = document.getElementById('row-header-canvas'); // Canvas for row headers
        this.rowHeaderCtx = this.rowHeaderCanvas.getContext('2d'); // 2D context for row header canvas
        this.selectionManager = new SelectionManager(this); // Manages cell/row/column/range selection
        this.eventManager = new EventManager(); // Handles all grid-related events
        this.selectionManager.grid = this; // Ensure selectionManager has reference to this grid
        this.columnSelectionHandler = new ColumnSelectionHandler(this); // Column selection handler
        this.rowSelectionHandler = new RowSelectionHandler(this); // Column selection handler
        this.colResizeHandler = new ColResizeHandler(this);
        this.rowResizeHandler = new RowResizeHandler(this);
        this.RegisterHandler(); // Register all event handlers
        this.updateHeaderCanvasSizes();
        this.drawHeaders();
        this.renderVisibleTiles();
        this.initializeEvents(); // Set up event listeners
    }
    // --- Grid initialization and rendering methods ---
    RegisterHandler() {
        this.eventManager.RegisterHandler(this.columnSelectionHandler); // Register column selection handler
        this.eventManager.RegisterHandler(this.rowSelectionHandler);    // Register row selection handler
        this.eventManager.RegisterHandler(this.selectionManager);       // Register selection manager
        this.eventManager.RegisterHandler(this.colResizeHandler);
        this.eventManager.RegisterHandler(this.rowResizeHandler);
    }
    // --- Grid initialization and rendering methods ---
    initializeVariables() {
        this.isSelecting = false; // True if user is currently selecting cells
        this.selectionStart = null; // Starting cell of current selection
        this.resizeHandles = []; // Array of DOM elements for resize handles
        this.isResizing = false; // True if a resize operation is in progress
        this.resizeType = null; // 'row' or 'column' for current resize
        this.resizeIndex = -1; // Index of row/column being resized
        this.resizeStartPos = 0; // Mouse position at start of resize
        this.resizeStartSize = 0; // Size at start of resize
        this.selectedCell = null; // Currently selected cell {row, col}
        this.isEditing = false; // True if a cell is being edited
        this.cellInput = null; // Input element for cell editing

    }
    // --- Grid initialization and rendering methods ---
    initializeEvents() {
        this.handleScroll = debounce(this.HandleScroll.bind(this), 10);

        this.handleResize = debounce(this.HandleResize.bind(this), 100);
        this.container.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('dblclick', this.selectionManager.handleCellDoubleClick.bind(this.selectionManager));
        this.container.addEventListener('click', this.selectionManager.handleClick.bind(this.selectionManager));
        window.addEventListener('pointerdown', this.eventManager.pointerdown.bind(this.eventManager));

        window.addEventListener('pointermove', this.eventManager.pointerMove.bind(this.eventManager));

        window.addEventListener('pointerup', this.eventManager.pointerUp.bind(this.eventManager));
    }
    commandManager = new CommandManager();
    // Keyboard shortcut for undo/redo
    /**
     * Sets up keyboard shortcuts for undo and redo actions (Ctrl+Z, Ctrl+Y).
     */
    initializeUndoRedoShortcuts() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.commandManager.undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
                e.preventDefault();
                this.commandManager.redo();
            }
        });
    }
    // --- Generalized auto-scroll for header selection (column/row) ---
    /**
     * Starts auto-scrolling when selecting columns or rows via header drag.
     * @param {MouseEvent} e - The mouse event triggering auto-scroll.
     */
    startAutoScrollHeaderSelection(e) {
        if (this._autoScrollHeaderActive) return;
        this._autoScrollHeaderActive = true;
        console.log("startAutoScrollHeaderSelection");
        const doScroll = () => {
            if (!this.isSelectingHeader || (this.selectionHeaderType !== "column" && this.selectionHeaderType !== "row")) {
                this._autoScrollHeaderActive = false;
                return;
            }
            const containerRect = this.container.getBoundingClientRect();
            const scrollMargin = 15; // px
            let scrolled = false;
            if (this.selectionHeaderType === "column") {
                // Horizontal only for column header
                if (this._lastHeaderMouseEvent && this._lastHeaderMouseEvent.clientX < containerRect.left + scrollMargin) {
                    this.container.scrollLeft -= 10;
                    scrolled = true;
                } else if (this._lastHeaderMouseEvent && this._lastHeaderMouseEvent.clientX > containerRect.right - scrollMargin) {
                    this.container.scrollLeft += 10;
                    scrolled = true;
                }
            } else if (this.selectionHeaderType === "row") {
                // Vertical only for row header
                if (this._lastHeaderMouseEvent && this._lastHeaderMouseEvent.clientY < containerRect.top + scrollMargin) {
                    this.container.scrollTop -= 10;
                    scrolled = true;
                } else if (this._lastHeaderMouseEvent && this._lastHeaderMouseEvent.clientY > containerRect.bottom - scrollMargin) {
                    this.container.scrollTop += 10;
                    scrolled = true;
                }
            }
            if (scrolled) {
                this.renderVisibleTiles();
                if (this.selectionHeaderType === "column") {
                    this.columnSelectionHandler.pointerMove(this._lastHeaderMouseEvent, true);
                } else if (this.selectionHeaderType === "row") {
                    this.rowSelectionHandler.pointerMove(this._lastHeaderMouseEvent, true);

                }
            }
            if (this.isSelectingHeader && (this.selectionHeaderType === "column" || this.selectionHeaderType === "row")) {
                window.requestAnimationFrame(doScroll);
            } else {
                this._autoScrollHeaderActive = false;
            }
        };
        window.requestAnimationFrame(doScroll);
    }

    /**
     * Selects a single cell and updates the selection manager.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     */
    selectCell(row, col) {
        console.log("selectCell", row, col);
        if (this.isEditing) {
            this.finishCellEdit();
        }
        const previousSelection = this.selectedCell;
        this.selectedCell = { row, col };
        const cellSelection = new CellSelection(row, col);
        this.selectionManager.setSelection(cellSelection);
        this.updateStatusBar();
    }

    /**
     * Selects an entire column and updates the selection manager.
     * @param {number} col - The column index.
     */
    selectColumn(col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        const columnSelection = new ColumnSelection(col);
        this.selectionManager.setSelection(columnSelection);
        this.selectedCell = null;
        this.drawHeaders();
        this.updateStatusBar();
    }

    /**
     * Selects an entire row and updates the selection manager.
     * @param {number} row - The row index.
     */
    selectRow(row) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        const rowSelection = new RowSelection(row);
        this.selectionManager.setSelection(rowSelection);
        this.selectedCell = null;
        this.drawHeaders();
        this.updateStatusBar();
    }

    /**
     * Starts editing the specified cell.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     */
    startCellEdit(row, col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }
        if (this.selectionManager.activeSelection &&
            this.selectionManager.activeSelection.type !== 'cell') {
            return;
        }
        this.isEditing = true;
        const cell = this.getCell(row, col);
        if (!this.cellInputManager) {
            this.cellInputManager = new CellInputManager(this);
        }
        this.cellInputManager.showInput(
            row,
            col,
            cell.value || '',
            (newValue) => {
                this.finishCellEdit(newValue);
            },
            () => {
                this.cancelCellEdit();
            }
        );
        this.redrawSelection();
    }

    /**
     * Positions the cell input element for editing at the correct cell location.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     */
    // ...existing code...

    /**
     * Finishes cell editing, saves value, and updates the grid.
     */
    finishCellEdit(newValue) {
        if (!this.isEditing) return;
        const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        const oldValue = cell.value || '';
        if (typeof newValue === 'undefined' && this.cellInputManager?.input) {
            newValue = this.cellInputManager.input.value;
        }
        if (newValue !== oldValue) {
            this.commandManager.execute(new EditCellCommand(this, this.selectedCell.row, this.selectedCell.col, oldValue, newValue));
        }
        if (this.cellInputManager) {
            this.cellInputManager.removeInput();
        }
        this.isEditing = false;
        this.selectionManager.renderSelection();
    }

    /**
     * Cancels cell editing and restores previous value.
     */
    cancelCellEdit() {
        if (!this.isEditing) return;
        if (this.cellInputManager) {
            this.cellInputManager.removeInput();
        }
        this.isEditing = false;
        this.selectionManager.renderSelection();
    }

    /**
     * Redraws a single cell in all visible tiles.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     */
    redrawCellInTiles(row, col) {
        const tileRow = Math.floor(row / VISIBLE_ROWS_PER_CANVAS_TILE);
        const tileCol = Math.floor(col / VISIBLE_COLS_PER_CANVAS_TILE);
        const tileKey = `${tileRow}_${tileCol}`;

        const tile = this.canvasTiles.get(tileKey);
        if (tile) {
            tile.drawSingleCell(row, col); // Use optimized method
        }
    }

    /**
     * Redraws the current selection on all visible tiles.
     */
    redrawSelection() {
        // Redraw all visible tiles to update selection visuals
        for (const tile of this.canvasTiles.values()) {
            tile.draw();
        }
    }

    /**
     * Gets the width of a column by index.
     * @param {number} index - The column index.
     * @returns {number} The width of the column.
     */
    getColumnWidth(index) {
        return this.columns[index]?.width || DEFAULT_COLUMN_WIDTH;
    }

    /**
     * Gets the height of a row by index.
     * @param {number} index - The row index.
     * @returns {number} The height of the row.
     */
    getRowHeight(index) {
        return this.rows[index]?.height || DEFAULT_ROW_HEIGHT;
    }

    /**
     * Sets the width of a column and redraws the grid.
     * @param {number} index - The column index.
     * @param {number} width - The new width.
     */
    setColumnWidth(index, width) {
        if (this.columns[index]) {
            this.columns[index].setWidth(width);
            this.redrawGrid();
        }
    }

    /**
     * Sets the height of a row and redraws the grid.
     * @param {number} index - The row index.
     * @param {number} height - The new height.
     */
    setRowHeight(index, height) {
        if (this.rows[index]) {
            this.rows[index].setHeight(height);
            this.redrawGrid();
        }
    }

    /**
     * Gets the Cell object for the specified row and column, creating it if needed.
     * @param {number} rowIndex - The row index.
     * @param {number} colIndex - The column index.
     * @returns {Cell} The cell object.
     */
    getCell(rowIndex, colIndex) {
        const key = `${rowIndex}_${colIndex}`;
        if (!this.cells.has(key)) {
            this.cells.set(key, new Cell(rowIndex, colIndex));
        }
        return this.cells.get(key);
    }
    /**
     * Checks if a cell has content.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @returns {boolean} True if the cell has content.
     */
    cellHasContent(row, col) {
        const cell = this.getCell(row, col);
        return cell.hasContent();
    }


    /**
     * Creates and positions resize handles for visible rows and columns.
     */
    createResizeHandles() {
        // console.log("createResizeHandles")
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

                rowHeaderContainer.appendChild(handle);
                this.resizeHandles.push(handle);
            }
        }
    }



    /**
     * Redraws the entire grid and headers.
     */
    redrawGrid() {
        for (const [key, tile] of this.canvasTiles.entries()) {
            tile.draw();
        }
        this.drawHeaders();

    }

    /**
     * Updates the content sizer element to match the total grid size.
     */
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

    /**
     * Updates the sizes of the header canvases to match the grid wrapper.
     */
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

    /**
     * Draws the column and row headers, including selection highlights.
     */
    drawHeaders() {
        // console.log("drawHeaders")
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const dpr = window.devicePixelRatio;
        // Get selection info
        let selectedRows = new Set();
        let selectedCols = new Set();
        let selection = this.selectionManager.activeSelection;
        let highlightColHeaders = false;
        let highlightRowHeaders = false;
        let colHeaderBg = '#CAEAD8', colHeaderText = '#0F7045';
        let rowHeaderBg = '#CAEAD8', rowHeaderText = '#0F7045';

        if (selection) {
            if (selection.type === 'cell' || selection.type === 'range') {
                highlightColHeaders = true;
                highlightRowHeaders = true;
                if (selection.type === 'cell') {
                    selectedRows.add(selection.row);
                    selectedCols.add(selection.col);
                } else if (selection.type === 'range') {
                    for (let r = selection.startRow; r <= selection.endRow; r++) selectedRows.add(r);
                    for (let c = selection.startCol; c <= selection.endCol; c++) selectedCols.add(c);

                    // Highlight column headers if the range covers all rows for those columns
                    if (selection.startRow === 0 && selection.endRow === TOTAL_ROWS - 1) {
                        colHeaderBg = '#107C41';
                        colHeaderText = '#fff';
                    }
                    // Highlight row headers if the range covers all columns for those rows
                    if (selection.startCol === 0 && selection.endCol === TOTAL_COLUMNS - 1) {
                        rowHeaderBg = '#107C41';
                        rowHeaderText = '#fff';
                    }
                }
            } else if (selection.type === 'column') {
                highlightColHeaders = true;
                highlightRowHeaders = true; // Highlight all row headers
                selectedCols.add(selection.col);
                for (let r = 0; r < TOTAL_ROWS; r++) selectedRows.add(r);
                colHeaderBg = '#107C41';
                colHeaderText = '#fff';
            } else if (selection.type === 'row') {
                highlightRowHeaders = true;
                highlightColHeaders = true; // Highlight all column headers
                selectedRows.add(selection.row);
                for (let c = 0; c < TOTAL_COLUMNS; c++) selectedCols.add(c);
                rowHeaderBg = '#107C41';
                rowHeaderText = '#fff';
            } else if (selection.type === 'multi-row') {
                highlightRowHeaders = true;
                highlightColHeaders = true;
                for (const r of selection.rows) selectedRows.add(r);
                for (let c = 0; c < TOTAL_COLUMNS; c++) selectedCols.add(c);
                rowHeaderBg = '#107C41'; // Excel green for multi-row selection
                rowHeaderText = '#fff';
            } else if (selection.type === 'multi-column') {
                highlightColHeaders = true;
                highlightRowHeaders = true;
                for (const c of selection.cols) selectedCols.add(c);
                for (let r = 0; r < TOTAL_ROWS; r++) selectedRows.add(r);
                colHeaderBg = '#107C41'; // Excel green for multi-column selection
                colHeaderText = '#fff';
            }
        }

        // Draw column headers
        const colCtx = this.colHeaderCtx;
        colCtx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
        colCtx.font = '12px Arial';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.lineWidth = 1 / dpr;

        let currentX = -scrollLeft;
        let startCol = 0;
        while (currentX < 0 && startCol < TOTAL_COLUMNS) {
            currentX += this.getColumnWidth(startCol);
            startCol++;
        }
        if (startCol > 0) {
            startCol--;
            currentX -= this.getColumnWidth(startCol);
        }

        for (let c = startCol; c < TOTAL_COLUMNS && currentX < this.colHeaderCanvas.clientWidth; c++) {
            const colWidth = this.getColumnWidth(c);
            // Highlight if selected and allowed
            if (highlightColHeaders && selectedCols.has(c)) {
                colCtx.lineWidth = 1;
                colCtx.strokeStyle = '#d1d5db';
                colCtx.strokeRect(currentX - 0.5, 0, colWidth, HEADER_HEIGHT - 3);
                colCtx.fillStyle = colHeaderBg;
                colCtx.fillRect(currentX, 0, colWidth, HEADER_HEIGHT);
                colCtx.strokeStyle = '#0F7045';
                colCtx.lineWidth = 2;
                // Bottom border
                colCtx.beginPath();
                colCtx.moveTo(currentX - 1, HEADER_HEIGHT - 1);
                colCtx.lineTo(currentX + colWidth + 5, HEADER_HEIGHT - 1);
                colCtx.stroke();
                colCtx.lineWidth = 1;
            } else {
                colCtx.fillStyle = '#f8f8f8';
                colCtx.fillRect(currentX, 0, colWidth, HEADER_HEIGHT);
                colCtx.strokeStyle = '#d1d5db';
                colCtx.strokeRect(currentX - 0.5, 0, colWidth, HEADER_HEIGHT);
            }
            // colCtx.strokeStyle = '#d1d5db';
            // colCtx.strokeRect(currentX - 0.5, 0, colWidth, HEADER_HEIGHT);
            colCtx.fillStyle = (highlightColHeaders && selectedCols.has(c)) ? colHeaderText : '#4b5563';
            if (colWidth > 10)
                colCtx.fillText(getColumnName(c), currentX + colWidth / 2, HEADER_HEIGHT / 2);
            currentX += colWidth;
        }

        // Draw row headers
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Arial';
        rowCtx.textAlign = 'left';
        rowCtx.textBaseline = 'middle';
        rowCtx.lineWidth = 1 / dpr;

        let currentY = -scrollTop;
        let startRow = 0;
        while (currentY < 0 && startRow < TOTAL_ROWS) {
            currentY += this.getRowHeight(startRow);
            startRow++;
        }
        if (startRow > 0) {
            startRow--;
            currentY -= this.getRowHeight(startRow);
        }

        for (let r = startRow; r < TOTAL_ROWS && currentY < this.rowHeaderCanvas.clientHeight; r++) {
            const rowHeight = this.getRowHeight(r);
            // Highlight if selected and allowed
            if (highlightRowHeaders && selectedRows.has(r)) {
                rowCtx.lineWidth = 1;
                rowCtx.strokeStyle = '#d1d5db';
                rowCtx.strokeRect(0, currentY - 0.5, HEADER_WIDTH - 2.4, rowHeight);
                rowCtx.fillStyle = rowHeaderBg;
                rowCtx.fillRect(0, currentY, HEADER_WIDTH, rowHeight);
                rowCtx.strokeStyle = '#0F7045';
                rowCtx.lineWidth = 2;
                // Right border
                rowCtx.beginPath();
                rowCtx.moveTo(HEADER_WIDTH - 1, currentY);
                rowCtx.lineTo(HEADER_WIDTH - 1, currentY + rowHeight + 2);
                rowCtx.stroke();
                rowCtx.lineWidth = 1;

            } else {
                rowCtx.fillStyle = '#f8f8f8';
                rowCtx.fillRect(0, currentY, HEADER_WIDTH, rowHeight);
                rowCtx.strokeStyle = '#d1d5db';
                rowCtx.strokeRect(0, currentY - 0.5, HEADER_WIDTH, rowHeight);
            }
            rowCtx.fillStyle = (highlightRowHeaders && selectedRows.has(r)) ? rowHeaderText : '#4b5563';
            if (rowHeight > 10) {
                const text = `${r + 1}`;
                const textWidth = rowCtx.measureText(text).width;
                rowCtx.fillText(text, HEADER_WIDTH - textWidth - 5, currentY + rowHeight / 2);
            }
            currentY += rowHeight;
        }

        this.createResizeHandles();
    }

    /**
     * Handles window or container resize events to update grid layout.
     */
    HandleResize() {
        this.updateHeaderCanvasSizes();
        this.HandleScroll();
        this.selectionManager.renderSelection();
    }

    /**
     * Handles scroll events to update visible tiles and selection.
     * @param {Event} e - The scroll event.
     */
    HandleScroll(e) {
        // console.log("HandleScroll", e);
        // console.log("HandleScroll",e.target.scrollTop, e.target.scrollLeft);
        this.renderVisibleTiles();
        this.selectionManager.handleScroll();

    }

    /**
     * Renders all visible canvas tiles based on current scroll position.
     */
    renderVisibleTiles() {
        // console.log("renderVisibleTiles")
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
    /**
     * Loads sample data into the grid for demonstration purposes.
     */
    loadSampleData() {
        let numRows = 50000;
        let cols = ["id", "name", "age", "salary"];

        for (let i = 0; i < cols.length; i++) {
            this.cells.set("0_" + i, new Cell(0, i, cols[i]));
        }

        // add some data
        for (let row = 1; row < numRows; row++) {
            let person = {
                id: row,
                name: "User" + row,
                age: 20 + (row % 30),
                salary: 50000 + row * 100
            };

            for (let col = 0; col < cols.length; col++) {
                let value = person[cols[col]];
                this.cells.set(row + "_" + col, new Cell(row, col, value.toString()));
            }
        }

        this.renderVisibleTiles();
    }


    /**
     * Updates the status bar with statistics about the current selection.
     */
    updateStatusBar() {
        const statusBar = document.getElementById('status-bar');
        if (!statusBar) return;
        let values = [];
        const sel = this.selectionManager.activeSelection;
        if (!sel) {
            statusBar.textContent = '';
            return;
        }
        if (sel.type === 'cell') {
            const cell = this.getCell(sel.row, sel.col);
            if (!isNaN(cell.value) && cell.value !== '') values = [Number(cell.value)];
        } else if (sel.type === 'range') {
            for (let r = sel.startRow; r <= sel.endRow; r++) {
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    const cell = this.getCell(r, c);
                    if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
                }
            }
        } else if (sel.type === 'row') {
            for (let c = 0; c < this.columns.length; c++) {
                const cell = this.getCell(sel.row, c);
                if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
            }
        } else if (sel.type === 'column') {
            for (let r = 0; r < this.rows.length; r++) {
                const cell = this.getCell(r, sel.col);
                if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
            }
        }
        if (values.length === 0) {
            statusBar.textContent = '';
            return;
        }
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = sum / count;
        statusBar.textContent = `Count: ${count}    Sum: ${sum}    Min: ${min}    Max: ${max}    Avg: ${avg.toFixed(2)}`;
    }


}

document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');
    grid.loadSampleData(); // Load sample data after grid initialization
});