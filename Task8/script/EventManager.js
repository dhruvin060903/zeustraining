import { ColumnResizeHandler } from "./ColumnResizeHandler.js";
import { RowResizeHandler } from "./RowResizeHandler.js";
export class EventManager {
    hitTest(e, type) {
        // Centralized hit test for all grid event types
        if (!e || !e.target) return false;
        switch (type) {
            case 'colHeader':
                return e.target === this.grid.colHeaderCanvas;
            case 'rowHeader':
                return e.target === this.grid.rowHeaderCanvas;
            case 'grid':
                return (e.target.classList && e.target.classList.contains('grid-canvas-tile')) || e.target === this.grid.container;
            default:
                return false;
        }
    }
    constructor(grid) {
        this.grid = grid;
        this.columnResizeHandler = new ColumnResizeHandler(grid);
        this.rowResizeHandler = new RowResizeHandler(grid);
        this.intializeEvents();
    }
    intializeEvents() {
        this.grid.colHeaderCanvas.addEventListener('mousedown', this.columnResizeHandler.handleColumnHeaderMouseDown.bind(this.columnResizeHandler));
        this.grid.colHeaderCanvas.addEventListener('mousemove', this.columnResizeHandler.handleColumnHeaderMouseMove.bind(this.columnResizeHandler));
        window.addEventListener('mouseup', this.columnResizeHandler.handleColumnHeaderMouseUp.bind(this.columnResizeHandler));
        this.grid.rowHeaderCanvas.addEventListener('mousedown', this.rowResizeHandler.handleRowHeaderMouseDown.bind(this.rowResizeHandler));
        this.grid.rowHeaderCanvas.addEventListener('mousemove', this.rowResizeHandler.handleRowHeaderMouseMove.bind(this.rowResizeHandler));
        window.addEventListener('mouseup', this.rowResizeHandler.handleRowHeaderMouseUp.bind(this.rowResizeHandler));
        window.addEventListener('mousedown', this.grid.selectionManager.handleMouseDown.bind(this.grid.selectionManager));
        window.addEventListener('mousemove', this.grid.selectionManager.handleMouseMoveForSelection.bind(this.grid.selectionManager));
        window.addEventListener('mouseup', this.grid.selectionManager.handleMouseUpForSelection.bind(this.grid.selectionManager));
    }


}