import json
import os
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class PhraseDBDeduplicator:
    def __init__(self):
        self.script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.input_path = self.script_dir / 'phrases.json'
        self.output_path = self.script_dir / 'cleaned_phrases.json'
        self.phrases = []
        self.unique_phrases = {}  # Dictionary to track unique phrases

    def load_phrases(self):
        """Load phrases from input file."""
        try:
            with open(self.input_path, 'r', encoding='utf-8') as f:
                self.phrases = json.load(f)
            logging.info(f"Loaded {len(self.phrases)} phrases from {self.input_path}")
            return True
        except Exception as e:
            logging.error(f"Error loading phrases: {e}")
            return False

    def save_phrases(self, phrases_to_save):
        """Save phrases to output file."""
        try:
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(phrases_to_save, f, ensure_ascii=False, indent=2)
            logging.info(f"Saved {len(phrases_to_save)} phrases to {self.output_path}")
            return True
        except Exception as e:
            logging.error(f"Error saving phrases: {e}")
            return False

    def remove_duplicates(self):
        """Remove duplicate phrases from the database."""
        if not self.load_phrases():
            return

        # Dictionary to store unique phrases
        unique_phrases_list = []
        seen_phrases = set()
        duplicates_found = 0

        for phrase_data in self.phrases:
            # Convert phrase list to tuple for hashing
            phrase_tuple = tuple(phrase_data['phrase'])
            
            if phrase_tuple not in seen_phrases:
                seen_phrases.add(phrase_tuple)
                unique_phrases_list.append(phrase_data)
            else:
                duplicates_found += 1
                logging.info(f"Found duplicate phrase: {' '.join(phrase_data['phrase'])}")

        # Save unique phrases
        if self.save_phrases(unique_phrases_list):
            print(f"\nProcessing complete!")
            print(f"Original phrase count: {len(self.phrases)}")
            print(f"Duplicates removed: {duplicates_found}")
            print(f"Final unique phrases: {len(unique_phrases_list)}")
            print(f"Saved to: {self.output_path}")

def main():
    deduplicator = PhraseDBDeduplicator()
    deduplicator.remove_duplicates()

if __name__ == "__main__":
    main()