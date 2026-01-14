import json
import os
import google.generativeai as genai
from pathlib import Path
import logging
from typing import List, Dict, Tuple, Optional
from dotenv import load_dotenv

# Load environment variables from .env file in project root
# Look for .env in the project root (two levels up from this script)
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('phrase_validation.log'),
        logging.StreamHandler()
    ]
)

# Constants
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
    raise ValueError(
        "GEMINI_API_KEY not found or not set. "
        "Please add your API key to the .env file in the project root. "
        "Get your key at: https://aistudio.google.com/app/apikey"
    )

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
MODEL = genai.GenerativeModel('gemini-1.5-flash')
VALID_POS_TAGS = [
    "Articles",
    "Noms",
    "Verbes",
    "Adjectifs",
    "Adverbes",
    "Pronoms",
    "Prépositions",
    "Other"
]

class PhraseValidator:
    def __init__(self):
        self.script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.input_path = self.script_dir / "phrases.json"
        self.output_path = self.script_dir / "corrected_phrases.json"
        self.corrected_phrases = []

    def load_input_phrases(self) -> List[Dict]:
        """Load phrases from input file."""
        try:
            with open(self.input_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Filter out malformed entries
                valid_phrases = []
                for item in data:
                    # Check if it's a dictionary with required keys
                    if isinstance(item, dict) and 'phrase' in item and 'pos' in item:
                        # Check if phrase is a list of strings
                        if isinstance(item['phrase'], list) and len(item['phrase']) == 8:
                            valid_phrases.append(item)
                logging.info(f"Found {len(valid_phrases)} valid phrases out of {len(data)} total")
                return valid_phrases
        except Exception as e:
            logging.error(f"Error loading input phrases: {e}")
            return []

    def load_corrected_phrases(self) -> List[Dict]:
        """Load existing corrected phrases."""
        try:
            if self.output_path.exists():
                with open(self.output_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logging.error(f"Error loading corrected phrases: {e}")
            return []

    def get_processed_phrases(self) -> set:
        """Get a set of processed phrases for quick lookup."""
        corrected = self.load_corrected_phrases()
        return {' '.join(item['phrase']) for item in corrected}

    def ask_gemini(self, prompt: str) -> Optional[str]:
        try:
            response = MODEL.generate_content(prompt)
            return response.text
        except Exception as e:
            logging.error(f"Gemini API error: {e}")
            return None

    def check_phrase_makes_sense(self, phrase: List[str]) -> bool:
        prompt = f"""Analyze this French phrase: '{' '.join(phrase)}'
Is this a grammatically correct and meaningful French phrase? Answer only YES or NO."""
        
        response = self.ask_gemini(prompt)
        return response and "yes" in response.lower()

    def validate_pos_tags(self, phrase: List[str], current_pos: List[str]) -> Tuple[bool, Optional[List[str]]]:
        pos_tags_str = ', '.join([f"'{word}': {tag}" for word, tag in zip(phrase, current_pos)])
        
        prompt = f"""Analyze the POS (Part of Speech) tags for this French phrase:
Phrase: '{' '.join(phrase)}'
Current POS tags: {pos_tags_str}

Valid POS tags are:
- Articles (for le, la, les, un, une, des, etc.)
- Noms (for nouns like maison, chat, livre, etc.)
- Verbes (for verbs like être, avoir, manger, etc.)
- Adjectifs (for adjectives like grand, petit, beau, etc.)
- Adverbes (for adverbs like bien, vite, souvent, etc.)
- Pronoms (for pronouns like je, tu, il, nous, etc.)
- Prépositions (for prepositions like à, de, dans, pour, etc.)
- Other (for numbers, punctuation, etc.)

For compound words (with hyphens), focus on their main function in the sentence.
For example: 'chien-loup' should be 'Noms', 'carte-cadeau' should be 'Noms'.

Provide the correct tags in this exact format:
word1: tag1
word2: tag2
etc.

Use ONLY the tags from the list above."""

        response = self.ask_gemini(prompt)
        if not response:
            return False, None

        try:
            # Parse the response to extract new tags
            new_tags = []
            word_tag_pairs = {}
            
            # Extract word-tag pairs from response
            for line in response.split('\n'):
                if ':' in line:
                    word, tag = [part.strip() for part in line.split(':')]
                    if tag in VALID_POS_TAGS:
                        word_tag_pairs[word] = tag
            
            # Map the tags to the original phrase words
            for word in phrase:
                # Try to find an exact match first
                if word in word_tag_pairs:
                    new_tags.append(word_tag_pairs[word])
                # If no match found, keep the current tag or use "Other"
                else:
                    idx = phrase.index(word)
                    new_tags.append(current_pos[idx] if idx < len(current_pos) else "Other")
            
            # Only return the new tags if we have the correct number of tags
            if len(new_tags) == len(phrase):
                return True, new_tags
            return False, None
            
        except Exception as e:
            logging.error(f"Error parsing Gemini response for POS tags: {e}")
            return False, None

    def process_phrases(self):
        input_phrases = self.load_input_phrases()
        if not input_phrases:
            logging.error("No valid input phrases found")
            return
        
        processed_phrases = self.get_processed_phrases()
        
        # Load existing corrected phrases
        self.corrected_phrases = self.load_corrected_phrases()
        start_count = len(self.corrected_phrases)
        
        logging.info(f"Found {len(input_phrases)} valid input phrases")
        logging.info(f"Found {start_count} existing processed phrases")
        
        for i, phrase_data in enumerate(input_phrases, 1):
            phrase = phrase_data['phrase']
            phrase_str = ' '.join(phrase)
            
            # Skip if already processed
            if phrase_str in processed_phrases:
                logging.info(f"Skipping phrase {i}: already processed")
                continue
            
            logging.info(f"\nProcessing phrase {i}: {phrase_str}")
            
            # Try to validate and correct POS tags
            is_valid, new_tags = self.validate_pos_tags(phrase, phrase_data['pos'])
            
            if is_valid and new_tags:
                logging.info(f"Processed with tags: {new_tags}")
                self.corrected_phrases.append({
                    "phrase": phrase,
                    "pos": new_tags
                })
                # Save progress every 5 new phrases
                if len(self.corrected_phrases) % 5 == 0:
                    self.save_progress()
            else:
                logging.info(f"Using original POS tags: {phrase_data['pos']}")
                self.corrected_phrases.append({
                    "phrase": phrase,
                    "pos": phrase_data['pos']
                })
                # Save progress every 5 new phrases
                if len(self.corrected_phrases) % 5 == 0:
                    self.save_progress()

        # Final save
        self.save_progress()
        
        # Log summary
        new_phrases = len(self.corrected_phrases) - start_count
        logging.info(f"\nProcessing complete:")
        logging.info(f"Previously processed phrases: {start_count}")
        logging.info(f"Newly processed phrases: {new_phrases}")
        logging.info(f"Total phrases in output: {len(self.corrected_phrases)}")

    def save_progress(self):
        try:
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(self.corrected_phrases, f, ensure_ascii=False, indent=2)
            logging.info(f"Saved {len(self.corrected_phrases)} phrases to {self.output_path}")
        except Exception as e:
            logging.error(f"Error saving progress: {e}")

def main():
    validator = PhraseValidator()
    validator.process_phrases()

if __name__ == "__main__":
    main()
