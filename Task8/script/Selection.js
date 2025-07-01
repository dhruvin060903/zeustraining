export class SelectionManager {
    constructor(grid) {
        this.grid = grid;
        this.activeSelection = null;
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    handleKeydown(e) {
        if (this.grid.isEditing) {
            return;
        }

        // Get current selection
        let currentRow, currentCol;
        if (this.activeSelection?.type === 'cell') {
            currentRow = this.activeSelection.row;
            currentCol = this.activeSelection.col;
        } else if (this.activeSelection?.type === 'range' &&
            this.activeSelection.startRow === this.activeSelection.endRow &&
            this.activeSelection.startCol === this.activeSelection.endCol) {
            currentRow = this.activeSelection.startRow;
            currentCol = this.activeSelection.startCol;
        } else {

            currentRow = 0;
            currentCol = 0;
        }


        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            this.grid.startCellEdit(currentRow, currentCol);
            // Set the initial value to the pressed key
            if (this.grid.cellInput) {
                this.grid.cellInput.value = e.key;
                this.grid.cellInput.focus();
                this.grid.cellInput.setSelectionRange(1, 1); // Place cursor after the character
            }
            e.preventDefault();
        }

    }
    setSelection(selection) {
        this.activeSelection = selection;
        this.grid.redrawSelection(); // Redraw selection on canvas
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
    constructor(startRow, startCol, endRow, endCol) {
        this.type = 'range';
        this.startRow = Math.min(startRow, endRow);
        this.startCol = Math.min(startCol, endCol);
        this.endRow = Math.max(startRow, endRow);
        this.endCol = Math.max(startCol, endCol);
    }

    contains(row, col) {
        return row >= this.startRow && row <= this.endRow &&
            col >= this.startCol && col <= this.endCol;
    }
}
