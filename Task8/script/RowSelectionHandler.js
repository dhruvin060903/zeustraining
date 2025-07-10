import { RangeSelection } from "./Selection.js";
import { TOTAL_COLUMNS, TOTAL_ROWS } from "./config.js";
export class RowSelectionHandler {
    /**
     * Creates a new RowSelectionHandler for the grid.
     * @param {Object} grid - The grid instance this handler operates on.
     */
    constructor(grid) {
        /**
         * Reference to the grid instance.
         * @type {Object}
         */
        this.grid = grid;
    }
    /**
        * Check if the event is within the row header area.
        */
    hitTest(e) {
        console.log(e.target === this.grid.rowHeaderCanvas);
        if (e.target === this.grid.rowHeaderCanvas)
            return true;
        else
            return false;
    }

    /**
        * Handles mouse up event on the row header to finish row selection.
        */
    pointerUp(e) {
        if (this.grid.isSelectingHeader && this.grid.selectionHeaderType === "row") {
            this.grid.isSelectingHeader = false;
            this.grid.selectionHeaderType = null;
            this.grid.selectionHeaderStart = null;
        }
    }
    /**
    * Handles mouse down event on the row header to start row selection.
    */
    pointerdown(e) {
        const rect = this.grid.rowHeaderCanvas.getBoundingClientRect();
        const y = e.clientY - rect.top + this.grid.container.scrollTop;
        let currentY = 0;
        for (let r = 0; r < TOTAL_ROWS; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                this.grid.isSelectingHeader = true;
                this.grid.selectionHeaderType = "row";
                this.grid.selectionHeaderStart = r;
                // Start with single row selection
                this.grid.selectRow(r);
                break;
            }
            currentY += rowHeight;
        }
    }
    /**
   * Handles mouse move event on the row header to update row range selection.
   */
    pointerMove(e, fromAutoScroll) {
        this.grid._lastHeaderMouseEvent = e;
        if (!fromAutoScroll) this.grid.startAutoScrollHeaderSelection(e);
        if (!this.grid.isSelectingHeader || this.grid.selectionHeaderType !== "row") return;
        const rect = this.grid.rowHeaderCanvas.getBoundingClientRect();
        const y = e.clientY - rect.top + this.grid.container.scrollTop;
        let currentY = 0;
        for (let r = 0; r < TOTAL_ROWS; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                // Range selection from anchor to current
                const anchorRow = this.grid.selectionHeaderStart;
                const anchorCol = 0;
                const rangeSelection = new RangeSelection(
                    anchorRow,
                    anchorCol,
                    r,
                    TOTAL_COLUMNS - 1,
                    r, 0 // active cell at left of current row
                );
                rangeSelection.startAnchorRow = anchorRow;
                rangeSelection.startAnchorCol = anchorCol;
                this.grid.selectionManager.setSelection(rangeSelection);
                this.grid.drawHeaders();
                break;
            }
            currentY += rowHeight;
        }
    }

} 