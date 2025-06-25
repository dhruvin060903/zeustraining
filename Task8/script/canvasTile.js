const TOTAL_ROWS = 100000;
const TOTAL_COLUMNS = 1000;
const VISIBLE_ROWS_PER_CANVAS_TILE = 40;
const VISIBLE_COLS_PER_CANVAS_TILE = 15;

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
        ctx.translate(0.5, 0.5); 
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.strokeStyle = '#e5e7eb';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151';

        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            ctx.beginPath();
            ctx.moveTo(0, currentY -0.5);
            ctx.lineTo(this.width, currentY -0.5);
            
            ctx.lineWidth = 1;
            ctx.stroke();
            currentY += rowHeight;
        }
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(this.width, currentY);
        ctx.lineWidth = 1;
        ctx.stroke();

        let currentX = 0;
        for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
            const colWidth = this.grid.getColumnWidth(c);
            ctx.beginPath();
            ctx.moveTo(currentX -0.5, 0);
            ctx.lineTo(currentX -0.5, this.height);
            ctx.lineWidth = 1;
            ctx.stroke();
            currentX += colWidth;
        }
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, this.height);
        ctx.lineWidth = 1;
        ctx.stroke();
        // this.drewCell(ctx);
    }
    drewCell(ctx) {
        let currentY = 0;
        for (let r = this.startGlobalRow; r < this.endGlobalRow; r++) {
            const rowHeight = this.grid.getRowHeight(r);
            let currentXForContent = 0;
            for (let c = this.startGlobalCol; c < this.endGlobalCol; c++) {
                const colWidth = this.grid.getColumnWidth(c);

                const cell = this.grid.getCell(r, c);
                if (cell) {
                    ctx.fillText(
                        cell.getContent(),
                        currentXForContent + colWidth / 2,
                        currentY + rowHeight / 2
                    );
                }
                currentXForContent += colWidth;
            }
            currentY += rowHeight;
        }
    }
}