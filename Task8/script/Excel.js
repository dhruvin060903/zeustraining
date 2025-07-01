import { GridRow } from "./row.js";
import { GridColumn } from "./column.js";
import { Cell } from "./cell.js";
import { CanvasTile } from "./canvasTile.js";
import { getColumnName } from "./column.js";
import { SelectionManager, CellSelection, ColumnSelection, RowSelection, RangeSelection } from "./Selection.js";

import {
    TOTAL_ROWS,
    TOTAL_COLUMNS,
    DEFAULT_ROW_HEIGHT,
    DEFAULT_COLUMN_WIDTH,
    HEADER_HEIGHT,
    HEADER_WIDTH,
    VISIBLE_ROWS_PER_CANVAS_TILE,
    VISIBLE_COLS_PER_CANVAS_TILE,
    TILE_BUFFER_ROWS,
    TILE_BUFFER_COLS
} from './config.js';


// for reduce multiple calling
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}


class Grid {
    constructor(containerId) {
        this.gridWrapper = document.getElementById('grid-wrapper');
        this.container = document.getElementById(containerId);
        if (!this.container || !this.gridWrapper) {
            console.error('Required grid elements not found.');
            return;
        }

        this.columns = [];
        this.rows = [];
        this.cells = new Map();

        for (let i = 0; i < TOTAL_COLUMNS; i++) {
            this.columns.push(new GridColumn(i));
        }

        for (let i = 0; i < TOTAL_ROWS; i++) {
            this.rows.push(new GridRow(i));
        }

        this.canvasTiles = new Map();
        this.contentSizer = document.getElementById('grid-content-sizer');
        this.colHeaderCanvas = document.getElementById('column-header-canvas');
        this.colHeaderCtx = this.colHeaderCanvas.getContext('2d');
        this.rowHeaderCanvas = document.getElementById('row-header-canvas');
        this.rowHeaderCtx = this.rowHeaderCanvas.getContext('2d');
        this.selectionManager = new SelectionManager(this);
        this.selectionManager.grid = this;
        window.grid = this;

        this.isSelecting = false;
        this.selectionStart = null;
        this.resizeHandles = [];
        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.resizeStartPos = 0;
        this.resizeStartSize = 0;
        this.selectedCell = null;
        this.isEditing = false;
        this.cellInput = null;
        this.initializeResizeHandling();
        this.updateHeaderCanvasSizes();
        this.drawHeaders();
        this.renderVisibleTiles();

        this.handleScroll = debounce(this.HandleScroll.bind(this), 10);
        this.container.addEventListener('scroll', this.handleScroll);

        this.handleResize = debounce(this.HandleResize.bind(this), 100);
        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));
        this.container.addEventListener('click', this.handleClick.bind(this));
        // this.container.addEventListener('dblclick', this.handleCellDoubleClick.bind(this));
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMoveForSelection.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUpForSelection.bind(this));

        // Add header click listeners
        this.colHeaderCanvas.addEventListener('click', this.handleColumnHeaderClick.bind(this));
        this.rowHeaderCanvas.addEventListener('click', this.handleRowHeaderClick.bind(this));
    }
    handleClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                // Check if there's an active RangeSelection and if the click is within it
                if (this.selectionManager.activeSelection?.type === 'range' &&
                    this.selectionManager.activeSelection.contains(cellCoords.row, cellCoords.col)) {
                    // Clicked within the existing range selection, do nothing to preserve it
                    // console.log("erer")
                    console.log("single click")
                    return;
                }

                // Clicked outside the range or no range selection, select the single cell
                this.selectCell(cellCoords.row, cellCoords.col);

            } else {
                // Clicked outside any valid cell, clear selection
                this.selectionManager.clearSelection();
            }
        }
        this.drawHeaders();

    }
    handleMouseMoveForSelection(e) {
        if (this.isSelecting && this.selectionStart && e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                // Create range selection
                const rangeSelection = new RangeSelection(
                    this.selectionStart.row,
                    this.selectionStart.col,
                    cellCoords.row,
                    cellCoords.col
                );
                this.selectionManager.setSelection(rangeSelection);
            }
            this.drawHeaders();
        }
        // console.log("handleMouseMoveForSelection")
    }

    handleMouseUpForSelection(e) {
        this.isSelecting = false;
        // this.selectionStart = null;
        this.selectionManager.renderSelection();
        this.finishCellEdit();
        this.updateStatusBar();

    }

    handleMouseDown(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.isSelecting = true;
                this.selectionStart = cellCoords;
                e.preventDefault();
            }
        }
    }

    handleColumnHeaderClick(e) {
        const rect = this.colHeaderCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.container.scrollLeft;

        let currentX = 0;
        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            const colWidth = this.getColumnWidth(c);
            if (x >= currentX && x < currentX + colWidth) {
                this.selectColumn(c);
                break;
            }
            currentX += colWidth;
        }
    }

    handleRowHeaderClick(e) {
        const rect = this.rowHeaderCanvas.getBoundingClientRect();
        const y = e.clientY - rect.top + this.container.scrollTop;

        let currentY = 0;
        for (let r = 0; r < TOTAL_ROWS; r++) {
            const rowHeight = this.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                this.selectRow(r);
                break;
            }
            currentY += rowHeight;
        }
    }

    handleCellDoubleClick(e) {
        if (e.target.classList.contains('grid-canvas-tile')) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log(e.clientX, e.clientY, rect.left, rect.top, x, y);
            const tileRow = parseInt(e.target.dataset.tileRow);
            const tileCol = parseInt(e.target.dataset.tileCol);

            const cellCoords = this.getCellFromPosition(x, y, tileRow, tileCol);
            if (cellCoords) {
                this.startCellEdit(cellCoords.row, cellCoords.col);
            }
        }
    }

    getCellFromPosition(x, y, tileRow, tileCol) {
        const startGlobalRow = tileRow * VISIBLE_ROWS_PER_CANVAS_TILE;
        const startGlobalCol = tileCol * VISIBLE_COLS_PER_CANVAS_TILE;

        let currentY = 0;
        for (let r = startGlobalRow; r < Math.min(startGlobalRow + VISIBLE_ROWS_PER_CANVAS_TILE, TOTAL_ROWS); r++) {
            const rowHeight = this.getRowHeight(r);
            if (y >= currentY && y < currentY + rowHeight) {
                let currentX = 0;
                for (let c = startGlobalCol; c < Math.min(startGlobalCol + VISIBLE_COLS_PER_CANVAS_TILE, TOTAL_COLUMNS); c++) {
                    const colWidth = this.getColumnWidth(c);
                    if (x >= currentX && x < currentX + colWidth) {
                        return { row: r, col: c };
                    }
                    currentX += colWidth;
                }
            }
            currentY += rowHeight;
        }
        return null;
    }

    selectCell(row, col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }
        const previousSelection = this.selectedCell;
        this.selectedCell = { row, col };
        const cellSelection = new CellSelection(row, col);
        this.selectionManager.setSelection(cellSelection);
        this.updateStatusBar();
    }
    // selectCell(row, col) {
    //     if (this.isEditing) {
    //         this.finishCellEdit();
    //     }

    //     const previousSelection = this.selectedCell;
    //     this.selectedCell = { row, col };

    //     // Redraw affected tiles
    //     if (previousSelection) {
    //         this.redrawCellInTiles(previousSelection.row, previousSelection.col);
    //     }
    //     this.redrawCellInTiles(row, col);
    // }
    selectColumn(col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        const columnSelection = new ColumnSelection(col);
        this.selectionManager.setSelection(columnSelection);
        this.selectedCell = null;
        this.drawHeaders();
        this.updateStatusBar();
    }

    selectRow(row) {
        if (this.isEditing) {
            this.finishCellEdit();
        }

        const rowSelection = new RowSelection(row);
        this.selectionManager.setSelection(rowSelection);
        this.selectedCell = null;
        this.drawHeaders();
        this.updateStatusBar();
    }

    startCellEdit(row, col) {
        if (this.isEditing) {
            this.finishCellEdit();
        }
        if (this.selectionManager.activeSelection &&
            this.selectionManager.activeSelection.type !== 'cell') {
            return;
        }
        // this.selectCell(row, col);
        this.isEditing = true;

        // Create input element
        this.cellInput = document.createElement('input');
        this.cellInput.type = 'text';
        this.cellInput.className = 'cell-input';

        const cell = this.getCell(row, col);
        this.cellInput.value = cell.value || '';

        // Position the input
        this.positionCellInput(row, col);

        // Add event listeners
        // this.cellInput.addEventListener('blur', this.finishCellEdit.bind(this));
        this.cellInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishCellEdit();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.cancelCellEdit();
                e.preventDefault();
            }
        });
        this.container.appendChild(this.cellInput);
        this.cellInput.focus();
        this.cellInput.select();

        // Redraw selection to hide highlight while editing
        this.redrawSelection();
    }

    positionCellInput(row, col) {
        let left = 0;
        for (let c = 0; c < col; c++) {
            left += this.getColumnWidth(c);
        }

        let top = 0;
        for (let r = 0; r < row; r++) {
            top += this.getRowHeight(r);
        }

        const colWidth = this.getColumnWidth(col);
        const rowHeight = this.getRowHeight(row);

        this.cellInput.style.position = 'absolute';
        this.cellInput.style.left = `${left}px`;
        this.cellInput.style.top = `${top}px`;
        this.cellInput.style.width = `${colWidth - 1}px`;
        this.cellInput.style.height = `${rowHeight - 1}px`;
        this.cellInput.style.border = '2px solid #137E43';
        this.cellInput.style.outline = 'none';
        this.cellInput.style.fontSize = '12px';
        this.cellInput.style.padding = '2px';
        this.cellInput.style.zIndex = '1000';
    }

    finishCellEdit() {
        // console.log("finsihcell")
        if (!this.isEditing || !this.cellInput) return;
        const newValue = this.cellInput.value;
        const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        const oldValue = cell.value || '';

        // Only update and redraw if value actually changed
        if (newValue !== oldValue) {
            cell.setValue(newValue);
            console.log(newValue)
            // Redraw only the edited cell
            this.redrawCellInTiles(this.selectedCell.row, this.selectedCell.col);
        }

        this.container.removeChild(this.cellInput);
        this.cellInput = null;
        this.isEditing = false;
        this.selectionManager.renderSelection();
    }

    cancelCellEdit() {
        if (!this.isEditing || !this.cellInput) return;

        this.container.removeChild(this.cellInput);
        this.cellInput = null;
        this.isEditing = false;
        this.selectionManager.renderSelection();
    }

    redrawCellInTiles(row, col) {
        const tileRow = Math.floor(row / VISIBLE_ROWS_PER_CANVAS_TILE);
        const tileCol = Math.floor(col / VISIBLE_COLS_PER_CANVAS_TILE);
        const tileKey = `${tileRow}_${tileCol}`;

        const tile = this.canvasTiles.get(tileKey);
        if (tile) {
            tile.drawSingleCell(row, col); // Use optimized method
        }
    }

    redrawSelection() {
        // Redraw all visible tiles to update selection visuals
        for (const tile of this.canvasTiles.values()) {
            tile.draw();
        }
    }

    getColumnWidth(index) {
        return this.columns[index]?.width || DEFAULT_COLUMN_WIDTH;
    }

    getRowHeight(index) {
        return this.rows[index]?.height || DEFAULT_ROW_HEIGHT;
    }

    setColumnWidth(index, width) {
        if (this.columns[index]) {
            this.columns[index].setWidth(width);
            this.redrawGrid();
        }
    }

    setRowHeight(index, height) {
        if (this.rows[index]) {
            this.rows[index].setHeight(height);
            this.redrawGrid();
        }
    }

    getCell(rowIndex, colIndex) {
        const key = `${rowIndex}_${colIndex}`;
        if (!this.cells.has(key)) {
            this.cells.set(key, new Cell(rowIndex, colIndex));
        }
        return this.cells.get(key);
    }
    cellHasContent(row, col) {
        const cell = this.getCell(row, col);
        return cell.hasContent();
    }

    initializeResizeHandling() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    createResizeHandles() {
        // console.log("createResizeHandles")
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = [];

        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;

        const colHeaderContainer = document.getElementById('column-header-container');

        let currentX = 0;
        let startCol = 0;

        while (currentX < scrollLeft && startCol < TOTAL_COLUMNS) {
            currentX += this.getColumnWidth(startCol);
            startCol++;
        }
        if (startCol > 0) {
            startCol--;
            currentX -= this.getColumnWidth(startCol);
        }


        const visibleCols = Math.ceil(colHeaderContainer.clientWidth / DEFAULT_COLUMN_WIDTH) + 3;
        for (let i = 0; i < visibleCols && (startCol + i) < TOTAL_COLUMNS; i++) {
            const c = startCol + i;
            const colWidth = this.getColumnWidth(c);
            currentX += colWidth;

            const handleX = currentX - scrollLeft - 2;

            if (handleX >= -5 && handleX <= colHeaderContainer.clientWidth + 5) {
                const handle = document.createElement('div');
                handle.className = 'resize-handle col-resize-handle';
                handle.style.left = `${handleX}px`;
                handle.style.top = '0px';
                // handle.style.marginLeft = '2px';

                handle.dataset.type = 'column';
                handle.dataset.index = c;
                if (colWidth <= 0.5) {
                    handle.classList.add("collapsHandle");
                }
                else {

                    handle.classList.remove("collapsHandle");
                }


                handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
                colHeaderContainer.appendChild(handle);
                this.resizeHandles.push(handle);
            }
        }


        const rowHeaderContainer = document.getElementById('row-header-container');

        let currentY = 0;
        let startRow = 0;

        while (currentY < scrollTop && startRow < TOTAL_ROWS) {
            currentY += this.getRowHeight(startRow);
            startRow++;
        }
        if (startRow > 0) {
            startRow--;
            currentY -= this.getRowHeight(startRow);
        }

        const visibleRows = Math.ceil(rowHeaderContainer.clientHeight / DEFAULT_ROW_HEIGHT) + 3;
        for (let i = 0; i < visibleRows && (startRow + i) < TOTAL_ROWS; i++) {
            const r = startRow + i;
            const rowHeight = this.getRowHeight(r);
            currentY += rowHeight;

            const handleY = currentY - scrollTop - 2;

            if (handleY >= -5 && handleY <= rowHeaderContainer.clientHeight + 5) {
                const handle = document.createElement('div');
                handle.className = 'resize-handle row-resize-handle';
                handle.style.left = '0px';
                handle.style.top = `${handleY}px`;
                handle.dataset.type = 'row';
                handle.dataset.index = r;
                if (rowHeight <= 0.5) {
                    handle.classList.add("collapsHandleHorizontal");
                }
                else {

                    handle.classList.remove("collapsHandleHorizontal");
                }
                handle.addEventListener('mousedown', this.handleResizeStart.bind(this));
                rowHeaderContainer.appendChild(handle);
                this.resizeHandles.push(handle);
            }
        }
    }

    handleResizeStart(e) {
        e.preventDefault();
        this.isResizing = true;
        this.resizeType = e.target.dataset.type;
        this.resizeIndex = parseInt(e.target.dataset.index);

        if (this.resizeType === 'column') {
            this.resizeStartPos = e.clientX;
            this.resizeStartSize = this.getColumnWidth(this.resizeIndex);
        } else {
            this.resizeStartPos = e.clientY;
            this.resizeStartSize = this.getRowHeight(this.resizeIndex);
        }

        const resizerLine = document.getElementById('resizer-line');
        resizerLine.style.display = 'block';
        if (this.resizeType === 'column') {
            resizerLine.className = 'vertical-line';
            resizerLine.style.width = '2px';
            resizerLine.style.height = `${window.innerHeight}px`;
            resizerLine.style.left = `${e.clientX}px`;
            resizerLine.style.top = '0px';
        } else {
            resizerLine.className = 'horizontal-line';
            resizerLine.style.width = '100%';
            resizerLine.style.height = '2px';
            resizerLine.style.left = '0px';
            resizerLine.style.top = `${e.clientY}px`;
        }

        document.body.style.cursor = this.resizeType === 'column' ? 'col-resize' : 'row-resize';
        this.highlightResizeLine();
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;

        const resizerLine = document.getElementById('resizer-line');

        if (this.resizeType === 'column' && this.resizeStartPos - this.resizeStartSize <= e.clientX) {
            resizerLine.style.left = `${e.clientX}px`;
        } else if (this.resizeType === 'row' && this.resizeStartPos - this.resizeStartSize < e.clientY) {
            resizerLine.style.top = `${e.clientY}px`;
        }
        this.highlightResizeLine();
    }

    handleMouseUp(e) {
        if (!this.isResizing) return;

        const delta = this.resizeType === 'column'
            ? e.clientX - this.resizeStartPos
            : e.clientY - this.resizeStartPos;

        const newSize = this.resizeStartSize + delta;

        if (this.resizeType === 'column') {
            this.setColumnWidth(this.resizeIndex, newSize);
        } else {
            this.setRowHeight(this.resizeIndex, newSize);
        }

        // Hide resize line
        document.getElementById('resizer-line').style.display = 'none';
        document.body.style.cursor = 'default';

        this.isResizing = false;
        this.resizeType = null;
        this.resizeIndex = -1;
        this.highlightResizeLine(true); // clear highlight
    }


    // Highlight only the border of the resizing row or column
    highlightResizeLine(clear = false) {
        if (!this.isResizing || clear) {
            // Clear highlight on all tiles
            for (const tile of this.canvasTiles.values()) {
                tile.clearResizeHighlight && tile.clearResizeHighlight();
            }
            return;
        }
        if (this.resizeType === 'column') {
            for (const tile of this.canvasTiles.values()) {
                tile.drawColumnBorder && tile.drawColumnBorder(this.resizeIndex, '#107C41');
            }
        } else if (this.resizeType === 'row') {
            for (const tile of this.canvasTiles.values()) {
                tile.drawRowBorder && tile.drawRowBorder(this.resizeIndex, '#107C41');
            }
        }
    }

    redrawGrid() {
        for (const [key, tile] of this.canvasTiles.entries()) {
            tile.draw();
        }
        this.drawHeaders();
        // this.createResizeHandles();
        this.selectionManager.renderSelection();
        // this.updateContentSizer();
    }

    updateContentSizer() {
        let totalWidth = 0;
        let totalHeight = 0;

        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            totalWidth += this.getColumnWidth(c);
        }

        for (let r = 0; r < TOTAL_ROWS; r++) {
            totalHeight += this.getRowHeight(r);
        }

        this.contentSizer.style.width = `${totalWidth}px`;
        this.contentSizer.style.height = `${totalHeight}px`;
    }

    updateHeaderCanvasSizes() {
        const wrapperWidth = this.gridWrapper.clientWidth;
        const wrapperHeight = this.gridWrapper.clientHeight;

        const colHeaderWidth = wrapperWidth - HEADER_WIDTH;
        const colHeaderHeight = HEADER_HEIGHT;
        this.colHeaderCanvas.width = colHeaderWidth * window.devicePixelRatio;
        this.colHeaderCanvas.height = colHeaderHeight * window.devicePixelRatio;
        this.colHeaderCanvas.style.width = `${colHeaderWidth}px`;
        this.colHeaderCanvas.style.height = `${colHeaderHeight}px`;
        this.colHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const rowHeaderWidth = HEADER_WIDTH;
        const rowHeaderHeight = wrapperHeight - HEADER_HEIGHT;
        this.rowHeaderCanvas.width = rowHeaderWidth * window.devicePixelRatio;
        this.rowHeaderCanvas.height = rowHeaderHeight * window.devicePixelRatio;
        this.rowHeaderCanvas.style.width = `${rowHeaderWidth}px`;
        this.rowHeaderCanvas.style.height = `${rowHeaderHeight}px`;
        this.rowHeaderCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    drawHeaders() {
        // console.log("drawHeaders")
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const dpr = window.devicePixelRatio;
        // Get selection info
        let selectedRows = new Set();
        let selectedCols = new Set();
        let selection = this.selectionManager.activeSelection;
        let highlightColHeaders = false;
        let highlightRowHeaders = false;
        let colHeaderBg = '#CAEAD8', colHeaderText = '#0F7045';
        let rowHeaderBg = '#CAEAD8', rowHeaderText = '#0F7045';

        if (selection) {
            if (selection.type === 'cell' || selection.type === 'range') {
                highlightColHeaders = true;
                highlightRowHeaders = true;
                if (selection.type === 'cell') {
                    selectedRows.add(selection.row);
                    selectedCols.add(selection.col);
                } else if (selection.type === 'range') {
                    for (let r = selection.startRow; r <= selection.endRow; r++) selectedRows.add(r);
                    for (let c = selection.startCol; c <= selection.endCol; c++) selectedCols.add(c);
                }
            } else if (selection.type === 'column') {
                highlightColHeaders = true;
                highlightRowHeaders = true; // Highlight all row headers
                selectedCols.add(selection.col);
                // Add all rows to selectedRows
                for (let r = 0; r < TOTAL_ROWS; r++) selectedRows.add(r);
                colHeaderBg = '#107C41'; // Use column selection color for column header
                colHeaderText = '#fff';
            } else if (selection.type === 'row') {
                highlightRowHeaders = true;
                highlightColHeaders = true; // Highlight all column headers
                selectedRows.add(selection.row);
                // Add all columns to selectedCols
                for (let c = 0; c < TOTAL_COLUMNS; c++) selectedCols.add(c);
                rowHeaderBg = '#107C41'; // Use row selection color for row header
                rowHeaderText = '#fff';
            }
        }

        // Draw column headers
        const colCtx = this.colHeaderCtx;
        colCtx.clearRect(0, 0, this.colHeaderCanvas.width, this.colHeaderCanvas.height);
        colCtx.font = '12px Arial';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.lineWidth = 1 / dpr;

        let currentX = -scrollLeft;
        let startCol = 0;
        while (currentX < 0 && startCol < TOTAL_COLUMNS) {
            currentX += this.getColumnWidth(startCol);
            startCol++;
        }
        if (startCol > 0) {
            startCol--;
            currentX -= this.getColumnWidth(startCol);
        }

        for (let c = startCol; c < TOTAL_COLUMNS && currentX < this.colHeaderCanvas.clientWidth; c++) {
            const colWidth = this.getColumnWidth(c);
            // Highlight if selected and allowed
            if (highlightColHeaders && selectedCols.has(c)) {
                colCtx.fillStyle = colHeaderBg;
                colCtx.fillRect(currentX, 0, colWidth, HEADER_HEIGHT);
                colCtx.strokeStyle = '#0F7045';
                colCtx.lineWidth = 2;
                // Bottom border
                colCtx.beginPath();
                colCtx.moveTo(currentX, HEADER_HEIGHT - 1);
                colCtx.lineTo(currentX + colWidth, HEADER_HEIGHT - 1);
                colCtx.stroke();
                colCtx.lineWidth = 1;
            } else {
                colCtx.fillStyle = '#f8f8f8';
                colCtx.fillRect(currentX, 0, colWidth, HEADER_HEIGHT);
            }
            colCtx.strokeStyle = '#d1d5db';
            colCtx.strokeRect(currentX - 0.5, 0, colWidth, HEADER_HEIGHT);
            colCtx.fillStyle = (highlightColHeaders && selectedCols.has(c)) ? colHeaderText : '#4b5563';
            if (colWidth > 10)
                colCtx.fillText(getColumnName(c), currentX + colWidth / 2, HEADER_HEIGHT / 2);
            currentX += colWidth;
        }

        // Draw row headers
        const rowCtx = this.rowHeaderCtx;
        rowCtx.clearRect(0, 0, this.rowHeaderCanvas.width, this.rowHeaderCanvas.height);
        rowCtx.font = '12px Arial';
        rowCtx.textAlign = 'left';
        rowCtx.textBaseline = 'middle';
        rowCtx.lineWidth = 1 / dpr;

        let currentY = -scrollTop;
        let startRow = 0;
        while (currentY < 0 && startRow < TOTAL_ROWS) {
            currentY += this.getRowHeight(startRow);
            startRow++;
        }
        if (startRow > 0) {
            startRow--;
            currentY -= this.getRowHeight(startRow);
        }

        for (let r = startRow; r < TOTAL_ROWS && currentY < this.rowHeaderCanvas.clientHeight; r++) {
            const rowHeight = this.getRowHeight(r);
            // Highlight if selected and allowed
            if (highlightRowHeaders && selectedRows.has(r)) {
                rowCtx.fillStyle = rowHeaderBg;
                rowCtx.fillRect(0, currentY, HEADER_WIDTH, rowHeight);
                rowCtx.strokeStyle = '#0F7045';
                rowCtx.lineWidth = 2 / dpr;
                // Right border
                rowCtx.beginPath();
                rowCtx.moveTo(HEADER_WIDTH - 1, currentY);
                rowCtx.lineTo(HEADER_WIDTH - 1, currentY + rowHeight);
                rowCtx.stroke();
                rowCtx.lineWidth = 1 / dpr;
            } else {
                rowCtx.fillStyle = '#f8f8f8';
                rowCtx.fillRect(0, currentY, HEADER_WIDTH, rowHeight);
            }
            rowCtx.strokeStyle = '#d1d5db';
            rowCtx.strokeRect(0, currentY - 0.5, HEADER_WIDTH, rowHeight);
            rowCtx.fillStyle = (highlightRowHeaders && selectedRows.has(r)) ? rowHeaderText : '#4b5563';
            if (rowHeight > 10) {
                const text = `${r + 1}`;
                const textWidth = rowCtx.measureText(text).width;
                rowCtx.fillText(text, HEADER_WIDTH - textWidth - 5, currentY + rowHeight / 2);
            }
            currentY += rowHeight;
        }

        this.createResizeHandles();
    }

    HandleResize() {
        this.updateHeaderCanvasSizes();
        this.HandleScroll();
        this.selectionManager.renderSelection();
    }

    HandleScroll() {
        this.renderVisibleTiles();
        this.selectionManager.handleScroll();

    }

    renderVisibleTiles() {
        // console.log("renderVisibleTiles")
        this.drawHeaders();
        const scrollTop = this.container.scrollTop;
        const scrollLeft = this.container.scrollLeft;
        const containerHeight = this.container.clientHeight;
        const containerWidth = this.container.clientWidth;

        // Calculate tile ranges (simplified for now)
        const avgTileHeight = VISIBLE_ROWS_PER_CANVAS_TILE * DEFAULT_ROW_HEIGHT;
        const avgTileWidth = VISIBLE_COLS_PER_CANVAS_TILE * DEFAULT_COLUMN_WIDTH;

        const startVisibleTileRow = Math.floor(scrollTop / avgTileHeight);
        const endVisibleTileRow = Math.ceil((scrollTop + containerHeight) / avgTileHeight);
        const startVisibleTileCol = Math.floor(scrollLeft / avgTileWidth);
        const endVisibleTileCol = Math.ceil((scrollLeft + containerWidth) / avgTileWidth);

        const bufferedStartTileRow = Math.max(0, startVisibleTileRow - TILE_BUFFER_ROWS);
        const bufferedEndTileRow = Math.min(Math.ceil(TOTAL_ROWS / VISIBLE_ROWS_PER_CANVAS_TILE), endVisibleTileRow + TILE_BUFFER_ROWS);
        const bufferedStartTileCol = Math.max(0, startVisibleTileCol - TILE_BUFFER_COLS);
        const bufferedEndTileCol = Math.min(Math.ceil(TOTAL_COLUMNS / VISIBLE_COLS_PER_CANVAS_TILE), endVisibleTileCol + TILE_BUFFER_COLS);

        const tilesToRender = new Set();

        for (let r = bufferedStartTileRow; r < bufferedEndTileRow; r++) {
            for (let c = bufferedStartTileCol; c < bufferedEndTileCol; c++) {
                const tileKey = `${r}_${c}`;
                tilesToRender.add(tileKey);

                let tile = this.canvasTiles.get(tileKey);
                if (!tile) {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.className = 'grid-canvas-tile';
                    this.container.appendChild(newCanvas);

                    tile = new CanvasTile(newCanvas, this, r, c);
                    this.canvasTiles.set(tileKey, tile);
                }
                tile.draw();
            }
        }

        // Remove tiles that are no longer visible
        for (const [key, tileInstance] of this.canvasTiles.entries()) {
            if (!tilesToRender.has(key)) {
                this.container.removeChild(tileInstance.canvasElement);
                this.canvasTiles.delete(key);
            }
        }

        // this.updateContentSizer();f
    }
    loadSampleData() {
        let numRows = 50000;
        let cols = ["id", "name", "age", "salary"];

        for (let i = 0; i < cols.length; i++) {
            this.cells.set("0_" + i, new Cell(0, i, cols[i]));
        }

        // add some data
        for (let row = 1; row < numRows; row++) {
            let person = {
                id: row,
                name: "User" + row,
                age: 20 + (row % 30),
                salary: 50000 + row * 100
            };

            for (let col = 0; col < cols.length; col++) {
                let value = person[cols[col]];
                this.cells.set(row + "_" + col, new Cell(row, col, value.toString()));
            }
        }

        this.renderVisibleTiles();
    }


    updateStatusBar() {
        const statusBar = document.getElementById('status-bar');
        if (!statusBar) return;
        let values = [];
        const sel = this.selectionManager.activeSelection;
        if (!sel) {
            statusBar.textContent = '';
            return;
        }
        if (sel.type === 'cell') {
            const cell = this.getCell(sel.row, sel.col);
            if (!isNaN(cell.value) && cell.value !== '') values = [Number(cell.value)];
        } else if (sel.type === 'range') {
            for (let r = sel.startRow; r <= sel.endRow; r++) {
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    const cell = this.getCell(r, c);
                    if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
                }
            }
        } else if (sel.type === 'row') {
            for (let c = 0; c < this.columns.length; c++) {
                const cell = this.getCell(sel.row, c);
                if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
            }
        } else if (sel.type === 'column') {
            for (let r = 0; r < this.rows.length; r++) {
                const cell = this.getCell(r, sel.col);
                if (!isNaN(cell.value) && cell.value !== '') values.push(Number(cell.value));
            }
        }
        if (values.length === 0) {
            statusBar.textContent = '';
            return;
        }
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = sum / count;
        statusBar.textContent = `Count: ${count}    Sum: ${sum}    Min: ${min}    Max: ${max}    Avg: ${avg.toFixed(2)}`;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const grid = new Grid('grid-container');
    grid.loadSampleData(); // Load sample data after grid initialization
});