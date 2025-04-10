// constants.js
const posColors = {
    'Articles': 0xFFF9B0,     // Pastel Yellow (e.g., "le", "la")
    'Noms': 0xA3BFFA,         // Pastel Blue (e.g., "chien")
    'Pronoms': 0xBFDFFF,      // Lighter Pastel Blue (e.g., "je", "tu")
    'Verbes': 0xA8D5BA,       // Pastel Green (e.g., "marche")
    'Adverbes': 0xC2E8C6,     // Lighter Pastel Green (e.g., "bien")
    'Adjectifs': 0xFFE4B5,    // Pastel Peach (e.g., "joli")
    'Prépositions': 0xFFCC99, // Pastel Orange (e.g., "avec")
    'Other': 0xE6E6FA,        // Lavender (e.g., "et", "ou")
    'Blank': 0xD3D3D3         // Light Gray (e.g., "{Blank}")
};

const BLOCK_WIDTH = 150;
const BLOCK_HEIGHT = 20;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 20;
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_WIDTH;
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_HEIGHT;
let GRID_START_X; // Will be set dynamically in GameScene
const GRID_START_Y = 340;

let PREVIEW_X; // Will be set dynamically
const PREVIEW_Y = 120;
const PREVIEW_WORDS = 4;

const MOVE_DELAY = 100;