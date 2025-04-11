// utils.js
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getColorForPos(pos) {
    switch (pos) {
        case 'Articles':
        case 'Article':
            return COLOR_ARTICLES;
        case 'Noms':
        case 'Nom':
            return COLOR_NOMS;
        case 'Pronoms':
        case 'Pronom':
            return COLOR_PRONOMS;
        case 'Verbes':
        case 'Verbe':
            return COLOR_VERBES;
        case 'Adverbes':
        case 'Adverbe':
            return COLOR_ADVERBES;
        case 'Adjectifs':
        case 'Adjectif':
            return COLOR_ADJECTIFS;
        case 'Prépositions':
        case 'Préposition':
            return COLOR_PREPOSITIONS;
        case 'Other':
            return COLOR_OTHER;
        case 'Blank':
        default:
            return COLOR_BLANK;
    }
}
