import { TOTAL_COLUMNS, TOTAL_ROWS, VISIBLE_COLS_PER_CANVAS_TILE, VISIBLE_ROWS_PER_CANVAS_TILE } from './config.js';
export class SelectionManager {
    /**
     * Creates a new SelectionManager for the grid.
     * @param {Object} grid - The grid instance this manager operates on.
     */
    constructor(grid) {
        /**
         * Reference to the grid instance.
         * @type {Object}
         */
        this.grid = grid;
        /**
         * The current active selection (cell, range, row, or column).
         * @type {CellSelection|RangeSelection|RowSelection|ColumnSelection|null}
         */
        this.activeSelection = null;
        // Listen for keyboard navigation and editing
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    getCellFromPosition(x, y, tileRow, tileCol) {
        const startGlobalRow = tileRow * VISIBLE_ROWS_PER_CANVAS_TILE;
        const startGlobalCol = tileCol * VISIBLE_COLS_PER_CANVAS_TILE;

        let currentY = 0;
        for (let r = startGlobalRow; r < Math.min(startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS); r++) {
            const rowHeight = this.grid.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                let currentX = 0;
                for (let c = startGlobalCol; c < Math.min(startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS); c++) {
                    const colWidth = this.grid.getColumnWidth(c);
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

    hitTest(e) {
        console.log((e.target.classList && e.target.classList.contains('grid-canvas-tile')) || e.target === this.grid.container)
        if ((e.target.classList && e.target.classList.contains('grid-canvas-tile')) || e.target === this.grid.container) {
            return true;
        }
        else {
            return false;
        }
    }
    // --- Improved auto-scroll for range selection using requestAnimationFrame ---
    /**
     * Starts auto-scrolling when selecting a range by dragging outside the visible area.
     * @param {MouseEvent} e - The mouse event triggering auto-scroll.
     */
    startAutoScrollSelection(e) {
        if (this.grid._autoScrollActive) return;
        this.grid._autoScrollActive = true;
        const doScroll = () => {

            if (!this.grid.isSelecting) {
                this.grid._autoScrollActive = false;
                return;
            }
            console.log("startAutoScrollSelection");;
            const containerRect = this.grid.container.getBoundingClientRect();
            const scrollMargin = 20; // px
            let scrolled = false;
            const lasstX = this._lastMouseEvent.clientX;
            const lastY = this._lastMouseEvent.clientY;
            // Horizontal
            if (this._lastMouseEvent && this._lastMouseEvent.clientX < containerRect.left + scrollMargin) {
                this.grid.container.scrollLeft -= 2;
                scrolled = true;
            } else if (this._lastMouseEvent && this._lastMouseEvent.clientX > containerRect.right - scrollMargin) {
                this.grid.container.scrollLeft += 2;
                scrolled = true;
            }
            // Vertical
            if (this._lastMouseEvent && this._lastMouseEvent.clientY < containerRect.top + scrollMargin) {
                this.grid.container.scrollTop -= 2;
                scrolled = true;
            } else if (this._lastMouseEvent && this._lastMouseEvent.clientY > containerRect.bottom - scrollMargin) {
                this.grid.container.scrollTop += 2;
                scrolled = true;
            }
            if (scrolled) {
                // Always re-render visible tiles to fix missing canvas/selection when scrolling up/left
                this.grid.renderVisibleTiles();
                // Call the selection update logic
                this.pointerMove(this._lastMouseEvent, true);
            }
            if (this.grid.isSelecting && this._lastMouseEvent.clientX == lasstX && this._lastMouseEvent.clientY == lastY) {
                setTimeout(doScroll, 100); // If no movement, wait a bit before next scroll
            }
            else {
                this.grid._autoScrollActive = false;
            }
        };
        window.requestAnimationFrame(doScroll);
    }
    /**
    * Handles mouse up event to finish selection and update UI.
    */
    pointerUp(e) {
        this.grid.isSelecting = false;
        // this.selectionStart = null;
        this.grid.selectionManager.renderSelection();
        this.grid.finishCellEdit();
        this.grid.updateStatusBar();
    }
    /**
    * Handles mouse down event to start a new selection if on a grid tile.
    */
    pointerdown(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const tileRow = parseInt(e.target.dataset.tileRow);
        const tileCol = parseInt(e.target.dataset.tileCol);

        const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
        if (cellCoords) {
            this.grid.isSelecting = true;
            this.grid.selectionStart = cellCoords;

        }

    }
    /**
     * Handles mouse move event for updating selection range, including extrapolation when outside tiles.
     */
    pointerMove(e, fromAutoScroll) {

        this._lastMouseEvent = e;
        if (!fromAutoScroll) this.startAutoScrollSelection(e);
        if (!this.grid.isSelecting || !this.grid.selectionStart) return;

        const anchorRow = this.grid.selectionStart.row;
        const anchorCol = this.grid.selectionStart.col;

        const target = e.target.closest('.grid-canvas-tile');
        if (!target) {
            // Mouse is outside any canvas tile, extrapolating cell coordinates
            const containerRect = this.grid.container.getBoundingClientRect();
            let x = e.clientX - containerRect.left + this.grid.container.scrollLeft;
            let y = e.clientY - containerRect.top + this.grid.container.scrollTop;

            // Calculate approximate row and column based on position
            let row = 0, col = 0;
            let currentY = 0, currentX = 0;

            // Find row
            for (let r = 0; r < TOTAL_ROWS; r++) {
                const rowHeight = this.grid.getRowHeight(r);
                if (y >= currentY && y < currentY + rowHeight) {
                    row = r;
                    break;
                } else if (y < currentY) {
                    row = Math.max(0, r - 1);
                    break;
                }
                currentY += rowHeight;
                if (r === TOTAL_ROWS - 1 && y >= currentY) {
                    row = TOTAL_ROWS - 1;
                }
            }

            // Find column
            for (let c = 0; c < TOTAL_COLUMNS; c++) {
                const colWidth = this.grid.getColumnWidth(c);
                if (x >= currentX && x < currentX + colWidth) {
                    col = c;
                    break;
                } else if (x < currentX) {
                    col = Math.max(0, c - 1);
                    break;
                }
                currentX += colWidth;
                if (c === TOTAL_COLUMNS - 1 && x >= currentX) {
                    col = TOTAL_COLUMNS - 1;
                }
            }

            // Create range selection and pass anchor
            const rangeSelection = new RangeSelection(
                anchorRow,
                anchorCol,
                row,
                col,
                row, // activeRow
                col  // activeCol
            );
            rangeSelection.startAnchorRow = anchorRow;
            rangeSelection.startAnchorCol = anchorCol;
            this.grid.selectionManager.setSelection(rangeSelection);
            this.grid.selectionManager.scrollSelectionIntoView();
        } else {
            // Mouse is within a canvas tile
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const tileRow = parseInt(target.dataset.tileRow);
            const tileCol = parseInt(target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                // Create range selection with active cell for correct scrolling
                const rangeSelection = new RangeSelection(
                    anchorRow,
                    anchorCol,
                    cellCoords.row,
                    cellCoords.col,
                    cellCoords.row, // activeRow
                    cellCoords.col  // activeCol
                );
                rangeSelection.startAnchorRow = anchorRow;
                rangeSelection.startAnchorCol = anchorCol;
                this.grid.selectionManager.setSelection(rangeSelection);
                this.grid.selectionManager.scrollSelectionIntoView();
            }
        }

        this.grid.drawHeaders();
    }



    /**
     * Handles keyboard navigation and editing for the grid selection.
     */
    handleKeydown(e) {
        console.log("keydown event", e.key);

        const key = e.key;
        if (this.grid.isEditing && key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") {
            return;
        }

        console.log("event", this.grid.container.scrollTop, this.grid.container.scrollLeft);

        switch (key) {
            case "ArrowLeft":
                e.preventDefault();
                this.handleArrowLeft();
                return;

            case "ArrowRight":
                e.preventDefault();
                this.handleArrowRight();
                return;

            case "ArrowUp":
                e.preventDefault();
                this.handleArrowUp();
                return;

            case "ArrowDown":
                e.preventDefault();
                this.handleArrowDown();
                return;
            case "Enter":
                e.preventDefault();
                this.handleArrowDown();
                return;
            case "Tab":
                e.preventDefault();
                this.handleArrowRight();
                return;
        }

        this.grid.selectedCell = { row: this.activeSelection.row, col: (this.activeSelection.col) };
        // If user pressed a single printable character without modifier keys

        if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            let currentRow = 0, currentCol = 0;

            // Determine current selected cell
            if (this.activeSelection?.type === 'cell') {
                currentRow = this.activeSelection.row;
                currentCol = this.activeSelection.col;
            } else if (
                this.activeSelection?.type === 'range' &&
                this.activeSelection.startRow === this.activeSelection.endRow &&
                this.activeSelection.startCol === this.activeSelection.endCol
            ) {
                currentRow = this.activeSelection.startRow;
                currentCol = this.activeSelection.startCol;
            }

            // Start editing the selected cell
            this.grid.startCellEdit(currentRow, currentCol);

            // Set the pressed key as the initial input
            if (this.grid.cellInput) {
                this.grid.cellInput.value = key;
                this.grid.cellInput.focus();
                // this.grid.cellInput.setSelectionRange(1, 1); // Cursor after character
            }

            // e.preventDefault(); // Prevent browser default (e.g., scrolling)
        }

    }
    /**
     * Handles ArrowUp key to move selection up.
     */
    handleArrowUp() {
        console.log("ArrowUp pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                // this.setSelection(new CellSelection(Math.max(this.activeSelection.row - 1, 0), this.activeSelection.col));
                this.grid.selectCell(Math.max(this.activeSelection.row - 1, 0), this.activeSelection.col);
                this.grid.drawHeaders();

            }
        }
    }
    /**
     * Handles ArrowLeft key to move selection left.
     */
    handleArrowLeft() {
        console.log("ArrowLeft pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                console.log(this.activeSelection.col);
                // this.setSelection(new CellSelection(this.activeSelection.row, Math.max(this.activeSelection.col - 1, 0)));

                this.grid.selectCell(this.activeSelection.row, Math.max(this.activeSelection.col - 1, 0));
                this.grid.drawHeaders();

            }
        }
    }
    /**
     * Handles ArrowRight key to move selection right.
     */
    handleArrowRight() {
        console.log("ArrowRight pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                // this.setSelection(new CellSelection(this.activeSelection.row, Math.min(this.activeSelection.col + 1), TOTAL_COLUMNS - 1));
                this.grid.selectCell(this.activeSelection.row, Math.min(this.activeSelection.col + 1), TOTAL_COLUMNS - 1);
                this.grid.drawHeaders();

            }
        }
    }
    /**
     * Handles ArrowDown key to move selection down.
     */
    handleArrowDown() {
        console.log("ArrowDown pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {

                this.grid.selectCell(Math.min(this.activeSelection.row + 1, TOTAL_ROWS), this.activeSelection.col);
                this.grid.drawHeaders();

                // this.setSelection(new CellSelection(Math.min(this.activeSelection.row + 1, TOTAL_ROWS), this.activeSelection.col));
            }
        }
    }


    /**
    * Handles single click events on grid tiles for cell selection.
    * @param {MouseEvent} e - The click event.
    */
    handleClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                // Check if there's an active RangeSelection and if the click is within it
                if (this.grid.selectionManager.activeSelection?.type === 'range' &&
                    this.grid.selectionManager.activeSelection.contains(cellCoords.row, cellCoords.col)) {
                    // Clicked within the existing range selection, do nothing to preserve it
                    // console.log("erer")
                    console.log("single click")
                    return;
                }

                // Clicked outside the range or no range selection, select the single cell
                this.grid.selectCell(cellCoords.row, cellCoords.col);

            } else {
                // Clicked outside any valid cell, clear selection
                this.clearSelection();
            }
        }
        this.grid.drawHeaders();

    }

    /**
     * Handles double-click events on a cell to start editing.
     * @param {MouseEvent} e - The double-click event.
     */
    handleCellDoubleClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log(e.clientX, e.clientY, rect.left, rect.top, x, y);
            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.grid.startCellEdit(cellCoords.row, cellCoords.col);
            }
        }
    }
    /**
     * Sets the current selection and redraws it.
     * @param {CellSelection|RangeSelection|RowSelection|ColumnSelection} selection
     */
    setSelection(selection) {
        this.activeSelection = selection;
        this.scrollSelectionIntoView();
        this.grid.redrawSelection(); // Redraw selection on canvas
    }
    /**
     * Scrolls the grid to ensure the active selection is visible.
     */
    scrollSelectionIntoView() {
        if (!this.activeSelection) return;
        if (this.activeSelection.type === 'multi-row') {
            // Scroll to first selected row
            if (this.activeSelection.rows && this.activeSelection.rows.length > 0) {
                let row = this.activeSelection.rows[0];
                let top = 0;
                for (let r = 0; r < row; r++) top += this.grid.getRowHeight(r);
                const visibleTop = this.grid.container.scrollTop;
                if (top < visibleTop) {
                    this.grid.container.scrollTop = top;
                }
            }
            return;
        }
        if (this.activeSelection.type === 'multi-column') {
            // Scroll to first selected column
            if (this.activeSelection.cols && this.activeSelection.cols.length > 0) {
                let col = this.activeSelection.cols[0];
                let left = 0;
                for (let c = 0; c < col; c++) left += this.grid.getColumnWidth(c);
                const visibleLeft = this.grid.container.scrollLeft;
                if (left < visibleLeft) {
                    this.grid.container.scrollLeft = left;
                }
            }
            return;
        }
        // ...existing code for cell, range, row, column...
        let row = 0, col = 0;
        if (this.activeSelection.type === 'cell') {
            row = this.activeSelection.row;
            col = this.activeSelection.col;
        } else if (this.activeSelection.type === 'range') {
            row = (typeof this.activeSelection.activeRow === 'number') ? this.activeSelection.activeRow : this.activeSelection.startRow;
            col = (typeof this.activeSelection.activeCol === 'number') ? this.activeSelection.activeCol : this.activeSelection.startCol;
        } else if (this.activeSelection.type === 'row') {
            row = this.activeSelection.row;
            col = 0;
        } else if (this.activeSelection.type === 'column') {
            row = 0;
            col = this.activeSelection.col;
        }
        const container = this.grid.container;
        let left = 0, top = 0;
        for (let c = 0; c < col; c++) left += this.grid.getColumnWidth(c);
        for (let r = 0; r < row; r++) top += this.grid.getRowHeight(r);
        const colWidth = this.grid.getColumnWidth(col);
        const rowHeight = this.grid.getRowHeight(row);
        const visibleLeft = container.scrollLeft;
        const visibleTop = container.scrollTop;
        const visibleRight = visibleLeft + container.clientWidth;
        const visibleBottom = visibleTop + container.clientHeight;
        if (left < visibleLeft) {
            container.scrollLeft = left;
        } else if (left + colWidth > visibleRight) {
            container.scrollLeft = left + colWidth - container.clientWidth;
        }
        if (top < visibleTop) {
            container.scrollTop = top;
        } else if (top + rowHeight > visibleBottom) {
            container.scrollTop = top + rowHeight - container.clientHeight;
        }
    }
    /**
     * Clears the current selection and redraws the grid.
     */
    clearSelection() {
        this.activeSelection = null;
        this.grid.redrawSelection();
    }
    /**
     * Redraws the current selecti`on on the grid.
     */
    renderSelection() {
        this.grid.redrawSelection();
    }
    /**
     * Handles scroll events to redraw the selection.
     */
    handleScroll() {
        this.grid.redrawSelection();
    }
}

export class CellSelection {
    constructor(row, col) {
        this.type = 'cell';
        this.row = row;
        this.col = col;
    }

    contains(row, col) {
        return this.row === row && this.col === col;
    }
}

export class ColumnSelection {
    constructor(col) {
        this.type = 'column';
        this.col = col;
    }

    contains(row, col) {
        return this.col === col;
    }
}

export class RowSelection {
    constructor(row) {
        this.type = 'row';
        this.row = row;
    }

    contains(row, col) {
        return this.row === row;
    }
}

export class RangeSelection {
    constructor(startRow, startCol, endRow, endCol, activeRow, activeCol) {
        this.type = 'range';
        this.startRow = Math.min(startRow, endRow);
        this.startCol = Math.min(startCol, endCol);
        this.endRow = Math.max(startRow, endRow);
        this.endCol = Math.max(startCol, endCol);
        // Track the active cell within the range (caret position)
        this.activeRow = (typeof activeRow === 'number') ? activeRow : endRow;
        this.activeCol = (typeof activeCol === 'number') ? activeCol : endCol;
    }

    contains(row, col) {
        return row >= this.startRow && row <= this.endRow &&
            col >= this.startCol && col <= this.endCol;
    }
}
