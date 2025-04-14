import spacy
import json
import logging
from pathlib import Path
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("pos_tagging.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Log current working directory
logger.info(f"Current working directory: {os.getcwd()}")

# Load spaCy model
try:
    nlp = spacy.load("fr_core_news_sm")
    logger.info("Loaded fr_core_news_sm model")
except OSError:
    logger.warning("Falling back to fr_core_news_sm...")
    nlp = spacy.load("fr_core_news_sm")

# Define POS mapping
POS_MAPPING = {
    "DET": "Articles",
    "NOUN": "Noms",
    "VERB": "Verbes",
    "ADJ": "Adjectifs",
    "ADV": "Adverbes",
    "PRON": "Pronoms",
    "ADP": "Prépositions",
    "AUX": "Verbes",
    "CCONJ": "Other",
    "SCONJ": "Other",
    "NUM": "Other",
    "PART": "Other",
    "INTJ": "Other",
    "PROPN": "Noms",
    "PUNCT": "Other",
    "SYM": "Other",
    "X": "Other",
}


def load_phrases(file_path):
    """Load phrases from JSON file."""
    try:
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return []
        with open(file_path, "r", encoding="utf-8") as f:
            phrases = json.load(f)
        logger.info(f"Loaded {len(phrases)} entries from {file_path}")
        return phrases
    except Exception as e:
        logger.error(f"Failed to load phrases from {file_path}: {str(e)}")
        return []


def normalize_token(token):
    """Normalize token to handle apostrophes."""
    return token.replace("'", "'")


def recombine_tokens(tokens, pos_tags, input_words):
    """
    Recombine spaCy tokens to match input phrase, preserving POS tags.
    Handles elisions, contractions, hyphens, clitics, and question markers.
    """
    recombined_tokens = []
    recombined_pos = []
    i = 0
    input_words_normalized = [normalize_token(w) for w in input_words]

    while i < len(tokens):
        current = normalize_token(tokens[i])
        current_pos = pos_tags[i]

        # Handle elisions and contractions (e.g., "j'", "C'", "L'")
        if i + 1 < len(tokens) and current in {
            "J'",
            "s'",
            "l'",
            "d'",
            "n'",
            "c'",
            "t'",
            "m'",
            "qu'",
            "C'",
            "T'",
            "L'",
            "Qu'",
        }:
            next_token = normalize_token(tokens[i + 1])
            # Try specific contractions
            if current == "j'" and next_token in {
                "ai",
                "y",
                "entends",
                "appelle",
                "attendais",
                "suis",
            }:
                combined = "j'" + next_token
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 1])  # Use verb's POS
                i += 2
                continue
            if current == "L'" and next_token in {"habit", "eau"}:
                combined = "L'" + next_token
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 1])  # Use noun's POS
                i += 2
                continue
            if current == "C'" and next_token == "est":
                combined = "C'est"
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 1])  # Use verb's POS
                i += 2
                continue
            # General elision check
            combined = current + next_token
            if combined in input_words_normalized:
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 1])
                i += 2
                continue

        # Handle hyphens (e.g., "cerf-volant", "allez-vous")
        if i + 2 < len(tokens) and tokens[i + 1] == "-":
            next_token = normalize_token(tokens[i + 2])
            combined = current + "-" + next_token
            if combined in input_words_normalized or combined == "allez-vous":
                recombined_tokens.append(combined)
                recombined_pos.append(current_pos)  # Keep first token's POS
                i += 3
                continue

        # Handle clitics (e.g., "dit-on", "paraît-il")
        if i + 1 < len(tokens) and current + "-on" == normalize_token(tokens[i] + tokens[i + 1]):
            combined = current + "-on"
            if combined in input_words_normalized:
                recombined_tokens.append(combined)
                recombined_pos.append(current_pos)
                i += 2
                continue
        if i + 1 < len(tokens) and current + "-il" == normalize_token(tokens[i] + tokens[i + 1]):
            combined = current + "-il"
            if combined in input_words_normalized:
                recombined_tokens.append(combined)
                recombined_pos.append(current_pos)
                i += 2
                continue

        # Handle complex phrases (e.g., "s'il-te-plaît")
        if (
            i + 5 < len(tokens)
            and current == "s'"
            and normalize_token(tokens[i + 1]) == "il"
            and tokens[i + 2] == "-"
            and normalize_token(tokens[i + 3]) == "te"
            and tokens[i + 4] == "-"
            and normalize_token(tokens[i + 5]) == "plaît"
        ):
            combined = "s'il-te-plaît"
            if combined in input_words_normalized:
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 5])
                i += 6
                continue

        # Handle "quelqu'un"
        if i + 1 < len(tokens) and current == "quelqu'" and normalize_token(tokens[i + 1]) == "un":
            combined = "quelqu'un"
            if combined in input_words_normalized:
                recombined_tokens.append(combined)
                recombined_pos.append(pos_tags[i + 1])
                i += 2
                continue

        recombined_tokens.append(current)
        recombined_pos.append(current_pos)
        i += 1

    return recombined_tokens, recombined_pos


