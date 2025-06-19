/**
 * Excel-like Grid System using HTML Canvas with Scroll Support
 */

const ROWS = 100;
const COLS = 100;
const DEFAULT_CELL_WIDTH = 100;
const DEFAULT_CELL_HEIGHT = 25;

// Outer wrapper to allow both scroll and fixed input overlay
const wrapper = document.createElement("div");
wrapper.style.position = "relative";
wrapper.style.width = "100vw";
wrapper.style.height = "99vh";
document.body.appendChild(wrapper);

// Container and canvas
const container = document.createElement("div");
container.style.width = "100%";
container.style.height = "100%";
container.style.overflow = "auto";
container.style.position = "absolute";
wrapper.appendChild(container);

const canvas = document.createElement("canvas");
canvas.width = COLS * DEFAULT_CELL_WIDTH;
canvas.height = ROWS * DEFAULT_CELL_HEIGHT;
canvas.style.display = "block";
canvas.style.position = "relative";
container.appendChild(canvas);

const ctx = canvas.getContext("2d");

const inputBox = document.createElement("input");
inputBox.style.position = "absolute";
inputBox.style.zIndex = 1000;
inputBox.style.display = "none";
wrapper.appendChild(inputBox);

class Cell {
  constructor(value = "") {
    this.value = value;
  }
}

class Row {
  constructor(index) {
    this.index = index;
    this.height = DEFAULT_CELL_HEIGHT;
  }
}

class Column {
  constructor(index) {
    this.index = index;
    this.width = DEFAULT_CELL_WIDTH;
  }
}

class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => new Cell("")));
    this.rowMeta = Array.from({ length: rows }, (_, i) => new Row(i));
    this.colMeta = Array.from({ length: cols }, (_, i) => new Column(i));
  }

  draw(viewport, selection) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = viewport.rowStart; i <= viewport.rowEnd; i++) {
      for (let j = viewport.colStart; j <= viewport.colEnd; j++) {
        const x = j * DEFAULT_CELL_WIDTH;
        const y = i * DEFAULT_CELL_HEIGHT;
        const cell = this.data[i][j];

        ctx.fillStyle = selection?.isSelected(i, j) ? '#CCE5FF' : '#FFF';
        ctx.fillRect(x, y, DEFAULT_CELL_WIDTH, DEFAULT_CELL_HEIGHT);

        ctx.strokeStyle = '#CCC';
        ctx.strokeRect(x, y, DEFAULT_CELL_WIDTH, DEFAULT_CELL_HEIGHT);

        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(cell.value, x + 4, y + 16);
      }
    }
  }
}

class Viewport {
  constructor() {
    this.rowStart = 0;
    this.rowEnd = 50;
    this.colStart = 0;
    this.colEnd = 20;
  }

  updateFromScroll(scrollTop, scrollLeft) {
    this.rowStart = Math.floor(scrollTop / DEFAULT_CELL_HEIGHT);
    this.rowEnd = this.rowStart + Math.ceil(window.innerHeight / DEFAULT_CELL_HEIGHT);
    this.colStart = Math.floor(scrollLeft / DEFAULT_CELL_WIDTH);
    this.colEnd = this.colStart + Math.ceil(window.innerWidth / DEFAULT_CELL_WIDTH);
  }
}

class Selection {
  constructor() {
    this.cells = [];
  }

  selectCell(row, col) {
    this.cells = [{ row, col }];
  }

  isSelected(row, col) {
    return this.cells.some(cell => cell.row === row && cell.col === col);
  }
}

class Command {
  execute() {}
  undo() {}
}

class EditCellCommand extends Command {
  constructor(grid, row, col, newValue) {
    super();
    this.grid = grid;
    this.row = row;
    this.col = col;
    this.newValue = newValue;
    this.oldValue = grid.data[row][col].value;
  }
  execute() {
    this.grid.data[this.row][this.col].value = this.newValue;
  }
  undo() {
    this.grid.data[this.row][this.col].value = this.oldValue;
  }
}

const grid = new Grid(ROWS, COLS);
const viewport = new Viewport();
const selection = new Selection();
const undoStack = [];
const redoStack = [];

function redraw() {
  viewport.updateFromScroll(container.scrollTop, container.scrollLeft);
  grid.draw(viewport, selection);
}

container.addEventListener("scroll", () => {
  redraw();
});

canvas.addEventListener('click', (e) => {
  const scrollX = container.scrollLeft;
  const scrollY = container.scrollTop;

  const x = e.clientX + scrollX - container.getBoundingClientRect().left;
  const y = e.clientY + scrollY - container.getBoundingClientRect().top;

  const col = Math.floor(x / DEFAULT_CELL_WIDTH);
  const row = Math.floor(y / DEFAULT_CELL_HEIGHT);

  if (row < ROWS && col < COLS) {
    selection.selectCell(row, col);
    redraw();

    const left = col * DEFAULT_CELL_WIDTH - scrollX;
    const top = row * DEFAULT_CELL_HEIGHT - scrollY;

    inputBox.style.left = `${left}px`;
    inputBox.style.top = `${top}px`;
    inputBox.style.width = `${DEFAULT_CELL_WIDTH}px`;
    inputBox.style.height = `${DEFAULT_CELL_HEIGHT}px`;
    inputBox.value = grid.data[row][col].value;
    inputBox.style.display = "block";
    inputBox.focus();

    inputBox.onblur = () => {
      const newValue = inputBox.value;
      inputBox.style.display = "none";
      const cmd = new EditCellCommand(grid, row, col, newValue);
      cmd.execute();
      undoStack.push(cmd);
      redraw();
    };
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === 'z' && undoStack.length > 0) {
    const cmd = undoStack.pop();
    cmd.undo();
    redoStack.push(cmd);
    redraw();
  }
  if (e.ctrlKey && e.key === 'y' && redoStack.length > 0) {
    const cmd = redoStack.pop();
    cmd.execute();
    undoStack.push(cmd);
    redraw();
  }
});

redraw();
