import { RangeSelection } from "./Selection.js";
import { TOTAL_COLUMNS, TOTAL_ROWS } from "./config.js";
export class RowResizeHandler {
    constructor(grid) {
        this.grid = grid;
    }
    handleRowHeaderMouseDown(e) {
        if (!this.grid.eventManager.hitTest(e, 'rowHeader')) return;
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
    handleRowHeaderMouseMove(e, fromAutoScroll) {
        if (!this.grid.eventManager.hitTest(e, 'rowHeader')) return;
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
    handleRowHeaderMouseUp(e) {
        if (this.grid.isSelectingHeader && this.grid.selectionHeaderType === "row") {
            this.grid.isSelectingHeader = false;
            this.grid.selectionHeaderType = null;
            this.grid.selectionHeaderStart = null;
        }
    }
} 