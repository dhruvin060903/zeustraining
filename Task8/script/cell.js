import { getColumnName } from "./column.js";
/**
 * Grid cell class
 */
export class Cell {
    /**
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {string} [value='']
     */
    constructor(rowIndex, colIndex, value = '') {
        /** @type {number} */
        this.rowIndex = rowIndex;

        /** @type {number} */
        this.colIndex = colIndex;

        /** @type {string} */
        this.value = value;
    }

    /** @returns {string} */
    getContent() {
        return this.value || `${getColumnName(this.colIndex)}${this.rowIndex + 1}`;
    }

    /**
     * @param {string} value
     */
    setValue(value) {
        this.value = value;
    }
}
