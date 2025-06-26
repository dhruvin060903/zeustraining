
import {
    DEFAULT_ROW_HEIGHT,
} from './config.js';
/**
 * Represents a row in the grid
 */
export class GridRow {
    /**
     * @param {number} index - Row index
     * @param {number} - Initial height
     */
    constructor(index, height = DEFAULT_ROW_HEIGHT) {
        /** @type {number} */
        this.index = index;

        /** @type {number} */
        this.height = height;
    }

    /**
     * Set row height
     * @param {number} height
     */
    setHeight(height) {
        this.height = Math.max(0.5, height);
    }
}
