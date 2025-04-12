// frontend/preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let nextWordGroups = [];
let currentPhraseLength = 0; // Track words in current phrase

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
            const text = sceneRef.add.text(x, y, word === '{Blank}' ? '' : word, { fontSize: '15px', color: '#000000' }).setOrigin(0.5);
            rowBlocks.push(block);
            rowTexts.push(text);
        }
        previewBlocks.push(rowBlocks);
        previewTexts.push(rowTexts);
    }
}

function updatePreview() {
    console.log(`Updating preview, dropIndex: ${dropIndex}, currentWordGroups: ${currentWordGroups.length}, nextWordGroups: ${nextWordGroups.length}`);
    const upcomingGroups = [];
    let remainingCurrent = currentWordGroups.slice(dropIndex + 1);

    // Show only current phrase's remaining groups
    while (upcomingGroups.length < PREVIEW_ROWS && remainingCurrent.length > 0) {
        upcomingGroups.push(remainingCurrent.shift());
    }

    // Fill with blanks if not enough
    while (upcomingGroups.length < PREVIEW_ROWS) {
        upcomingGroups.push(Array(PREVIEW_COLS).fill({ pos: 'Blank', word: '{Blank}' }));
    }

    // Render grid
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        const group = upcomingGroups[i];
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const wordIndex = j % (group.length || 1);
            const { pos, word } = group[wordIndex] || { pos: 'Blank', word: '{Blank}' };
            const color = getColorForPos(pos);
            previewBlocks[i][j].setFillStyle(color);
            previewTexts[i][j].setText(word === '{Blank}' ? '' : word);
        }
    }
}

function generateInitialWordGroups(allPhrases) {
    currentWordGroups = createLevelWordGroups(allPhrases);
    nextWordGroups = []; // Empty until last word
    dropIndex = 0;
    currentPhraseLength = currentWordGroups.reduce((sum, group) => sum + group.length, 0);
    console.log(`Initial phrase length: ${currentPhraseLength}`);
}

function createLevelWordGroups(allPhrases) {
    const numPhrases = 1; // Levels 1–3 use 1 phrase
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
        const paired = phrase.map((word, idx) => ({ word, pos: posTags[idx] || 'Other' }));
        selected.push(shuffle(paired));
    }

    const wordGroups = [];
    const numGroups = selected[0].length; // One group per word
    for (let i = 0; i < numGroups; i++) {
        const wordData = selected[0][i];
        wordGroups.push([wordData]);
    }
    return wordGroups;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}