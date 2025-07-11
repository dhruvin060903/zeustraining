
export class EventManager {
    /**
     * Constructs an EventManager to handle all grid-related events.
    
     */
    constructor() {
      

        /**         * List of event handlers registered with this manager.
         * @type {Array}
         */
        this.eventHandlers = []
        //         * Current handler that is processing events.
        /**
         * @type {Object|null}
         */
        this.currHandler = null;
    }

    /**
     * Registers a new event handler with this manager.
     * @param {Object} handler - The event handler to register.
     */
    RegisterHandler(handler) {
        this.eventHandlers.push(handler);
    }
    /**
     * Unregisters an event handler from this manager.
     * @param {Object} handler - The event handler to unregister.
     */
    pointerUp(e) {
        if (this.currHandler)
            this.currHandler.pointerUp(e);
        this.currHandler = null;
    }
    /**
     * Handles pointer down events and determines which handler should process it.
     * @param {MouseEvent} e - The mouse event to handle.
     */
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
    /**
     * Handles pointer move events and delegates to the current handler.
     * @param {MouseEvent} e - The mouse event to handle.
     */
    pointerMove(e) {
        if (this.currHandler)
            this.currHandler.pointerMove(e);
    }

}