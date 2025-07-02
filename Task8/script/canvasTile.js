import {
    TOTAL_ROWS,
    TOTAL_COLUMNS,
    VISIBLE_ROWS_PER_CANVAS_TILE,
    VISIBLE_COLS_PER_CANVAS_TILE,
} from './config.js';

export class CanvasTile {
    constructor(canvasElement, grid, tileRowIndex, tileColIndex) {
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.grid = grid;
        this.tileRowIndex = tileRowIndex;
        this.tileColIndex = tileColIndex;

        this.startGlobalRow = tileRowIndex * VISIBLE_ROWS_PER_CANVAS_TILE;
        this.endGlobalRow = Math.min(this.startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS);
        this.startGlobalCol = tileColIndex * VISIBLE_COLS_PER_CANVAS_TILE;
        this.endGlobalCol = Math.min(this.startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS);

        this.updateDimensions();
    }

    updateDimensions() {
        let tileWidth = 0;
        let tileHeight = 0;

        // Calculate tile width based on column widths
        for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
            tileWidth += this.grid.getColumnWidth(c);
        }

        // Calculate tile height based on row heights
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            tileHeight += this.grid.getRowHeight(r);
        }

        this.width = tileWidth;
        this.height = tileHeight;

        const dpr = window.devicePixelRatio;
        this.canvasElement.width = this.width * dpr;
        this.canvasElement.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvasElement.style.width = `${this.width}px`;
        this.canvasElement.style.height = `${this.height}px`;

        // Calculate position based on cumulative column and row sizes
        let left = 0;
        for (let c = 0; c < this.startGlobalCol; c++) {
            left += this.grid.getColumnWidth(c);
        }

        let top = 0;
        for (let r = 0; r < this.startGlobalRow; r++) {
            top += this.grid.getRowHeight(r);
        }

        this.canvasElement.style.left = `${left}px`;
        this.canvasElement.style.top = `${top}px`;
        this.canvasElement.dataset.tileRow = this.tileRowIndex;
        this.canvasElement.dataset.tileCol = this.tileColIndex;
    }
    draw() {
        this.updateDimensions();
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transforms before re-scaling
        const dpr = window.devicePixelRatio;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw cell selection backgrounds first

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            ctx.beginPath();
            ctx.moveTo(0, currentY - 0.5);
            ctx.lineTo(this.width, currentY - 0.5);
            ctx.stroke();
            currentY += rowHeight;
        }
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(this.width, currentY);
        ctx.stroke();
        let currentX = 0;
        for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
            const colWidth = this.grid.getColumnWidth(c);
            ctx.beginPath();
            ctx.moveTo(currentX - 0.5, 0);
            ctx.lineTo(currentX - 0.5, this.height);
            ctx.stroke();
            currentX += colWidth;
        }
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, this.height);
        ctx.stroke();
        this.drawCellContent(ctx);
        this.drawSelectionBackgrounds(ctx);

        // Draw selection borders on top
        this.drawSelectionBorders(ctx);
    }

    /**
     * Draws selection backgrounds for selected cells in this tile
     */
    drawSelectionBackgrounds(ctx) {
        const selection = this.grid.selectionManager.activeSelection;
        if (!selection) return;
        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            let currentX = 0;
            for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
                const colWidth = this.grid.getColumnWidth(c);
                if (selection.contains(r, c)) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(currentX, currentY, colWidth, rowHeight);
                    // Only make the true top-left cell transparent
                    let isTopLeft = false;
                    if (selection.type === 'cell') {
                        isTopLeft = true;
                    } else if (selection.type === 'range') {
                        isTopLeft = (r === selection.startRow && c === selection.startCol);
                    } else if (selection.type === 'row') {
                        isTopLeft = (r === selection.row && c === 0);
                    } else if (selection.type === 'column') {
                        isTopLeft = (r === 0 && c === selection.col);
                    }
                    if (isTopLeft) {
                        ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent for true top-left cell only
                    } else {
                        ctx.fillStyle = 'rgba(19,126,67,0.10)';
                    }
                    ctx.fill();
                    ctx.restore();
                }
                currentX += colWidth;
            }
            currentY += rowHeight;
        }
    }

    /**
     * Draws selection borders for selected cells in this tile
     */
    drawSelectionBorders(ctx) {
        const selection = this.grid.selectionManager.activeSelection;
        if (!selection) return;
        // Only draw border for the outer edge of the selection
        if (selection.type === 'cell') {
            this.drawCellBorder(ctx, selection.row, selection.col, '#137E43', 2);
        } else if (selection.type === 'range') {
            // Draw border around the range
            this.drawRangeBorder(ctx, selection.startRow, selection.startCol, selection.endRow, selection.endCol, '#137E43', 2);
        } else if (selection.type === 'row') {
            // Draw border around the row
            this.drawRowBorder(selection.row, '#137E43', 2);
        } else if (selection.type === 'column') {
            // Draw border around the column
            this.drawColumnBorder(selection.col, '#137E43', 2);
        }
    }

    drawCellBorder(ctx, row, col, color = '#137E43', width = 2) {
        if (
            row < this.startGlobalRow || row >= this.endGlobalRow ||
            col < this.startGlobalCol || col >= this.endGlobalCol
        ) return;
        let y = 0;
        for (let r = this.startGlobalRow; r < row; r++) y += this.grid.getRowHeight(r);
        let x = 0;
        for (let c = this.startGlobalCol; c < col; c++) x += this.grid.getColumnWidth(c);
        const rowHeight = this.grid.getRowHeight(row);
        const colWidth = this.grid.getColumnWidth(col);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.strokeRect(x-1, y-1, colWidth , rowHeight);
        ctx.restore();
    }

    drawRangeBorder(ctx, startRow, startCol, endRow, endCol, color = '#137E43', width = 2) {
        // Only draw if any part of the range is in this tile
        const minRow = Math.max(this.startGlobalRow, startRow);
        const maxRow = Math.min(this.endGlobalRow - 1, endRow);
        const minCol = Math.max(this.startGlobalCol, startCol);
        const maxCol = Math.min(this.endGlobalCol - 1, endCol);
        if (minRow > maxRow || minCol > maxCol) return;

        // Calculate pixel positions for each edge
        let yTop = 0;
        for (let r = this.startGlobalRow; r < minRow; r++) yTop += this.grid.getRowHeight(r);
        let xLeft = 0;
        for (let c = this.startGlobalCol; c < minCol; c++) xLeft += this.grid.getColumnWidth(c);
        let height = 0;
        for (let r = minRow; r <= maxRow; r++) height += this.grid.getRowHeight(r);
        let widthPx = 0;
        for (let c = minCol; c <= maxCol; c++) widthPx += this.grid.getColumnWidth(c);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        // Top border: only if this tile contains the top edge
        if (this.startGlobalRow <= startRow && startRow < this.endGlobalRow) {
            ctx.beginPath();
            ctx.moveTo(xLeft-1, yTop - 1);
            ctx.lineTo(xLeft + widthPx + 1, yTop - 1);
            ctx.stroke();
        }
        // Bottom border: only if this tile contains the bottom edge
        if (this.startGlobalRow <= endRow && endRow < this.endGlobalRow) {
            let yBottom = yTop;
            for (let r = minRow; r < endRow; r++) yBottom += this.grid.getRowHeight(r);
            yBottom += this.grid.getRowHeight(endRow);
            ctx.beginPath();
            ctx.moveTo(xLeft - 1, yBottom);
            ctx.lineTo(xLeft + widthPx + 1, yBottom );
            ctx.stroke();
        }
        // Left border: only if this tile contains the left edge
        if (this.startGlobalCol <= startCol && startCol < this.endGlobalCol) {
            ctx.beginPath();
            ctx.moveTo(xLeft - 1, yTop - 2);
            ctx.lineTo(xLeft - 1, yTop + height+1);
            ctx.stroke();
        }
        // Right border: only if this tile contains the right edge
        if (this.startGlobalCol <= endCol && endCol < this.endGlobalCol) {
            let xRight = xLeft;
            for (let c = minCol; c < endCol; c++) xRight += this.grid.getColumnWidth(c);
            xRight += this.grid.getColumnWidth(endCol);
            ctx.beginPath();
            ctx.moveTo(xRight , yTop -2);
            ctx.lineTo(xRight , yTop + height + 1);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawColumnBorder(colIndex, color = '#137E43', width = 2) {
        if (colIndex < this.startGlobalCol || colIndex >= this.endGlobalCol) return;
        const ctx = this.ctx;
        let currentX = 0;
        for (let c = this.startGlobalCol; c < colIndex; c++) {
            currentX += this.grid.getColumnWidth(c);
        }
        const colWidth = this.grid.getColumnWidth(colIndex);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        // Always draw left and right borders
        ctx.beginPath();
        ctx.moveTo(currentX + 1, 1);
        ctx.lineTo(currentX + 1, this.height - 1);
        ctx.moveTo(currentX + colWidth - 1, 1);
        ctx.lineTo(currentX + colWidth - 1, this.height - 1);
        // Draw top border if this is the first tile row
        if (this.startGlobalRow === 0) {
            ctx.moveTo(currentX + 1, 1);
            ctx.lineTo(currentX + colWidth - 1, 1);
        }
        // Draw bottom border if this is the last tile row
        if (this.endGlobalRow === TOTAL_ROWS) {
            ctx.moveTo(currentX + 1, this.height - 1);
            ctx.lineTo(currentX + colWidth - 1, this.height - 1);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawRowBorder(rowIndex, color = '#137E43', width = 2) {
        if (rowIndex < this.startGlobalRow || rowIndex >= this.endGlobalRow) return;
        const ctx = this.ctx;
        let currentY = 0;
        for (let r = this.startGlobalRow; r < rowIndex; r++) {
            currentY += this.grid.getRowHeight(r);
        }
        const rowHeight = this.grid.getRowHeight(rowIndex);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        // Always draw top and bottom borders
        ctx.beginPath();
        ctx.moveTo(1, currentY + 1);
        ctx.lineTo(this.width - 1, currentY + 1);
        ctx.moveTo(1, currentY + rowHeight - 1);
        ctx.lineTo(this.width - 1, currentY + rowHeight - 1);
        // Draw left border if this is the first tile column
        if (this.startGlobalCol === 0) {
            ctx.moveTo(1, currentY + 1);
            ctx.lineTo(1, currentY + rowHeight - 1);
        }
        // Draw right border if this is the last tile column
        if (this.endGlobalCol === TOTAL_COLUMNS) {
            ctx.moveTo(this.width - 1, currentY + 1);
            ctx.lineTo(this.width - 1, currentY + rowHeight - 1);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Add this new method to CanvasTile class
    drawCellContent(ctx) {
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151';

        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            let currentX = 0;

            for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
                const colWidth = this.grid.getColumnWidth(c);

                // Skip drawing content if this cell is being edited
                if (this.grid.isEditing &&
                    this.grid.selectedCell &&
                    this.grid.selectedCell.row === r &&
                    this.grid.selectedCell.col === c) {
                    currentX += colWidth;
                    continue;
                }

                // Only draw content if cell has actual content
                if (this.grid.cellHasContent(r, c) && colWidth > 10) {
                    const cell = this.grid.getCell(r, c);
                    const content = cell.value; // Use actual value, not getContent()

                    if (content && content.trim() !== '') {
                        // Add some padding from the left edge
                        const textX = currentX + 4;
                        const textY = currentY + rowHeight / 2;

                        // Clip text to fit within cell
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(currentX, currentY, colWidth - 1, rowHeight - 1);
                        ctx.clip();

                        ctx.fillText(content, textX, textY);
                        ctx.restore();
                    }
                }

                currentX += colWidth;
            }
            currentY += rowHeight;
        }
    }
    drawSingleCell(row, col) {
        // Ensure the cell is within this tile's range
        console.log(row, col)
        if (
            row < this.startGlobalRow || row >= this.endGlobalRow ||
            col < this.startGlobalCol || col >= this.endGlobalCol
        ) return;

        const ctx = this.ctx;

        // Compute position of the cell in canvas
        let currentY = 0;
        for (let r = this.startGlobalRow; r < row; r++) {
            currentY += this.grid.getRowHeight(r);
        }

        let currentX = 0;
        for (let c = this.startGlobalCol; c < col; c++) {
            currentX += this.grid.getColumnWidth(c);
        }

        const rowHeight = this.grid.getRowHeight(row);
        const colWidth = this.grid.getColumnWidth(col);

        // Clear the specific cell area
        ctx.clearRect(currentX, currentY, colWidth, rowHeight);
        ctx.strokeStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.moveTo(currentX - 0.5, currentY);
        ctx.lineTo(currentX - 0.5, currentY + rowHeight);
        ctx.moveTo(currentX + colWidth - 0.5, currentY);
        ctx.lineTo(currentX + colWidth - 0.5, currentY + rowHeight);
        ctx.moveTo(currentX, currentY - 0.5);
        ctx.lineTo(currentX + colWidth, currentY - 0.5);
        ctx.moveTo(currentX, currentY + rowHeight - 0.5);
        ctx.lineTo(currentX + colWidth, currentY + rowHeight - 0.5);
        ctx.stroke();
        // Redraw background
        // const isSelected = this.grid.selectedCell?.row === row && this.grid.selectedCell?.col === col;
        // // console.log(isSelected)
        // if (isSelected && this.grid.selectionManager.activeSelection?.type === 'range') {
        //     this.selectionDiv.style.display = 'block';
        //     this.selectionDiv.style.left = `${currentX}px`;
        //     this.selectionDiv.style.top = `${currentY}px`;
        //     this.selectionDiv.style.width = `${colWidth}px`;
        //     this.selectionDiv.style.height = `${rowHeight}px`;
        // } else {
        //     this.selectionDiv.style.display = 'none';
        // }

        // Redraw grid lines
        console.log(this.grid.cellHasContent(row, col), !this.grid.isEditing);

        // Redraw content
        if (
            this.grid.cellHasContent(row, col) &&
            this.grid.getColumnWidth(col) > 10
        ) {
            const cell = this.grid.getCell(row, col);
            const content = cell.value;

            if (content && content.trim() !== '') {
                const textX = currentX + 4;
                const textY = currentY + rowHeight / 2;

                ctx.save();
                ctx.beginPath();
                ctx.rect(currentX, currentY, colWidth - 0.5, rowHeight - 0.5);

                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                // ctx.fillStyle = '#374151';
                ctx.fillText(content, textX, textY);
                // ctx.restore();
            }
        }
    }

    // Clear the highlight by redrawing the tile
    clearResizeHighlight() {
        this.draw();
    }

}