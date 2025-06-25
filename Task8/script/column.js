/**
 * Converts column index (0-based) to spreadsheet-style name (e.g., 0 → A, 26 → AA).
 * @param {number} colIndex
 * @returns {string}
 */
export function getColumnName(colIndex) {
    let dividend = colIndex + 1;
    let columnName = '';
    let modulo;

    while (dividend > 0) {
        modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
    }

    return columnName;
}

/**
 * Represents a column in the grid
 */
export class GridColumn {
    /**
     * @param {number} index - Column index
     * @param {number} [width=100] - Initial width
     */
    constructor(index, width = 100) {
        /** @type {number} */
        this.index = index;

        /** @type {number} */
        this.width = width;

        /** @type {string} */
        this.name = getColumnName(index);
    }

    /**
     * Set column width (min 20px)
     * @param {number} width
     */
    setWidth(width) {
        this.width = Math.max(20, width);
    }
}
