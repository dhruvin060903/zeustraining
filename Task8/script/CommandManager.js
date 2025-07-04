// Command pattern for undo/redo support in grid (cell edit, resize)

export class CommandManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
    }
}

// --- Command base class ---
export class Command {
    execute() { }
    undo() { }
}

// --- Cell Edit Command ---
export class EditCellCommand extends Command {
    constructor(grid, row, col, oldValue, newValue) {
        super();
        this.grid = grid;
        this.row = row;
        this.col = col;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
    execute() {
        this.grid.getCell(this.row, this.col).setValue(this.newValue);
        this.grid.redrawCellInTiles(this.row, this.col);
    }
    undo() {
        this.grid.getCell(this.row, this.col).setValue(this.oldValue);
        this.grid.redrawCellInTiles(this.row, this.col);
    }
}

// --- Resize Column Command ---
export class ResizeColumnCommand extends Command {
    constructor(grid, colIndex, oldWidth, newWidth) {
        super();
        this.grid = grid;
        this.colIndex = colIndex;
        this.oldWidth = oldWidth;
        this.newWidth = newWidth;
    }
    execute() {
        this.grid.setColumnWidth(this.colIndex, this.newWidth);
    }
    undo() {
        this.grid.setColumnWidth(this.colIndex, this.oldWidth);
    }
}

// --- Resize Row Command ---
export class ResizeRowCommand extends Command {
    constructor(grid, rowIndex, oldHeight, newHeight) {
        super();
        this.grid = grid;
        this.rowIndex = rowIndex;
        this.oldHeight = oldHeight;
        this.newHeight = newHeight;
    }
    execute() {
        this.grid.setRowHeight(this.rowIndex, this.newHeight);
    }
    undo() {
        this.grid.setRowHeight(this.rowIndex, this.oldHeight);
    }
}
