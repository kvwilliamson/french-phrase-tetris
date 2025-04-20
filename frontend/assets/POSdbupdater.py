import spacy
import re
import json
import logging
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", category=UserWarning, module="spacy")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("pos_updater.log"),
        logging.StreamHandler()
    ]
)

try:
    nlp = spacy.load("fr_core_news_sm")
    print("Successfully loaded French language model")
except Exception as e:
    print(f"Error loading French language model: {e}")
    exit(1)

class POSDBUpdater:
    def __init__(self, input_path="phrases.json", output_path="phrases_with_pos.json"):
        self.input_path = Path(input_path)
        self.output_path = Path(output_path)
        self.phrases = []
        print(f"Initializing with input path: {self.input_path}")
        print(f"Output will be saved to: {self.output_path}")
        self.load_phrases()
        self.pos_map = {
            "DET": "Articles",
            "NOUN": "Noms",
            "VERB": "Verbes",
            "ADJ": "Adjectifs",
            "ADV": "Adverbes",
            "PRON": "Pronoms",
            "ADP": "Prépositions",
            "SCONJ": "Conjonctions",
            "CCONJ": "Conjonctions",
            "AUX": "Verbes",
            "PUNCT": "Other",
            "INTJ": "Other",
            "X": "Other",
            "NUM": "Other",
            "PROPN": "Noms"
        }

    def load_phrases(self):
        try:
            if self.input_path.exists():
                with open(self.input_path, "r", encoding="utf-8") as f:
                    self.phrases = json.load(f)
                print(f"Loaded {len(self.phrases)} phrases")
            else:
                print(f"No phrases.json found at {self.input_path}")
                exit(1)
        except json.JSONDecodeError as e:
            print(f"Failed to load phrases.json: {e}")
            exit(1)

    def get_pos_for_phrase(self, tokens):
        """Get POS tags for a list of tokens."""
        # Join tokens into a single string
        text = " ".join(tokens)
        
        # Process the text
        doc = nlp(text)
        
        # Initialize POS tags list
        pos_tags = []
        
        # Process each token in the original phrase
        for token in tokens:
            # Handle punctuation directly
            if token in ".,!?":
                pos_tags.append("Other")
                continue
                
            # Find the corresponding token in spaCy doc
            # Use the most common POS tag for compound words
            if "-" in token or "'" in token:
                # For compound words, use the POS of the first part
                first_part = token.split("-")[0].split("'")[0]
                matching_tokens = [t for t in doc if t.text.lower() == first_part.lower()]
                if matching_tokens:
                    pos_tags.append(self.pos_map.get(matching_tokens[0].pos_, "Other"))
                else:
                    pos_tags.append("Other")
            else:
                matching_tokens = [t for t in doc if t.text.lower() == token.lower()]
                if matching_tokens:
                    pos_tags.append(self.pos_map.get(matching_tokens[0].pos_, "Other"))
                else:
                    pos_tags.append("Other")
        
        return pos_tags

    def process_phrases(self):
        print("\nProcessing phrases...")
        updated_phrases = []
        success_count = 0
        
        for i, phrase in enumerate(self.phrases, 1):
            tokens = phrase if isinstance(phrase, list) else phrase.get("phrase", [])
            try:
                pos_tags = self.get_pos_for_phrase(tokens)
                updated_phrases.append({
                    "phrase": tokens,
                    "pos": pos_tags
                })
                success_count += 1
                if i % 10 == 0:  # Progress indicator every 10 phrases
                    print(f"Processed {i} phrases...")
            except Exception as e:
                print(f"Failed: {' '.join(tokens)}")
                # Still add the phrase with default POS tags
                updated_phrases.append({
                    "phrase": tokens,
                    "pos": ["Other"] * len(tokens)
                })
        
        # Save updated phrases
        try:
            print(f"\nAttempting to save {len(updated_phrases)} phrases...")
            print(f"Writing to: {self.output_path.absolute()}")
            
            # Save to new file
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(updated_phrases, f, ensure_ascii=False, indent=2)
            print(f"Successfully processed {success_count} phrases")
            print(f"Total phrases saved: {len(updated_phrases)}")
            print(f"Results saved to: {self.output_path}")
            
        except Exception as e:
            print(f"Error saving updated phrases: {e}")
            print(f"Current working directory: {Path.cwd()}")
            return False
        
        return True

def main():
    updater = POSDBUpdater()
    updater.process_phrases()

if __name__ == "__main__":
    main()
