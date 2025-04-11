// preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let nextWordGroups = [];

function drawPreviewFrame(graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    for (let i = 0; i <= PREVIEW_ROWS; i++) {
        graphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
        graphics.lineTo(PREVIEW_X + PREVIEW_COLS * BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
    }
    for (let j = 0; j <= PREVIEW_COLS; j++) {
        graphics.moveTo(PREVIEW_X + j * BLOCK_WIDTH, PREVIEW_Y);
        graphics.lineTo(PREVIEW_X + j * BLOCK_WIDTH, PREVIEW_Y + PREVIEW_ROWS * BLOCK_HEIGHT);
    }
    graphics.strokePath();
}

function updatePreview() {
    const upcomingGroups = [];
    let remainingCurrent = currentWordGroups.slice(dropIndex + 1); // Groups after the current one
    let remainingNext = [...nextWordGroups];

    // Collect the next 4 groups
    while (upcomingGroups.length < PREVIEW_ROWS && (remainingCurrent.length > 0 || remainingNext.length > 0)) {
        if (remainingCurrent.length > 0) {
            upcomingGroups.push(remainingCurrent.shift());
        } else if (remainingNext.length > 0) {
            upcomingGroups.push(remainingNext.shift());
        }
    }

    // Fill remaining rows with blanks if we don't have enough groups
    while (upcomingGroups.length < PREVIEW_ROWS) {
        upcomingGroups.push(Array(PREVIEW_COLS).fill({ pos: 'Blank', word: '{Blank}' }));
    }

    // Update each row with the corresponding group
    for (let i = 0; i < PREVIEW_ROWS; i++) {
        const group = upcomingGroups[i];
        for (let j = 0; j < PREVIEW_COLS; j++) {
            const { pos, word } = group[j] || { pos: 'Blank', word: '{Blank}' };
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
        const phrase = selected[0];
        for (let i = 0; i < 8; i++) {
            const wordData = phrase[i % phrase.length];
            wordGroups.push([wordData]);
        }
    } else {
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