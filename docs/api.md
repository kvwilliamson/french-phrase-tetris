# API Documentation

## Endpoints

### Game API

#### GET /api/phrases
Returns a list of French phrases for the game.

**Parameters:**
- `level` (optional): Difficulty level (1-10)
- `count` (optional): Number of phrases to return

**Response:**
```json
{
  "phrases": [
    {
      "french": "Bonjour le monde",
      "english": "Hello world",
      "difficulty": 1
    }
  ]
}
```

[Additional API documentation...]