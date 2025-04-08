from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "French Phrase Tetris Backend"}