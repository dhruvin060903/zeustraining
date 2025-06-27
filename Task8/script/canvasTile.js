
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
        this.selectionDiv = document.createElement('div');
        this.selectionDiv.className = 'canvas-selection-border';
        this.selectionDiv.style.position = 'absolute';
        this.selectionDiv.style.pointerEvents = 'none';
        this.selectionDiv.style.border = '2px solid #137E43';
        this.selectionDiv.style.boxSizing = 'border-box';
        this.selectionDiv.style.display = 'none'; // hidden by default
        this.canvasElement.parentElement.appendChild(this.selectionDiv);

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

        // this.drawCellBackgrounds(ctx);

        // ✅ Update or hide selection border div
        // this.updateSelectionDiv();

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
    }
    updateSelectionDiv() {
        const selected = this.grid.selectedCell;
        if (!selected || this.grid.isEditing) {
            this.selectionDiv.style.display = 'none';
            return;
        }

        const row = selected.row;
        const col = selected.col;

        if (
            row < this.startGlobalRow || row >= this.endGlobalRow ||
            col < this.startGlobalCol || col >= this.endGlobalCol
        ) {
            this.selectionDiv.style.display = 'none';
            return;
        }

        let top = 0;
        for (let r = this.startGlobalRow; r < row; r++) {
            top += this.grid.getRowHeight(r);
        }

        let left = 0;
        for (let c = this.startGlobalCol; c < col; c++) {
            left += this.grid.getColumnWidth(c);
        }

        const rowHeight = this.grid.getRowHeight(row);
        const colWidth = this.grid.getColumnWidth(col);

        this.selectionDiv.style.display = 'block';
        this.selectionDiv.style.left = `${left}px`;
        this.selectionDiv.style.top = `${top}px`;
        this.selectionDiv.style.width = `${colWidth}px`;
        this.selectionDiv.style.height = `${rowHeight}px`;
    }

    // Add this new method to CanvasTile class


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
                // ctx.clip();

                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                // ctx.fillStyle = '#374151';
                ctx.fillText(content, textX, textY);
                // ctx.restore();
            }
        }
    }

}