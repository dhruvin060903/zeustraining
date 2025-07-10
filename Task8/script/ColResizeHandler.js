import { TOTAL_COLUMNS } from "./config.js";
import { ResizeColumnCommand } from "./CommandManager.js";

/**
 * Handles column resizing logic for the grid.
 */
export class ColResizeHandler {
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
     * Checks if the event is on a column resize handle.
     * @param {MouseEvent} e
     * @returns {boolean}
     */
    hitTest(e) {

        return e.target.classList && e.target.classList.contains('col-resize-handle');
    }
    /**
     * Handles mousedown on a column resize handle to start resizing.
     * @param {MouseEvent} e
     */
    pointerdown(e) {
        e.preventDefault();
        this.isResizing = true;
        this.resizeIndex = parseInt(e.target.dataset.index);
        this.resizeStartPos = e.clientX;
        this.resizeStartSize = this.grid.getColumnWidth(this.resizeIndex);
        this._resizeOldSize = this.resizeStartSize;
        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.display = 'block';
        resizerLine.className = 'vertical-line';
        resizerLine.style.width = '2px';
        resizerLine.style.height = `${window.innerHeight}px`;
        resizerLine.style.left = `${e.clientX}px`;
        resizerLine.style.top = '0px';
        document.body.style.cursor = 'col-resize';
        this.highlightResizeLine();
        document.addEventListener('mousemove', this.pointerMoveBind = this.pointerMove.bind(this));
        document.addEventListener('mouseup', this.pointerUpBind = this.pointerUp.bind(this));
    }
    /**
     * Handles mousemove during column resizing.
     * @param {MouseEvent} e
     */
    pointerMove(e) {
        if (!this.isResizing) return;
        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.left = `${e.clientX}px`;
        this.highlightResizeLine();
    }
    /**
     * Handles mouseup to finish column resizing and apply the new size.
     * @param {MouseEvent} e
     */
    pointerUp(e) {
        if (!this.isResizing) return;
        const delta = e.clientX - this.resizeStartPos;
        const newSize = this.resizeStartSize + delta;
        let oldSize = this._resizeOldSize;
        if (newSize !== oldSize) {
            this.grid.commandManager.execute(
                new ResizeColumnCommand(this.grid, this.resizeIndex, oldSize, newSize)
            );
        }
        document.getElementById('resizer-line').style.display = 'none';
        document.body.style.cursor = 'default';
        this.isResizing = false;
        this.resizeIndex = -1;
        this._resizeOldSize = null;
        this.highlightResizeLine(true);
        document.removeEventListener('mousemove', this.pointerMoveBind);
        document.removeEventListener('mouseup', this.pointerUpBind);
    }
    /**
     * Highlights the border of the resizing column, or clears highlight if done.
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
            tile.drawColumnBorder && tile.drawColumnBorder(this.resizeIndex, '#107C41');
        }
    }
}