def validate_and_tag_phrase(phrase):
    """
    Validate a phrase and assign POS tags, keeping final punctuation once.
    Returns None if invalid, else a dict with phrase and POS tags.
    """
    try:
        # Skip empty phrases
        if not phrase or phrase == [""]:
            logger.warning(f"Skipping empty phrase: {phrase}")
            return None

        # Store original phrase and normalize
        original_phrase = [normalize_token(w) for w in phrase]
        text = " ".join(original_phrase)
        logger.debug(f"Processing phrase: {text}")

        # Process with spaCy
        doc = nlp(text)

        # Collect tokens and POS tags, excluding punctuation
        tokens = []
        pos_tags = []
        for token in doc:
            if token.pos_ == "PUNCT":
                continue
            mapped_pos = POS_MAPPING.get(token.pos_, "Other")
            tokens.append(token.text)
            pos_tags.append(mapped_pos)

        # Log raw spaCy tags
        logger.debug(f"Raw spaCy tags: {[(token.text, token.pos_) for token in doc]}")

        # Handle final punctuation
        final_punct = None
        if original_phrase and original_phrase[-1] in {".", "?", "!"}:
            final_punct = original_phrase[-1]
            input_words = original_phrase[:-1]
        else:
            input_words = original_phrase

        # Recombine tokens to match input
        recombined_tokens, recombined_pos = recombine_tokens(tokens, pos_tags, input_words)

        # Add final punctuation if present
        if final_punct:
            recombined_tokens.append(final_punct)
            recombined_pos.append("Other")

        # Validate tokens
        tokens_without_punct = [t for t in recombined_tokens if t not in {".", "?", "!"}]
        input_words_normalized = [normalize_token(w) for w in input_words]
        if tokens_without_punct != input_words_normalized:
            logger.warning(f"Token mismatch in phrase {original_phrase}: got {recombined_tokens}")
            logger.debug(
                f"Expected (w/o punct): {input_words_normalized}, "
                f"Got (w/o punct): {tokens_without_punct}"
            )
            # Relax validation: accept if lengths match
            if len(tokens_without_punct) == len(input_words_normalized):
                logger.info(f"Accepting phrase with minor mismatch: {original_phrase}")
            else:
                return None

        logger.debug(f"Phrase: {recombined_tokens}, POS: {recombined_pos}")

        return {"phrase": recombined_tokens, "pos": recombined_pos}
    except Exception as e:
        logger.error(f"Error processing phrase {original_phrase}: {str(e)}")
        return None


def main():
    # File paths
    input_path = Path("phrases.json")
    output_path = Path("phrase.json")

    # Log file path attempt
    logger.info(f"Looking for phrases.json at: {input_path.absolute()}")

    # Load phrases
    phrases = load_phrases(input_path)
    if not phrases:
        logger.error("No phrases loaded. Exiting.")
        return

    # Process phrases
    valid_phrases = []
    for phrase in phrases:
        result = validate_and_tag_phrase(phrase)
        if result:
            valid_phrases.append(result)
        else:
            logger.error(f"Invalid phrase skipped: {phrase}")

    # Write output
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(valid_phrases, f, ensure_ascii=False, indent=2)
        logger.info(f"Wrote {len(valid_phrases)} phrases to {output_path}")
    except Exception as e:
        logger.error(f"Failed to write output to {output_path}: {str(e)}")


if __name__ == "__main__":
    main()
