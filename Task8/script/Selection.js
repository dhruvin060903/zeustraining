
export class SelectionManager {
    constructor(grid) {
        this.grid = grid;
        this.activeSelection = null;
        this.selectionOverlay = this.createSelectionOverlay();
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
    createSelectionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.style.display = 'none';
        this.grid.container.appendChild(overlay);
        return overlay;
    }

    setSelection(selection) {
        this.activeSelection = selection;
        this.renderSelection();
    }

    clearSelection() {
        this.activeSelection = null;
        this.selectionOverlay.style.display = 'none';
    }

    renderSelection() {
        console.log('Rendering selection:', this.activeSelection); // Debug log
        if (!this.activeSelection) {
            this.selectionOverlay.style.display = 'none';
            console.log('No active selection, hiding overlay');
            return;
        }

        let selection = this.activeSelection;
        // Check if RangeSelection spans only one cell
        if (selection.type === 'range' &&
            selection.startRow === selection.endRow &&
            selection.startCol === selection.endCol) {
            selection = new CellSelection(selection.startRow, selection.startCol);
            this.activeSelection = selection; // Update activeSelection
        }

        selection.render(this.selectionOverlay);
        this.selectionOverlay.style.display = 'block';

    }
    handleScroll() {
        if (this.activeSelection) {
            this.renderSelection();
        }
    }
}

export class CellSelection {
    constructor(row, col) {
        this.type = 'cell';
        this.row = row;
        this.col = col;
    }

    render(overlay) {
        const grid = overlay.parentElement.grid || window.grid;

        let left = 0;
        for (let c = 0; c < this.col; c++) {
            left += grid.getColumnWidth(c);
        }

        let top = 0;
        for (let r = 0; r < this.row; r++) {
            top += grid.getRowHeight(r);
        }

        const width = grid.getColumnWidth(this.col);
        const height = grid.getRowHeight(this.row);

        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${width - 2}px`;
        overlay.style.height = `${height - 2}px`;
        overlay.style.border = '2px solid #137E43';
        overlay.style.backgroundColor = 'rgba(0,0,0,0)';
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

    render(overlay) {
        const grid = overlay.parentElement.grid || window.grid;

        let left = 0;
        for (let c = 0; c < this.col; c++) {
            left += grid.getColumnWidth(c);
        }

        const width = grid.getColumnWidth(this.col);
        let totalHeight = 0;
        for (let r = 0; r < grid.rows.length; r++) {
            totalHeight += grid.getRowHeight(r);
        }

        overlay.style.left = `${left}px`;
        overlay.style.top = '0px';
        overlay.style.width = `${width - 2}px`;
        overlay.style.height = `${totalHeight}px`;
        overlay.style.border = '2px solid #137E43';
        overlay.style.backgroundColor = 'rgba(232, 242, 236, 0.3)';
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

    render(overlay) {
        const grid = overlay.parentElement.grid || window.grid;

        let top = 0;
        for (let r = 0; r < this.row; r++) {
            top += grid.getRowHeight(r);
        }

        const height = grid.getRowHeight(this.row);
        let totalWidth = 0;
        for (let c = 0; c < grid.columns.length; c++) {
            totalWidth += grid.getColumnWidth(c);
        }

        overlay.style.left = '0px';
        overlay.style.top = `${top}px`;
        overlay.style.width = `${totalWidth}px`;
        overlay.style.height = `${height - 2}px`;
        overlay.style.border = '2px solid #137E43';
        overlay.style.backgroundColor = 'rgba(232, 242, 236, 0.3)';

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

    render(overlay) {
        const grid = overlay.parentElement.grid || window.grid;

        let left = 0;
        for (let c = 0; c < this.startCol; c++) {
            left += grid.getColumnWidth(c);
        }

        let top = 0;
        for (let r = 0; r < this.startRow; r++) {
            top += grid.getRowHeight(r);
        }

        let width = 0;
        for (let c = this.startCol; c <= this.endCol; c++) {
            width += grid.getColumnWidth(c);
        }

        let height = 0;
        for (let r = this.startRow; r <= this.endRow; r++) {
            height += grid.getRowHeight(r);
        }

        // Adjust for scroll position
        // left -= grid.container.scrollLeft;
        // top -= grid.container.scrollTop;

        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${width - 2}px`;
        overlay.style.height = `${height - 2}px`;
        overlay.style.border = '2px solid #137E43';
        overlay.style.backgroundColor = 'rgba(232, 242, 236, 0.3)';
    }

    contains(row, col) {
        return row >= this.startRow && row <= this.endRow &&
            col >= this.startCol && col <= this.endCol;
    }
}
