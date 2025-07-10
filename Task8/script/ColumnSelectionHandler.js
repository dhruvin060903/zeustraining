import { RangeSelection } from "./Selection.js";
import { TOTAL_COLUMNS, TOTAL_ROWS } from "./config.js";
/**
 * Handles column header selection and drag logic for the grid.
 */
export class ColumnSelectionHandler {
    /**
     * Constructs a ColumnSelectionHandler for the grid.
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
        console.log(e.target === this.grid.colHeaderCanvas);

        if (e.target === this.grid.colHeaderCanvas)
            return true;
        else
            return false;
    }
    /**
        * Handles mouse up event to finish column header selection.
        * @param {MouseEvent} e - The mouse up event.
        */

    pointerUp(e) {
        if (this.grid.isSelectingHeader && this.grid.selectionHeaderType === "column") {
            this.grid.isSelectingHeader = false;
            this.grid.selectionHeaderType = null;
            this.grid.selectionHeaderStart = null;
        }
    }
    /**
     * Handles mouse down event on the column header to start column selection.
     * @param {MouseEvent} e - The mouse down event.
     */
    pointerdown(e) {
        const rect = this.grid.colHeaderCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.grid.container.scrollLeft;
        let currentX = 0;
        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            const colWidth = this.grid.getColumnWidth(c);
            if (x >= currentX && x < currentX + colWidth) {
                this.grid.isSelectingHeader = true;
                this.grid.selectionHeaderType = "column";
                this.grid.selectionHeaderStart = c;
                // Start with single column selection
                this.grid.selectColumn(c);
                break;
            }
            currentX += colWidth;
        }
    }
    /**
   * Handles mouse move event on the column header for range selection by drag.
   * @param {MouseEvent} e - The mouse move event.
   * @param {boolean} fromAutoScroll - Whether triggered by auto-scroll logic.
   */
    pointerMove(e, fromAutoScroll) {
        this.grid._lastHeaderMouseEvent = e;
        if (!fromAutoScroll) this.grid.startAutoScrollHeaderSelection(e);
        if (!this.grid.isSelectingHeader || this.grid.selectionHeaderType !== "column") return;
        const rect = this.grid.colHeaderCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.grid.container.scrollLeft;
        let currentX = 0;
        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            const colWidth = this.grid.getColumnWidth(c);
            if (x >= currentX && x < currentX + colWidth) {
                // Range selection from anchor to current
                const anchorCol = this.grid.selectionHeaderStart;
                const anchorRow = 0;
                const rangeSelection = new RangeSelection(
                    anchorRow,
                    anchorCol,
                    TOTAL_ROWS - 1,
                    c,
                    0, c // active cell at top of current col
                );
                rangeSelection.startAnchorRow = anchorRow;
                rangeSelection.startAnchorCol = anchorCol;
                this.grid.selectionManager.setSelection(rangeSelection);
                this.grid.drawHeaders();
                break;
            }
            currentX += colWidth;
        }
    }

} 