import { TOTAL_ROWS } from "./config.js";
import { ResizeRowCommand } from "./CommandManager.js";

/**
 * Handles row resizing logic for the grid.
 */
export class RowResizeHandler {
    /**
     * @param {Object} grid - The grid instance this handler operates on.
     */
    constructor(grid) {
        /**
         * Reference to the grid instance.
         * @type {Object}
         */
        this.grid = grid;
        this.isResizing = false;
        this.resizeIndex = -1;
        this.resizeStartPos = 0;
        this.resizeStartSize = 0;
        this._resizeOldSize = null;
    }
    /**
     * Checks if the event is on a row resize handle.
     * @param {MouseEvent} e
     * @returns {boolean}
     */
    hitTest(e) {
        // console.log(e.target.classList && e.target.classList.contains('row-resize-handle'));
        return e.target.classList && e.target.classList.contains('row-resize-handle');
    }
    /**
     * Handles mousedown on a row resize handle to start resizing.
     * @param {MouseEvent} e
     */
    pointerdown(e) {
        e.preventDefault();
        this.isResizing = true;
        this.resizeIndex = parseInt(e.target.dataset.index);
        this.resizeStartPos = e.clientY;
        this.resizeStartSize = this.grid.getRowHeight(this.resizeIndex);
        this._resizeOldSize = this.resizeStartSize;
        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.display = 'block';
        resizerLine.className = 'horizontal-line';
        resizerLine.style.width = '100%';
        resizerLine.style.height = '2px';
        resizerLine.style.left = '0px';
        resizerLine.style.top = `${e.clientY}px`;
        document.body.style.cursor = 'row-resize';
        this.highlightResizeLine();
        // document.addEventListener('mousemove', this.pointerMoveBind = this.pointerMove.bind(this));
        // document.addEventListener('mouseup', this.pointerUpBind = this.pointerUp.bind(this));
    }
    /**
     * Handles mousemove during row resizing.
     * @param {MouseEvent} e
     */
    pointerMove(e) {
        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.top = `${e.clientY}px`;
        this.highlightResizeLine();
    }
    /**
     * Handles mouseup to finish row resizing and apply the new size.
     * @param {MouseEvent} e
     */
    pointerUp(e) {
        const delta = e.clientY - this.resizeStartPos;
        const newSize = this.resizeStartSize + delta;
        let oldSize = this._resizeOldSize;
        if (newSize !== oldSize) {
            this.grid.commandManager.execute(
                new ResizeRowCommand(this.grid, this.resizeIndex, oldSize, newSize)
            );
        }
        document.getElementById('resizer-line').style.display = 'none';
        document.body.style.cursor = 'default';
        this.isResizing = false;
        this.resizeIndex = -1;
        this._resizeOldSize = null;
        // this.highlightResizeLine(true);
        // document.removeEventListener('mousemove', this.pointerMoveBind);
        // document.removeEventListener('mouseup', this.pointerUpBind);
    }
    /**
     * Highlights the border of the resizing row, or clears highlight if done.
     * @param {boolean} [clear=false]
     */
    highlightResizeLine(clear = false) {
        if (!this.isResizing || clear) {
            for (const tile of this.grid.canvasTiles.values()) {
                tile.clearResizeHighlight && tile.clearResizeHighlight();
            }
            return;
        }
        for (const tile of this.grid.canvasTiles.values()) {
            tile.drawRowBorder && tile.drawRowBorder(this.resizeIndex, '#107C41');
        }
    }
}
