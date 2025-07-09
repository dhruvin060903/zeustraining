import { RangeSelection } from "./Selection.js";
import { TOTAL_COLUMNS, TOTAL_ROWS } from "./config.js";
export class ColumnResizeHandler {
    constructor(grid) {
        this.grid = grid;
    }
    handleColumnHeaderMouseDown(e) {
        if (!this.grid.eventManager.hitTest(e, 'colHeader')) return;
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
    handleColumnHeaderMouseMove(e, fromAutoScroll) {
        if (!this.grid.eventManager.hitTest(e, 'colHeader')) return;
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
    handleColumnHeaderMouseUp(e) {
        if (this.grid.isSelectingHeader && this.grid.selectionHeaderType === "column") {
            this.grid.isSelectingHeader = false;
            this.grid.selectionHeaderType = null;
            this.grid.selectionHeaderStart = null;
        }
    }
} 