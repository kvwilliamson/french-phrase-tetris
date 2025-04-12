// constants.js
const GRID_WIDTH = 8;
const GRID_HEIGHT = 20;
const BLOCK_WIDTH = 150;
const BLOCK_HEIGHT = 20;
const GRID_WIDTH_PX = GRID_WIDTH * BLOCK_WIDTH;
const GRID_HEIGHT_PX = GRID_HEIGHT * BLOCK_HEIGHT;
let GRID_START_X = 0;
const GRID_START_Y = 340;
const PREVIEW_X = 200;
const PREVIEW_Y = 190;
let PREVIEW_COLS = 1;
let PREVIEW_ROWS = 7;
let PREVIEW_WORDS = 1;
const MOVE_DELAY = 100;
let level = 1;

// Color constants for parts of speech
const COLOR_ARTICLES = 0xFFF9B0;      // Light yellow
const COLOR_NOMS = 0xA3BFFA;          // Light blue
const COLOR_PRONOMS = 0xBFDFFF;       // Lighter blue
const COLOR_VERBES = 0x8AB89A;        // Darker green
const COLOR_ADVERBES = 0xD4F0D8;      // Lighter green
const COLOR_ADJECTIFS = 0xFFB6C1;     // Pastel pink
const COLOR_PREPOSITIONS = 0xFFCC99;  // Light peach
const COLOR_OTHER = 0xD8BFD8;         // Darker lavender
const COLOR_BLANK = 0xE0E0E0;         // Lighter gray
