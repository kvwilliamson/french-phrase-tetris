# French Phrase Tetris 🎮 🇫🇷

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A modern take on the classic Tetris game that helps players learn French while playing. Combine the addictive gameplay of Tetris with French language learning through interactive phrases and audio pronunciation.

## 🌟 Features

- Classic Tetris gameplay with smooth controls and modern graphics
- French phrases appear as word blocks that fall from the top of the screen to be placed in the grid completing a phrase
- Difficulty levels that progressively introduce more complex vocabulary
- Score tracking with language learning achievements
- Cross-platform compatibility

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- FastAPI
- Pydantic
- SQLite3
- Modern web browser with Web Audio API support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kvwilliamson/french-phrase-tetris.git
cd french-phrase-tetris
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Add your Google Cloud API key for text-to-speech
```

5. Initialize the database:
```bash
python scripts/init_db.py
```

6. Start the application:
```bash
uvicorn backend.main:app --reload
```

Visit `http://localhost:8000` to start playing!

## 🎮 Game Controls

- ⬅️ ➡️ : Move piece left/right
- ⬇️ : Speed drop
- SPACE : Hard drop
- P : Pause game
- M : Toggle audio Mute/Unmute

## 🛠️ Technology Stack

### Backend
- FastAPI for REST API
- Pydantic for data validation
- SQLite for data persistence
- Google Cloud Text-to-Speech API
- pytest for testing

### Frontend
- HTML5 Canvas for rendering
- Web Audio API for sound
- LocalStorage for game state
- ES6+ JavaScript
- CSS Grid/Flexbox

## 📈 Performance

- 60 FPS gameplay
- < 100ms audio latency
- Offline-first architecture
- Mobile-responsive design

## 🔒 Security

- CORS protection
- Rate limiting
- Input validation
- Secure headers
- API key authentication

## 📞 Support

For support, email kwilliamson.mail@gmail.com 

## 👥 Contributors

- Lead Developer: [Kelly Williamson](https://github.com/kvwilliamson)
- UI/UX: Kelly Williamson
- French Language Expert: Grok 3 (xAI)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details
