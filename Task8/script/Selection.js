import { TOTAL_COLUMNS, TOTAL_ROWS } from './config.js';
export class SelectionManager {
    constructor(grid) {
        this.grid = grid;
        this.activeSelection = null;
        document.addEventListener('keydown', this.handleKeydown.bind(this));

    }
    handleMouseUpForSelection(e) {
        this.grid.isSelecting = false;
        // this.selectionStart = null;
        this.grid.selectionManager.renderSelection();
        this.grid.finishCellEdit();
        this.grid.updateStatusBar();

    }

    handleMouseDown(e) {
        if (!this.grid.eventManager.hitTest(e, 'grid')) return;
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.grid.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.grid.isSelecting = true;
                this.grid.selectionStart = cellCoords;
                // e.preventDefault();
            }
        }
    }


    handleMouseMoveForSelection(e, fromAutoScroll) {
        // console.log("handleMouseMoveForSelection2");

        if (!this.grid.eventManager.hitTest(e, 'grid')) return;
        this.grid._lastMouseEvent = e;
        if (!fromAutoScroll) this.grid.startAutoScrollSelection(e);
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

            const cellCoords = this.grid.getCellFromPosition(x, y, tileRow, tileCol);
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

    handleKeydown(e) {
        console.log("keydown event", e.key);

        if (this.grid.isEditing) {
            return;
        }

        console.log("event", this.grid.container.scrollTop, this.grid.container.scrollLeft);

        const key = e.key;
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
    setSelection(selection) {
        this.activeSelection = selection;
        this.scrollSelectionIntoView();
        this.grid.redrawSelection(); // Redraw selection on canvas
    }
    scrollSelectionIntoView() {
        if (!this.activeSelection) return;
        let row = 0, col = 0;
        if (this.activeSelection.type === 'cell') {
            row = this.activeSelection.row;
            col = this.activeSelection.col;
        } else if (this.activeSelection.type === 'range') {
            // Use active cell if present, else fallback to startRow/startCol
            // console.log("activeSelection", this.activeSelection);
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
        // Scroll horizontally if needed
        if (left < visibleLeft) {
            // console.log("left", left, "visibleLeft", visibleLeft);
            container.scrollLeft = left;
        } else if (left + colWidth > visibleRight) {
            // console.log("colWidth", colWidth, "container.clientWidth", container.clientWidth);
            container.scrollLeft = left + colWidth - container.clientWidth;
        }
        // Scroll vertically if needed
        if (top < visibleTop) {
            container.scrollTop = top;
        } else if (top + rowHeight > visibleBottom) {
            container.scrollTop = top + rowHeight - container.clientHeight;
        }
    }
    clearSelection() {
        this.activeSelection = null;
        this.grid.redrawSelection();
    }
    renderSelection() {
        this.grid.redrawSelection();
    }
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
