// frontend/grid.js
let grid = [];

function initializeGrid() {
    grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
}

function drawGrid(graphics, specificRow = null, lineWidth = 2, color = 0xffffff) {
    graphics.clear();
    graphics.lineStyle(lineWidth, color);

    const startY = specificRow !== null ? specificRow : 0;
    const endY = specificRow !== null ? specificRow + 1 : GRID_HEIGHT;
    const startX = 0;
    const endX = GRID_WIDTH;

    for (let i = startY; i <= endY; i++) {
        graphics.moveTo(GRID_START_X, GRID_START_Y + i * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + GRID_WIDTH_PX, GRID_START_Y + i * BLOCK_HEIGHT);
    }

    for (let j = startX; j <= endX; j++) {
        graphics.moveTo(GRID_START_X + j * BLOCK_WIDTH, GRID_START_Y + startY * BLOCK_HEIGHT);
        graphics.lineTo(GRID_START_X + j * BLOCK_WIDTH, GRID_START_Y + endY * BLOCK_HEIGHT);
    }

    graphics.strokePath();
}

function flashRowGridLines(gridY, scene, callback) {
    const colors = [0xffffff, 0x000000, 0xffffff, 0x000000, 0xffffff, 0x000000];
    const durationPerChange = 1000 / colors.length;
    let index = 0;

    function flashNext() {
        if (index >= colors.length) {
            callback(); // Only call callback, no drawGrid
            return;
        }
        drawGrid(gridGraphics, gridY, 6, colors[index]);
        index++;
        scene.time.addEvent({
            delay: durationPerChange,
            callback: flashNext
        });
    }

    flashNext();
}

window.initializeGrid = initializeGrid;
window.drawGrid = drawGrid;
window.flashRowGridLines = flashRowGridLines;