import { ColumnSelectionHandler } from "./ColumnSelectionHandler.js";
import { RowSelectionHandler } from "./RowSelectionHandler.js";
export class EventManager {
    /**
     * Constructs an EventManager to handle all grid-related events.
     * @param {Object} grid - The grid instance this manager operates on.
     */
    constructor(grid) {
        /**
         * Reference to the grid instance.
         * @type {Object}
         */
        this.grid = grid;
        /**
         * Handler for column selection events.
         * @type {ColumnSelectionHandler}
         */
        this.columnSelectionHandler = new ColumnSelectionHandler(grid);
        /**
         * Handler for row selection events.
         * @type {RowSelectionHandler}
         */
        this.rowSelectionHandler = new RowSelectionHandler(grid);


        this.eventHandlers = []
        this.currHandler = null;
    }
    RegisterHandler(handler) {
        this.eventHandlers.push(handler);
    }

    pointerUp(e) {
        if (this.currHandler)
            this.currHandler.pointerUp(e);
        this.currHandler = null;
    }
    pointerdown(e) {
        for (const handler of this.eventHandlers) {
            if (handler.hitTest(e)) {
                this.currHandler = handler;
                break;
            }
        }
        if (this.currHandler) {
            this.currHandler.pointerdown(e);
        }
    }
    pointerMove(e) {
        if (this.currHandler)
            this.currHandler.pointerMove(e);
        else {
            // for (handler in this.eventHandlers) {
            //     if (handler.hitTest(e))
            //         break;
            // }
        }
    }

}