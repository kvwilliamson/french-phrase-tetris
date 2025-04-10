// preview.js
let previewBlocks = [];
let previewTexts = [];
let currentWordGroups = [];
let nextWordGroups = [];

function drawPreviewFrame(graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0xffffff);
    for (let i = 0; i <= PREVIEW_WORDS; i++) {
        graphics.moveTo(PREVIEW_X, PREVIEW_Y + i * BLOCK_HEIGHT);
        graphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + i * BLOCK_HEIGHT);
    }
    graphics.moveTo(PREVIEW_X, PREVIEW_Y);
    graphics.lineTo(PREVIEW_X, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    graphics.moveTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y);
    graphics.lineTo(PREVIEW_X + BLOCK_WIDTH, PREVIEW_Y + PREVIEW_WORDS * BLOCK_HEIGHT);
    graphics.strokePath();
}

function updatePreview(group) {
    for (let i = 0; i < PREVIEW_WORDS; i++) {
        const { pos, word } = group[i];
        const color = getColorForPos(pos);
        console.log(`Updating preview block ${i}: word=${word}, pos=${pos}, color=${color.toString(16)}`);
        previewBlocks[i].setFillStyle(color);
        previewTexts[i].setText(word === '{Blank}' ? '' : word);
    }
}

function generateInitialWordGroups(allPhrases) {
    const shuffledPhrases = selectAndShufflePhrases(allPhrases);
    currentWordGroups = createWordGroups(shuffledPhrases);
    const nextShuffledPhrases = selectAndShufflePhrases(allPhrases);
    nextWordGroups = createWordGroups(nextShuffledPhrases);
    dropIndex = 0;
}

function selectAndShufflePhrases(allPhrases) {
    if (!allPhrases || !Array.isArray(allPhrases)) {
        console.error('allPhrases is not defined or not an array:', allPhrases);
        return [];
    }
    const selected = [];
    const indices = [];
    while (indices.length < 4) {
        const index = Math.floor(Math.random() * allPhrases.length);
        if (!indices.includes(index)) indices.push(index);
    }
    for (let i = 0; i < 4; i++) {
        const phraseData = allPhrases[indices[i]];
        if (!phraseData || !phraseData.phrase || !phraseData.pos) {
            console.error('Invalid phrase data at index', indices[i], ':', phraseData);
            continue;
        }
        const phrase = phraseData.phrase;
        const posTags = phraseData.pos;
        const paired = phrase.map((word, idx) => ({ word, pos: posTags[idx] }));
        selected.push(shuffle(paired));
    }
    return selected;
}

function createWordGroups(shuffledPhrases) {
    const wordGroups = [];
    for (let i = 0; i < 8; i++) {
        const group = [];
        for (let j = 0; j < 4; j++) {
            const { word, pos } = shuffledPhrases[j][i];
            group.push({ pos, word });
        }
        wordGroups.push(group);
    }
    return wordGroups;
}