// frontend/preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let nextWordGroups = [];

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

function updatePreview() {
    console.log(`Updating preview, nextWordGroups length: ${nextWordGroups.length}`);
    const upcomingGroups = [];
    let remainingCurrent = currentWordGroups.slice(dropIndex + 1);
    let remainingNext = [...nextWordGroups];

    while (upcomingGroups.length < PREVIEW_ROWS && (remainingCurrent.length > 0 || remainingNext.length > 0)) {
        if (remainingCurrent.length > 0) {
            upcomingGroups.push(remainingCurrent.shift());
        } else if (remainingNext.length > 0) {
            upcomingGroups.push(remainingNext.shift());
        }
    }

    while (upcomingGroups.length < PREVIEW_ROWS) {
        upcomingGroups.push(Array(PREVIEW_COLS).fill({ pos: 'Blank', word: '{Blank}' }));
    }

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
    const numGroups = 16; // Increased from 8 to ensure more words
    if (level === 1) {
        const phrase = selected[0];
        for (let i = 0; i < numGroups; i++) {
            const wordData = phrase[i % phrase.length];
            wordGroups.push([wordData]);
        }
    } else {
        for (let i = 0; i < numGroups; i++) {
            const group = [];
            for (let j = 0; j < numPhrases; j++) {
                const wordData = selected[j][i % selected[j].length] || { word: '{Blank}', pos: 'Blank' };
                group.push(wordData);
            }
            wordGroups.push(group);
        }
    }
    return wordGroups;
}

function shuffle(array) {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}