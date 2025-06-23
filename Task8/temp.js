// Cell class - represents individual cells
class Cell {
    constructor(row, col, value = "") {
        this.row = row;
        this.col = col;
        this.value = value;
        this.formula = "";
        this.style = {
            backgroundColor: "#ffffff",
            textColor: "#000000",
            fontSize: 12,
            fontWeight: "normal",
        };
    }

    setValue(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    getDisplayValue() {
        return this.value?.toString() || "";
    }

    isNumeric() {
        return !isNaN(parseFloat(this.value)) && isFinite(this.value);
    }

    getNumericValue() {
        return this.isNumeric() ? parseFloat(this.value) : 0;
    }
}

// Row class - manages row properties
class Row {
    constructor(index, height = 25) {
        this.index = index;
        this.height = height;
        this.hidden = false;
        this.selected = false;
    }

    setHeight(height) {
        this.height = Math.max(15, height);
    }

    getHeight() {
        return this.hidden ? 0 : this.height;
    }

    toggle() {
        this.hidden = !this.hidden;
    }
}

// Column class - manages column properties
class Column {
    constructor(index, width = 80) {
        this.index = index;
        this.width = width;
        this.hidden = false;
        this.selected = false;
        this.header = this.getColumnName(index);
    }

    setWidth(width) {
        this.width = Math.max(20, width);
    }

    getWidth() {
        return this.hidden ? 0 : this.width;
    }

    toggle() {
        this.hidden = !this.hidden;
    }

    getColumnName(index) {
        let name = "";
        while (index >= 0) {
            name = String.fromCharCode(65 + (index % 26)) + name;
            index = Math.floor(index / 26) - 1;
        }
        return name;
    }
}

// Selection class - handles different types of selections
class Selection {
    constructor() {
        this.type = "none"; // 'cell', 'row', 'column', 'range'
        this.startRow = -1;
        this.startCol = -1;
        this.endRow = -1;
        this.endCol = -1;
        this.active = false;
    }

    startSelection(row, col, type = "cell") {
        this.type = type;
        this.startRow = row;
        this.startCol = col;
        this.endRow = row;
        this.endCol = col;
        this.active = true;
    }

    updateSelection(row, col) {
        if (this.active) {
            this.endRow = row;
            this.endCol = col;
        }
    }

    endSelection() {
        this.active = false;
    }

    clear() {
        this.type = "none";
        this.startRow = -1;
        this.startCol = -1;
        this.endRow = -1;
        this.endCol = -1;
        this.active = false;
    }

    getSelectedCells() {
        const cells = [];
        const minRow = Math.min(this.startRow, this.endRow);
        const maxRow = Math.max(this.startRow, this.endRow);
        const minCol = Math.min(this.startCol, this.endCol);
        const maxCol = Math.max(this.startCol, this.endCol);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                cells.push({ row, col });
            }
        }
        return cells;
    }

    isInSelection(row, col) {
        if (this.type === "none") return false;

        const minRow = Math.min(this.startRow, this.endRow);
        const maxRow = Math.max(this.startRow, this.endRow);
        const minCol = Math.min(this.startCol, this.endCol);
        const maxCol = Math.max(this.startCol, this.endCol);

        return (
            row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
        );
    }
}

// CellRange class - represents a range of cells
class CellRange {
    constructor(startRow, startCol, endRow, endCol) {
        this.startRow = Math.min(startRow, endRow);
        this.endRow = Math.max(startRow, endRow);
        this.startCol = Math.min(startCol, endCol);
        this.endCol = Math.max(startCol, endCol);
    }

    contains(row, col) {
        return (
            row >= this.startRow &&
            row <= this.endRow &&
            col >= this.startCol &&
            col <= this.endCol
        );
    }

    getCells() {
        const cells = [];
        for (let row = this.startRow; row <= this.endRow; row++) {
            for (let col = this.startCol; col <= this.endCol; col++) {
                cells.push({ row, col });
            }
        }
        return cells;
    }

    getSize() {
        return (
            (this.endRow - this.startRow + 1) *
            (this.endCol - this.startCol + 1)
        );
    }
}

