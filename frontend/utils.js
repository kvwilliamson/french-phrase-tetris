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
        case 'Article':
            return COLOR_ARTICLES;
        case 'Nom':
            return COLOR_NOMS;
        case 'Pronom':
            return COLOR_PRONOMS;
        case 'Verbe':
            return COLOR_VERBES;
        case 'Adverbe':
            return COLOR_ADVERBES;
        case 'Adjectif':
        case 'Adjectifs': // Add plural form
            return COLOR_ADJECTIFS;
        case 'Préposition':
            return COLOR_PREPOSITIONS;
        case 'Other':
            return COLOR_OTHER;
        case 'Blank':
        default:
            return COLOR_BLANK;
    }
}