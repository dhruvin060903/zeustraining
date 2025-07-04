import { TOTAL_COLUMNS, TOTAL_ROWS } from './config.js';
export class SelectionManager {
    constructor(grid) {
        this.grid = grid;
        this.activeSelection = null;
        document.addEventListener('keydown', this.handleKeydown.bind(this));

    }

    handleKeydown(e) {
        console.log("keydown event", e.key);
        // e.preventDefault();
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
                this.grid.cellInput.setSelectionRange(1, 1); // Cursor after character
            }

            // e.preventDefault(); // Prevent browser default (e.g., scrolling)
        }
    }
    handleArrowUp() {
        console.log("ArrowUp pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                this.setSelection(new CellSelection(Math.max(this.activeSelection.row - 1, 0), this.activeSelection.col));

            }
        }
    }
    handleArrowLeft() {
        console.log("ArrowLeft pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                console.log(this.activeSelection.col);
                this.setSelection(new CellSelection(this.activeSelection.row, Math.max(this.activeSelection.col - 1, 0)));


            }
        }
    }
    handleArrowRight() {
        console.log("ArrowRight pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                this.setSelection(new CellSelection(this.activeSelection.row, Math.min(this.activeSelection.col + 1), TOTAL_COLUMNS - 1));
            }
        }
    }
    handleArrowDown() {
        console.log("ArrowDown pressed");
        if (this.activeSelection) {
            if (this.activeSelection.type === 'cell') {
                this.setSelection(new CellSelection(Math.min(this.activeSelection.row + 1, TOTAL_ROWS), this.activeSelection.col));
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
            container.scrollTop = top ;
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
