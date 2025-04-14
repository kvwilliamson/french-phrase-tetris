import sqlite3
import os

def init_db():
    """Initialize the SQLite database with required tables."""
    db_path = "backend/data/game.db"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Create phrases table
    c.execute('''
        CREATE TABLE IF NOT EXISTS phrases (
            id INTEGER PRIMARY KEY,
            french TEXT NOT NULL,
            english TEXT NOT NULL,
            difficulty INTEGER NOT NULL,
            category TEXT NOT NULL,
            audio_url TEXT
        )
    ''')

    # Create game_states table
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_states (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL,
            lines_cleared INTEGER NOT NULL,
            pieces_placed INTEGER NOT NULL,
            time_played REAL NOT NULL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create user_progress table
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_progress (
            user_id TEXT PRIMARY KEY,
            known_phrases TEXT NOT NULL,
            practice_needed TEXT NOT NULL,
            mastered_phrases TEXT NOT NULL,
            total_games INTEGER NOT NULL,
            best_score INTEGER NOT NULL,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Insert some initial phrases
    initial_phrases = [
        ("Bonjour", "Hello", 1, "Greetings"),
        ("Au revoir", "Goodbye", 1, "Greetings"),
        ("S'il vous plaît", "Please", 1, "Courtesy"),
        ("Merci beaucoup", "Thank you very much", 1, "Courtesy"),
        ("Comment allez-vous?", "How are you?", 2, "Conversation"),
    ]

    c.executemany(
        "INSERT OR IGNORE INTO phrases (french, english, difficulty, category) VALUES (?, ?, ?, ?)",
        initial_phrases
    )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")