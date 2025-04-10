// utils.js
function shuffle(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function validatePhrase(words, allPhrases) {
    console.log('validatePhrase called with words:', words);
    try {
        const rowPhrase = words.join(' ').toLowerCase();
        for (let i = 0; i < allPhrases.length; i++) {
            const phrase = allPhrases[i].phrase.join(' ').toLowerCase();
            if (rowPhrase === phrase) {
                console.log('Valid phrase found:', phrase);
                return true;
            }
        }
        console.log('No valid phrase found for:', rowPhrase);
        return false;
    } catch (error) {
        console.error('Error in validatePhrase:', error);
        return false;
    }
}

function getColorForPos(pos) {
    const normalizedPos = pos
        .trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .charAt(0).toUpperCase() + pos.trim().slice(1).toLowerCase();
    
    console.log(`getColorForPos: original=${pos}, normalized=${normalizedPos}, posColors keys=${Object.keys(posColors).join(', ')}`);
    
    const color = posColors[normalizedPos] || posColors['Other'];
    if (!posColors[normalizedPos]) {
        console.log(`Warning: No color found for ${normalizedPos}, falling back to Other`);
    }
    return color;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    speechSynthesis.speak(utterance);
}