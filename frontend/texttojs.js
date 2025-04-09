const fs = require('fs');

// Read the text file
const text = fs.readFileSync('ListeDesPhrase.txt', 'utf8');

// Split into lines and words
const phrases = text.split('\n').map(line => line.trim().split(' '));

// Save as JSON
fs.writeFileSync('phrases.json', JSON.stringify(phrases, null, 2));