// Statistics class - calculates statistics for selected cells
class Statistics {
    static calculate(cells, grid) {
        const numericValues = [];
        let totalCells = 0;

        cells.forEach(({ row, col }) => {
            const cell = grid.getCell(row, col);
            if (cell && cell.getValue() !== "") {
                totalCells++;
                if (cell.isNumeric()) {
                    numericValues.push(cell.getNumericValue());
                }
            }
        });

        if (numericValues.length === 0) {
            return {
                count: totalCells,
                sum: 0,
                average: 0,
                min: 0,
                max: 0,
                numericCount: 0,
            };
        }

        const sum = numericValues.reduce((a, b) => a + b, 0);
        const average = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);

        return {
            count: totalCells,
            sum: sum,
            average: average,
            min: min,
            max: max,
            numericCount: numericValues.length,
        };
    }
}

// Main Grid class - orchestrates everything
class Grid {
    constructor(canvasId, rows = 100000, cols = 500) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.editor = document.getElementById("cellEditor");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.maxRows = rows;
        this.maxCols = cols;

        // Initialize data structures
        this.rows = Array.from({ length: rows }, (_, i) => new Row(i));
        this.columns = Array.from({ length: cols }, (_, i) => new Column(i));
        this.cells = new Map();

        this.selection = new Selection();
        this.viewport = {
            startRow: 0,
            startCol: 0,
            endRow: 0,
            endCol: 0,
        };

        this.headerHeight = 25;
        this.headerWidth = 50;
        this.scrollX = 0;
        this.scrollY = 0;
        this.zoomLevel = 1.0;

        this.isDragging = false;
        this.isResizing = false;
        this.resizeType = "";
        this.resizeIndex = -1;
        this.isEditing = false;

        // Clipboard functionality
        this.clipboard = [];
        this.undoStack = [];
        this.redoStack = [];

