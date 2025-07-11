export class CellInputManager {
    /**
     * @param {Grid} grid - Reference to the grid instance
     */
    constructor(grid) {
        this.grid = grid;
        this.input = null;
    }

    /**
     * Creates and shows the input element for cell editing
     * @param {number} row 
     * @param {number} col 
     * @param {string} initialValue 
     * @param {function} onFinish - Callback for finishing edit
     * @param {function} onCancel - Callback for canceling edit
     */
    showInput(row, col, initialValue, onFinish, onCancel) {
        this.removeInput();
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'cell-input';
        this.input.value = initialValue || '';
        this.positionInput(row, col);
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
                onFinish(this.input.value);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                onCancel();
                e.preventDefault();
            }
        });
        this.grid.container.appendChild(this.input);
        this.input.focus();
        this.input.select();
    }

    /**
     * Positions the input element at the correct cell location
     */
    positionInput(row, col) {
        let left = 0;
        for (let c = 0; c < col; c++) {
            left += this.grid.getColumnWidth(c);
        }
        let top = 0;
        for (let r = 0; r < row; r++) {
            top += this.grid.getRowHeight(r);
        }
        const colWidth = this.grid.getColumnWidth(col);
        const rowHeight = this.grid.getRowHeight(row);
        this.input.style.position = 'absolute';
        this.input.style.left = `${left + 1}px`;
        this.input.style.top = `${top + 1}px`;
        this.input.style.width = `${colWidth - 2}px`;
        this.input.style.height = `${rowHeight - 2}px`;
        this.input.style.border = '0px';
        this.input.style.outline = 'none';
        this.input.style.fontSize = '16px';
        this.input.style.zIndex = '1000';
    }

    /**
     * Removes the input element from the grid
     */
    removeInput() {
        if (this.input && this.input.parentNode) {
            this.input.parentNode.removeChild(this.input);
        }
        this.input = null;
    }
}
