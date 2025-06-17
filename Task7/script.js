class BackgroundManager {
    constructor() {
        this.backgroundDiv = document.createElement('div');
        this.backgroundDiv.className = 'background';
        document.body.appendChild(this.backgroundDiv);

        // window.addEventListener('resize', this.updateSize.bind(this));

    }


    appendChild(child) {
        this.backgroundDiv.appendChild(child);
    }

    getBoundingRect() {
        return this.backgroundDiv.getBoundingClientRect();
    }
}

class ChildManager {
    constructor(backgroundManager) {
        this.childDiv = document.createElement('div');
        this.childDiv.className = 'child';
        this.childDiv.textContent = 'Child!';
        this.offsetX = 0;
        this.offsetY = 0;
        this.backgroundManager = backgroundManager;

        this.childDiv.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('resize', this.adjustPositionOnResize.bind(this));
    }

    getElement() {
        return this.childDiv;
    }

    onPointerDown(event) {
        event.preventDefault();

        this.offsetX = event.clientX - this.childDiv.offsetLeft;
        this.offsetY = event.clientY - this.childDiv.offsetTop;

        this.childDiv.setPointerCapture(event.pointerId);
        this.childDiv.style.cursor = 'grabbing';

        this._move = this.onPointerMove.bind(this);
        this._up = this.onPointerUp.bind(this);

        this.childDiv.addEventListener('pointermove', this._move);
        this.childDiv.addEventListener('pointerup', this._up);
    }

    onPointerMove(event) {
        const bounds = this.backgroundManager.getBoundingRect();
        const newX = event.clientX - this.offsetX;
        const newY = event.clientY - this.offsetY;

        const maxX = bounds.width - this.childDiv.offsetWidth;
        const maxY = bounds.height - this.childDiv.offsetHeight;

        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));

        this.childDiv.style.left = `${clampedX}px`;
        this.childDiv.style.top = `${clampedY}px`;
    }

    onPointerUp(event) {
        this.childDiv.releasePointerCapture(event.pointerId);
        this.childDiv.removeEventListener('pointermove', this._move);
        this.childDiv.removeEventListener('pointerup', this._up);
        this.childDiv.style.cursor = 'grab';
    }

    adjustPositionOnResize() {
        const bounds = this.backgroundManager.getBoundingRect();
        const maxX = bounds.width - this.childDiv.offsetWidth;
        const maxY = bounds.height - this.childDiv.offsetHeight;
        console.log(bounds.width, window.innerWidth, this.childDiv.offsetWidth)
        let currentX = parseFloat(this.childDiv.style.left)
        let currentY = parseFloat(this.childDiv.style.top)

        const clampedX = Math.max(0, Math.min(currentX, maxX));
        const clampedY = Math.max(0, Math.min(currentY, maxY));

        this.childDiv.style.left = `${clampedX}px`;
        this.childDiv.style.top = `${clampedY}px`;
    }
}

// Bootstrap
const background = new BackgroundManager();
const child = new ChildManager(background);
background.appendChild(child.getElement());
const background2 = new BackgroundManager();
const child2 = new ChildManager(background2);

background2.appendChild(child2.getElement());
const background3 = new BackgroundManager();
const child3 = new ChildManager(background3);
background3.appendChild(child3 .getElement());
const background4 = new BackgroundManager();
const child4 = new ChildManager(background4);

background4.appendChild(child4.getElement());