        this.horizontalScrollbar = document.getElementById("horizontalScrollbar");
        this.verticalScrollbar = document.getElementById("verticalScrollbar");
        this.setupEventListeners();
        this.setupScrollbars();
        this.calculateViewport();
        this.render();
    }

    setupScrollbars() {
        // Calculate total dimensions
        this.totalWidth = this.columns.reduce((sum, col) => sum + col.getWidth(), 0);
        this.totalHeight = this.rows.reduce((sum, row) => sum + row.getHeight(), 0);

        // Setup horizontal scrollbar
        this.horizontalScrollbar.addEventListener("scroll", (e) => {
            const scrollRatio = e.target.scrollLeft / (this.totalWidth - this.canvas.width + this.headerWidth);
            this.scrollX = scrollRatio * (this.totalWidth - this.canvas.width + this.headerWidth);
            this.scrollX = Math.max(0, Math.min(this.scrollX, this.totalWidth - this.canvas.width + this.headerWidth));
            this.calculateViewport();
            this.render();
        });

        // Setup vertical scrollbar
        this.verticalScrollbar.addEventListener("scroll", (e) => {
            const scrollRatio = e.target.scrollTop / (this.totalHeight - this.canvas.height + this.headerHeight);
            this.scrollY = scrollRatio * (this.totalHeight - this.canvas.height + this.headerHeight);
            this.scrollY = Math.max(0, Math.min(this.scrollY, this.totalHeight - this.canvas.height + this.headerHeight));
            this.calculateViewport();
            this.render();
        });

        // Initialize scrollbar positions
        this.updateScrollbarSizes();
    }

    updateScrollbarSizes() {
        //         console.log(this.totalHeight)
        console.log(this.totalWidth)
        console.log(this.canvas.width)

        console.log(window.innerWidth)

        // Update horizontal scrollbar
        const hTrack = this.horizontalScrollbar.querySelector('.scrollbar-track');
        const maxHorizontalScroll = Math.max(this.totalWidth - this.canvas.width + this.headerWidth, 0);
        hTrack.style.width = Math.max(this.totalWidth - this.canvas.width, this.canvas.width) + 'px';

        // Update vertical scrollbar
        const vTrack = this.verticalScrollbar.querySelector('.scrollbar-track');
        const maxVerticalScroll = Math.max(this.totalHeight - this.canvas.height + this.headerHeight, 0);
        vTrack.style.height = Math.max(this.totalHeight, this.canvas.height) + 'px';
    }

    updateScrollbarPositions() {
        // Update horizontal scrollbar position
        const maxHorizontalScroll = Math.max(this.totalWidth - this.canvas.width + this.headerWidth, 0);
        if (maxHorizontalScroll > 0) {
            const hScrollRatio = this.scrollX / maxHorizontalScroll;
            this.horizontalScrollbar.scrollLeft = hScrollRatio * (this.horizontalScrollbar.scrollWidth - this.horizontalScrollbar.clientWidth);
        }

        // Update vertical scrollbar position
        const maxVerticalScroll = Math.max(this.totalHeight - this.canvas.height + this.headerHeight, 0);
        if (maxVerticalScroll > 0) {
            const vScrollRatio = this.scrollY / maxVerticalScroll;
            this.verticalScrollbar.scrollTop = vScrollRatio * (this.verticalScrollbar.scrollHeight - this.verticalScrollbar.clientHeight);
        }
    }
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener(
            "mousedown",
            this.handleMouseDown.bind(this)
        );
        this.canvas.addEventListener(
            "mousemove",
            this.handleMouseMove.bind(this)
        );
        this.canvas.addEventListener(
            "mouseup",
            this.handleMouseUp.bind(this)
        );
        this.canvas.addEventListener(
            "dblclick",
            this.handleDoubleClick.bind(this)
        );

        // Keyboard events
        document.addEventListener("keydown", this.handleKeyDown.bind(this));

        // Editor events
        this.editor.addEventListener("blur", this.finishEditing.bind(this));
        this.editor.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.finishEditing();
            } else if (e.key === "Escape") {
                this.cancelEditing();
            }
        });

        // Scroll events
        this.canvas.addEventListener("wheel", this.handleWheel.bind(this));
    }

    getCell(row, col) {
        const key = `${row},${col}`;
        if (!this.cells.has(key)) {
            this.cells.set(key, new Cell(row, col));
        }
        return this.cells.get(key);
    }

    setCellValue(row, col, value, fromUndoRedo = false) {
        const cell = this.getCell(row, col);
        const prevValue = cell.getValue();

        if (!fromUndoRedo) {
            this.undoStack.push({ row, col, prevValue, newValue: value });
            this.redoStack = []; // Clear redo on new action
        }
        cell.setValue(value);
        this.render();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const { row, col, prevValue, newValue } = this.undoStack.pop();
        this.redoStack.push({ row, col, prevValue: newValue, newValue: prevValue });

        this.setCellValue(row, col, prevValue, true);


    }
    redo() {
        if (this.redoStack.length === 0) return;

        const { row, col, prevValue, newValue } = this.redoStack.pop();
        console.log(row, col, prevValue, newValue)
        this.undoStack.push({ row, col, prevValue: newValue, newValue: prevValue });
        console.log(this.redoStack)
        console.log(this.undoStack)

        this.setCellValue(row, col, prevValue, true);
    }

    calculateViewport() {
        let x = this.headerWidth - this.scrollX;
        let y = this.headerHeight - this.scrollY;
        // console.log(x,y)
        this.viewport.startCol = 0;
        this.viewport.startRow = 0;

        // Find start column
        while (x < 0 && this.viewport.startCol < this.maxCols - 1) {
            x += this.columns[this.viewport.startCol].getWidth();
            this.viewport.startCol++;
        }

        // Find start row
        while (y < 0 && this.viewport.startRow < this.maxRows - 1) {
            y += this.rows[this.viewport.startRow].getHeight();
            this.viewport.startRow++;
        }

        // Find end column
        this.viewport.endCol = this.viewport.startCol;
        x = this.headerWidth - this.scrollX;
        for (
            let col = this.viewport.startCol;
            col < this.maxCols && x < this.canvas.width;
            col++
        ) {
            x += this.columns[col].getWidth();
            this.viewport.endCol = col;
        }

        // Find end row
        this.viewport.endRow = this.viewport.startRow;
        y = this.headerHeight - this.scrollY;
        for (
            let row = this.viewport.startRow;
            row < this.maxRows && y < this.canvas.height;
            row++
        ) {
            y += this.rows[row].getHeight();
            this.viewport.endRow = row;
        }
    }

    getCellAt(x, y) {
        if (x < this.headerWidth || y < this.headerHeight) {
            return { row: -1, col: -1 };
        }

        let currentX = this.headerWidth - this.scrollX;
        let currentY = this.headerHeight - this.scrollY;

        let col = -1;
        for (let c = this.viewport.startCol; c <= this.viewport.endCol; c++) {
            if (x >= currentX && x < currentX + this.columns[c].getWidth()) {
                col = c;
                break;
            }
            currentX += this.columns[c].getWidth();
        }

        let row = -1;
        for (let r = this.viewport.startRow; r <= this.viewport.endRow; r++) {
            if (y >= currentY && y < currentY + this.rows[r].getHeight()) {
                row = r;
                break;
            }
            currentY += this.rows[r].getHeight();
        }

        return { row, col };
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // console.log(body.sc)
        // Check for resize handles
        if (this.checkResize(x, y)) {
            return;
        }

        // Check for header clicks (row/column selection)
        if (x >= 0 && x < this.headerWidth && y >= this.headerHeight) {
            // Row header clicked - select entire row
            const { row } = this.getCellAt(this.headerWidth + 1, y);
            if (row >= 0) {
                this.selection.startSelection(row, 0, "row");
                this.selection.updateSelection(row, this.maxCols - 1);
                this.selection.endSelection();
                this.render();
                this.updateStats();
            }
            return;
        }

        if (y >= 0 && y < this.headerHeight && x >= this.headerWidth) {
            // Column header clicked - select entire column
            const { col } = this.getCellAt(x, this.headerHeight + 1);
            if (col >= 0) {
                this.selection.startSelection(0, col, "column");
                this.selection.updateSelection(this.maxRows - 1, col);
                this.selection.endSelection();
                this.render();
                this.updateStats();
            }
            return;
        }

        // Corner clicked - select all
        if (
            x >= 0 &&
            x < this.headerWidth &&
            y >= 0 &&
            y < this.headerHeight
        ) {
            this.selection.startSelection(0, 0, "all");
            this.selection.updateSelection(this.maxRows - 1, this.maxCols - 1);
            this.selection.endSelection();
            this.render();
            this.updateStats();
            return;
        }

        const { row, col } = this.getCellAt(x, y);

        if (row >= 0 && col >= 0) {
            this.selection.startSelection(row, col, "range");
            this.isDragging = true;
            this.render();
            this.updateStats();
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isResizing) {
            this.doResize(x, y);
            return;
        }

        // Update cursor for resize areas
        this.updateCursor(x, y);

        if (this.isDragging && this.selection.active) {
            const { row, col } = this.getCellAt(x, y);
            if (row >= 0 && col >= 0) {
                this.selection.updateSelection(row, col);
                this.render();
                this.updateStats();
            }
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.selection.endSelection();
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { row, col } = this.getCellAt(x, y);

        if (row >= 0 && col >= 0) {
            this.startEditing(row, col);
        }
    }

    checkResize(x, y) {
        // Check column resize
        let currentX = this.headerWidth - this.scrollX;
        for (
            let col = this.viewport.startCol;
            col <= this.viewport.endCol;
            col++
        ) {
            currentX += this.columns[col].getWidth();
            if (Math.abs(x - currentX) <= 3) {
                this.isResizing = true;
                this.resizeType = "column";
                this.resizeIndex = col;
                this.canvas.style.cursor = "col-resize";
                return true;
            }
        }

        // Check row resize
        let currentY = this.headerHeight - this.scrollY;
        for (
            let row = this.viewport.startRow;
            row <= this.viewport.endRow;
            row++
        ) {
            currentY += this.rows[row].getHeight();
            if (Math.abs(y - currentY) <= 3) {
                this.isResizing = true;
                this.resizeType = "row";
                this.resizeIndex = row;
                this.canvas.style.cursor = "row-resize";
                return true;
            }
        }

        return false;
    }

    updateCursor(x, y) {
        if (this.checkResize(x, y)) {
            this.isResizing = false; // Just checking, not actually resizing
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    doResize(x, y) {
        if (this.resizeType === "column") {
            let currentX = this.headerWidth - this.scrollX;
            for (
                let col = this.viewport.startCol;
                col <= this.resizeIndex;
                col++
            ) {
                currentX += this.columns[col].getWidth();
            }
            const newWidth =
                x - (currentX - this.columns[this.resizeIndex].getWidth());
            this.columns[this.resizeIndex].setWidth(newWidth);
        } else if (this.resizeType === "row") {
            let currentY = this.headerHeight - this.scrollY;
            for (
                let row = this.viewport.startRow;
                row <= this.resizeIndex;
                row++
            ) {
                currentY += this.rows[row].getHeight();
            }
            const newHeight =
                y - (currentY - this.rows[this.resizeIndex].getHeight());
            this.rows[this.resizeIndex].setHeight(newHeight);
        }
        this.updateScrollbarSizes();
        this.render();
    }

    startEditing(row, col) {
        this.isEditing = true;
        this.editingRow = row;
        this.editingCol = col;

        const cell = this.getCell(row, col);
        this.editor.value = cell.getValue();

        // Position the editor
        const cellRect = this.getCellRect(row, col);
        this.editor.style.left = cellRect.x - 1 + "px";
        this.editor.style.top = cellRect.y - 1 + "px";
        this.editor.style.width = cellRect.width - 8 + "px";
        this.editor.style.height = cellRect.height - 4 + "px";
        this.editor.style.display = "block";
        this.editor.focus();
        this.editor.select();
    }

    finishEditing() {
        if (this.isEditing) {
            this.setCellValue(
                this.editingRow,
                this.editingCol,
                this.editor.value
            );
            this.editor.style.display = "none";
            this.isEditing = false;
        }
    }

    cancelEditing() {
        this.editor.style.display = "none";
        this.isEditing = false;
    }

    getCellRect(row, col) {
        let x = this.headerWidth - this.scrollX;
        let y = this.headerHeight - this.scrollY;

        for (let c = this.viewport.startCol; c < col; c++) {
            x += this.columns[c].getWidth();
        }

        for (let r = this.viewport.startRow; r < row; r++) {
            y += this.rows[r].getHeight();
        }

        return {
            x: x,
            y: y,
            width: this.columns[col].getWidth(),
            height: this.rows[row].getHeight(),
        };
    }

    handleWheel(e) {
        e.preventDefault();

        const scrollSpeed = 50;
        this.scrollX += (e.deltaX * scrollSpeed) / 100;
        this.scrollY += (e.deltaY * scrollSpeed) / 100;

        this.scrollX = Math.max(0, this.scrollX);
        this.scrollY = Math.max(0, this.scrollY);

        this.calculateViewport();
        this.updateScrollbarPositions();
        this.render();
    }

    handleKeyDown(e) {
        if (this.isEditing) return;

        // Handle Ctrl+C (Copy)
        if (e.ctrlKey && e.key === "c") {
            this.copySelection();
            e.preventDefault();
        }

        // Handle Ctrl+V (Paste)
        if (e.ctrlKey && e.key === "v") {
            this.pasteSelection();
            e.preventDefault();
        }

        // Handle Delete
        if (e.key === "Delete") {
            this.deleteSelection();
            e.preventDefault();
        }
        if (e.ctrlKey && e.key.toLowerCase() === "z") {
            e.preventDefault();
            this.undo();
        }
        if (e.ctrlKey && e.key.toLowerCase() === "y") {
            e.preventDefault();
            this.redo();
        }
        // Handle arrow keys for navigation
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            this.handleArrowKey(e.key);
            e.preventDefault();
        }
    }

    handleArrowKey(key) {
        if (this.selection.type === "none") {
            this.selection.startSelection(0, 0);
        }

        let newRow = this.selection.startRow;
        let newCol = this.selection.startCol;

        switch (key) {
            case "ArrowUp":
                newRow = Math.max(0, newRow - 1);
                break;
            case "ArrowDown":
                newRow = Math.min(this.maxRows - 1, newRow + 1);
                break;
            case "ArrowLeft":
                newCol = Math.max(0, newCol - 1);
                break;
            case "ArrowRight":
                newCol = Math.min(this.maxCols - 1, newCol + 1);
                break;
        }

        this.selection.startSelection(newRow, newCol);
        this.ensureCellVisible(newRow, newCol);
        this.render();
        this.updateStats();
    }

    ensureCellVisible(row, col) {
        // Calculate cell position
        let cellX = this.headerWidth;
        for (let c = 0; c < col; c++) {
            cellX += this.columns[c].getWidth();
        }

        let cellY = this.headerHeight;
        for (let r = 0; r < row; r++) {
            cellY += this.rows[r].getHeight();
        }

        // Adjust scroll if needed
        const cellWidth = this.columns[col].getWidth();
        const cellHeight = this.rows[row].getHeight();

        if (cellX - this.scrollX < this.headerWidth) {
            this.scrollX = cellX - this.headerWidth;
        } else if (cellX + cellWidth - this.scrollX > this.canvas.width) {
            this.scrollX = cellX + cellWidth - this.canvas.width;
        }

        if (cellY - this.scrollY < this.headerHeight) {
            this.scrollY = cellY - this.headerHeight;
        } else if (cellY + cellHeight - this.scrollY > this.canvas.height) {
            this.scrollY = cellY + cellHeight - this.canvas.height;
        }

        this.scrollX = Math.max(0, this.scrollX);
        this.scrollY = Math.max(0, this.scrollY);

        this.calculateViewport();
    }

    copySelection() {
        if (this.selection.type === "none") return;

        this.clipboard = [];
        const selectedCells = this.selection.getSelectedCells();

        const minRow = Math.min(
            this.selection.startRow,
            this.selection.endRow
        );
        const maxRow = Math.max(
            this.selection.startRow,
            this.selection.endRow
        );
        const minCol = Math.min(
            this.selection.startCol,
            this.selection.endCol
        );
        const maxCol = Math.max(
            this.selection.startCol,
            this.selection.endCol
        );

        for (let row = minRow; row <= maxRow; row++) {
            const rowData = [];
            for (let col = minCol; col <= maxCol; col++) {
                const cell = this.getCell(row, col);
                rowData.push(cell.getValue() || "");
            }
            this.clipboard.push(rowData);
        }

        console.log("Copied", this.clipboard.length, "rows");
    }

    pasteSelection() {
        if (this.clipboard.length === 0 || this.selection.type === "none")
            return;

        const startRow = this.selection.startRow;
        const startCol = this.selection.startCol;

        for (let r = 0; r < this.clipboard.length; r++) {
            for (let c = 0; c < this.clipboard[r].length; c++) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;

                if (targetRow < this.maxRows && targetCol < this.maxCols) {
                    this.setCellValue(targetRow, targetCol, this.clipboard[r][c]);
                }
            }
        }

        this.render();
        console.log(
            "Pasted data starting at",
            this.columns[startCol].header + (startRow + 1)
        );
    }

    deleteSelection() {
        if (this.selection.type === "none") return;

        const selectedCells = this.selection.getSelectedCells();
        selectedCells.forEach(({ row, col }) => {
            this.setCellValue(row, col, "");
        });

        this.render();
        this.updateStats();
    }


    setZoom() {
        const zoomValue = document.getElementById("zoomLevel").value;
        this.zoomLevel = Math.max(0.5, Math.min(2.0, zoomValue / 100));

        // Apply zoom to font size and cell dimensions
        this.calculateViewport();
        this.render();
    }



    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines and cells
        this.drawGrid();

        // Draw headers
        this.drawHeaders();

        // Draw selection
        this.drawSelection();
    }

    drawGrid() {
        this.ctx.strokeStyle = "#e0e0e0";
        this.ctx.lineWidth = 1;
        this.ctx.font = `${Math.floor(12 * this.zoomLevel)}px Arial`;

        let currentY = this.headerHeight - this.scrollY;

        // Performance optimization: only draw visible cells
        const visibleCells = [];

        for (
            let row = this.viewport.startRow;
            row <= this.viewport.endRow && currentY < this.canvas.height;
            row++
        ) {
            let currentX = this.headerWidth - this.scrollX;
            const rowHeight = this.rows[row].getHeight() * this.zoomLevel;

            for (
                let col = this.viewport.startCol;
                col <= this.viewport.endCol && currentX < this.canvas.width;
                col++
            ) {
                const colWidth = this.columns[col].getWidth() * this.zoomLevel;

                // Batch cell drawing for better performance
                visibleCells.push({
                    row,
                    col,
                    x: currentX,
                    y: currentY,
                    width: colWidth,
                    height: rowHeight,
                });

                currentX += colWidth;
            }

            currentY += rowHeight;
        }

        // Draw all cells in batches
        this.drawCellBatch(visibleCells);
    }

    drawCellBatch(cells) {
        // First pass: backgrounds
        cells.forEach((cellInfo) => {
            const { row, col, x, y, width, height } = cellInfo;

            if (this.selection.isInSelection(row, col)) {
                this.ctx.fillStyle = "#e3f2fd";
            } else {
                this.ctx.fillStyle = "#ffffff";
            }
            this.ctx.fillRect(x, y, width, height);
        });

        // Second pass: borders
        this.ctx.beginPath();
        cells.forEach((cellInfo) => {
            const { x, y, width, height } = cellInfo;
            this.ctx.rect(x, y, width, height);
        });
        this.ctx.stroke();

        // Third pass: content
        this.ctx.fillStyle = "#000000";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";

        cells.forEach((cellInfo) => {
            const { row, col, x, y, width, height } = cellInfo;
            const cell = this.getCell(row, col);

            if (cell && cell.getValue()) {
                const text = cell.getDisplayValue();
                const maxWidth = width - 8;

                // Truncate text if too long
                let displayText = text;
                if (this.ctx.measureText(text).width > maxWidth) {
                    displayText =
                        text.substring(
                            0,
                            Math.floor(
                                (text.length * maxWidth) /
                                this.ctx.measureText(text).width
                            )
                        ) + "...";
                }

                this.ctx.fillText(displayText, x + 4, y + height / 2);
            }
        });
    }

    drawHeaders() {
        this.ctx.fillStyle = "#f5f5f5";
        this.ctx.font = "11px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Draw column headers
        let currentX = this.headerWidth - this.scrollX;
        for (
            let col = this.viewport.startCol;
            col <= this.viewport.endCol;
            col++
        ) {
            const colWidth = this.columns[col].getWidth();

            this.ctx.fillRect(currentX, 0, colWidth, this.headerHeight);
            this.ctx.strokeRect(currentX, 0, colWidth, this.headerHeight);

            this.ctx.fillStyle = "#333333";
            this.ctx.fillText(
                this.columns[col].header,
                currentX + colWidth / 2,
                this.headerHeight / 2
            );
            this.ctx.fillStyle = "#f5f5f5";

            currentX += colWidth;
        }

        // Draw row headers
        let currentY = this.headerHeight - this.scrollY;
        for (
            let row = this.viewport.startRow;
            row <= this.viewport.endRow;
            row++
        ) {
            const rowHeight = this.rows[row].getHeight();

            this.ctx.fillRect(0, currentY, this.headerWidth, rowHeight);
            this.ctx.strokeRect(0, currentY, this.headerWidth, rowHeight);

            this.ctx.fillStyle = "#333333";
            this.ctx.fillText(
                (row + 1).toString(),
                this.headerWidth / 2,
                currentY + rowHeight / 2
            );
            this.ctx.fillStyle = "#f5f5f5";

            currentY += rowHeight;
        }

        // Draw corner
        this.ctx.fillRect(0, 0, this.headerWidth, this.headerHeight);
        this.ctx.strokeRect(0, 0, this.headerWidth, this.headerHeight);
    }

    drawSelection() {
        if (this.selection.type === "none") return;

        this.ctx.strokeStyle = "#1976d2";
        this.ctx.lineWidth = 2;

        const minRow = Math.min(
            this.selection.startRow,
            this.selection.endRow
        );
        const maxRow = Math.max(
            this.selection.startRow,
            this.selection.endRow
        );
        const minCol = Math.min(
            this.selection.startCol,
            this.selection.endCol
        );
        const maxCol = Math.max(
            this.selection.startCol,
            this.selection.endCol
        );

        let startX = this.headerWidth - this.scrollX;
        let startY = this.headerHeight - this.scrollY;

        // Calculate selection rectangle
        for (let col = this.viewport.startCol; col < minCol; col++) {
            startX += this.columns[col].getWidth();
        }

        for (let row = this.viewport.startRow; row < minRow; row++) {
            startY += this.rows[row].getHeight();
        }

        let width = 0;
        for (let col = minCol; col <= maxCol; col++) {
            width += this.columns[col].getWidth();
        }

        let height = 0;
        for (let row = minRow; row <= maxRow; row++) {
            height += this.rows[row].getHeight();
        }

        this.ctx.strokeRect(startX, startY, width, height);
    }

    updateStats() {
        const statsDiv = document.getElementById("selectionStats");

        if (this.selection.type === "none") {
            statsDiv.innerHTML = "No selection";
            return;
        }

        const selectedCells = this.selection.getSelectedCells();
        const stats = Statistics.calculate(selectedCells, this);

        const rangeText = `${this.columns[
            Math.min(this.selection.startCol, this.selection.endCol)
        ].header
            }${Math.min(this.selection.startRow, this.selection.endRow) + 1}:${this.columns[
                Math.max(this.selection.startCol, this.selection.endCol)
            ].header
            }${Math.max(this.selection.startRow, this.selection.endRow) + 1}`;

        statsDiv.innerHTML = `
                    <strong>Selection:</strong> ${rangeText} (${selectedCells.length
            } cells) | 
                    <strong>Count:</strong> ${stats.count} | 
                    <strong>Sum:</strong> ${stats.sum.toFixed(2)} | 
                    <strong>Average:</strong> ${stats.average.toFixed(2)} | 
                    <strong>Min:</strong> ${stats.min.toFixed(2)} | 
                    <strong>Max:</strong> ${stats.max.toFixed(2)}
                `;
    }

    loadSampleData() {
        // Load sample data for demonstration
        const sampleData = [
            ["Product", "Jan", "Feb", "Mar", "Apr", "May"],
            ["Laptop", "1200", "1350", "1100", "1500", "1800"],
            ["Phone", "800", "750", "900", "1000", "1200"],
            ["Tablet", "600", "550", "650", "700", "800"],
            ["Watch", "300", "320", "280", "350", "400"],
            ["Headphones", "150", "180", "200", "220", "250"],
        ];

        for (let row = 0; row < sampleData.length; row++) {
            for (let col = 0; col < sampleData[row].length; col++) {
                this.setCellValue(row, col, sampleData[row][col]);
            }
        }

        this.render();
    }
    loadFromJSONArray(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return;

        const keys = Object.keys(arr[0]);

        // Load headers
        for (let col = 0; col < keys.length; col++) {
            this.setCellValue(0, col, keys[col]);
        }

        // Load values
        for (let row = 0; row < arr.length; row++) {
            const obj = arr[row];
            for (let col = 0; col < keys.length; col++) {
                const key = keys[col];
                this.setCellValue(row + 1, col, obj[key]);
            }
        }

        this.render();
    }

    clearSelection() {
        this.selection.clear();
        this.render();
        this.updateStats();
    }
}

// Initialize the grid
const grid = new Grid("gridCanvas", 100000, 500);

// const wrapper = document.getElementById("gridCanvas");

// wrapper.addEventListener("wheel", () => {
//     const scrollX = wrapper.scrollLeft;
//     const scrollY = wrapper.scrollTop;

//     console.log("Scrolled X:", scrollX, "Scrolled Y:", scrollY);
// });
fetch("MOCK_DATA.json")
    .then((res) => res.json())
    .then((data) => {
       grid.loadFromJSONArray(data)
    })
    .catch((err) => {
        console.error("Failed to load JSON:", err);
    });
