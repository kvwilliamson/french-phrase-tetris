// frontend/preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let currentPhraseLength = 0;

function drawPreviewFrame(graphics, adjustedPreviewY) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    for (let x = 0; x <= PREVIEW_COLS; x++) {
        graphics.moveTo(PREVIEW_X + x * BLOCK_WIDTH, adjustedPreviewY);
        graphics.lineTo(PREVIEW_X + x * BLOCK_WIDTH, adjustedPreviewY + PREVIEW_ROWS * BLOCK_HEIGHT);
    }
    for (let y = 0; y <= PREVIEW_ROWS; y++) {
        graphics.moveTo(PREVIEW_X, adjustedPreviewY + y * BLOCK_HEIGHT);
        graphics.lineTo(PREVIEW_X + PREVIEW_COLS * BLOCK_WIDTH, adjustedPreviewY + y * BLOCK_HEIGHT);
    }
    graphics.strokePath();
}

function setupPreviewBlocks(adjustedPreviewY) {
    previewBlocks.forEach(row => row.forEach(block => block.destroy()));
    previewTexts.forEach(row => row.forEach(text => text.destroy()));
    previewBlocks = [];
    previewTexts = [];
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        const rowBlocks = [];
        const rowTexts = [];
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const x = PREVIEW_X + j * BLOCK_WIDTH + BLOCK_WIDTH / 2;
            const y = adjustedPreviewY + i * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
            const { pos, word } = { pos: 'Blank', word: '{Blank}' };
            const color = getColorForPos(pos);
            const block = sceneRef.add.rectangle(x, y, BLOCK_WIDTH - 4, BLOCK_HEIGHT - 4, color);
            const text = sceneRef.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: '14px', color: '#000000' }).setOrigin(0.5);
            rowBlocks.push(block);
            rowTexts.push(text);
        }
        previewBlocks.push(rowBlocks);
        previewTexts.push(rowTexts);
    }
}

function updatePreview() {
    console.log(`Updating preview, dropIndex: ${dropIndex}, currentWordGroups: ${currentWordGroups.length}, currentPhrase: ${currentPhrase.join(' ')}`);
    // Start with *next* block after current dropping one
    const upcomingGroups = currentWordGroups.slice(dropIndex + 1);
    const numBlocks = Math.min(upcomingGroups.length, PREVIEW_ROWS);

    for (let i = 0; i < PREVIEW_ROWS; i++) {
        const previewRow = PREVIEW_ROWS - 1 - i; // Bottom-up: row 6 = next
        const groupIndex = i < numBlocks ? i : -1;
        const group = groupIndex >= 0 ? upcomingGroups[groupIndex] : null;
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const { pos, word } = group && group[0] ? group[0] : { pos: 'Blank', word: '{Blank}' };
            const color = getColorForPos(pos);
            previewBlocks[previewRow][j].setFillStyle(color);
            previewTexts[previewRow][j].setText(word === '{Blank}' ? '' : word);
        }
    }
}