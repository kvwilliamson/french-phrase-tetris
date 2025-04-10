// preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let nextWordGroups = [];

function drawPreviewFrame(graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    // Draw horizontal lines (rows)
    for (let i = 0; i <= PREVIEW_ROWS; i++) {
        graphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
        graphics.lineTo(PREVIEW_X + PREVIEW_COLS * BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
    }
    // Draw vertical lines (columns) based on PREVIEW_COLS (matches level)
    for (let j = 0; j <= PREVIEW_COLS; j++) {
        graphics.moveTo(PREVIEW_X + j * BLOCK_WIDTH, PREVIEW_Y);
        graphics.lineTo(PREVIEW_X + j * BLOCK_WIDTH, PREVIEW_Y + PREVIEW_ROWS * BLOCK_HEIGHT);
    }
    graphics.strokePath();
}

function updatePreview(group) {
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const idx = i * PREVIEW_COLS + j;
            const { pos, word } = group[idx] || { pos: 'Blank', word: '{Blank}' };
            const color = getColorForPos(pos);
            previewBlocks[i][j].setFillStyle(color);
            previewTexts[i][j].setText(word === '{Blank}' ? '' : word);
        }
    }
}

function generateInitialWordGroups(allPhrases) {
    currentWordGroups = createLevelWordGroups(allPhrases);
    nextWordGroups = createLevelWordGroups(allPhrases);
    dropIndex = 0;
}

function createLevelWordGroups(allPhrases) {
    const numPhrases = level;
    const selected = [];
    const indices = [];
    while (indices.length < numPhrases) {
        const index = Math.floor(Math.random() * allPhrases.length);
        if (!indices.includes(index)) indices.push(index);
    }
    for (let i = 0; i < numPhrases; i++) {
        const phraseData = allPhrases[indices[i]];
        const phrase = phraseData.phrase;
        const posTags = phraseData.pos;
        const paired = phrase.map((word, idx) => ({ word, pos: posTags[idx] }));
        selected.push(shuffle(paired));
    }

    const wordGroups = [];
    if (level === 1) {
        // For Level 1, use one phrase and create 8 blocks of 1 word each
        const phrase = selected[0];
        for (let i = 0; i < 8; i++) {
            const wordData = phrase[i % phrase.length];
            wordGroups.push([wordData]);
        }
    } else {
        // For Levels 2-4, combine words from multiple phrases
        for (let i = 0; i < 8; i++) {
            const group = [];
            for (let j = 0; j < numPhrases; j++) {
                const wordData = selected[j][i] || { word: '{Blank}', pos: 'Blank' };
                group.push(wordData);
            }
            wordGroups.push(group);
        }
    }
    return wordGroups;
}