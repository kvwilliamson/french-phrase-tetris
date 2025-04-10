import os
import spacy
import json

# Load the French model
nlp = spacy.load('fr_core_news_sm')

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
phrases_json_path = os.path.join(script_dir, 'phrases.json')

# Load the existing phrases.json
with open(phrases_json_path, 'r', encoding='utf-8') as f:
    phrases = json.load(f)

# Define POS mapping to your categories
pos_mapping = {
    'DET': 'Articles',
    'NOUN': 'Noms',
    'VERB': 'Verbes',
    'ADJ': 'Adjectifs',
    'PRON': 'Pronoms',
    'ADV': 'Adverbes',
    'ADP': 'Prépositions',
}

# Function to check if a word is a word group (contains ' or -)
def is_word_group(word):
    return "'" in word or "-" in word

# Process each phrase and tag the words
updated_phrases = []
for phrase_entry in phrases:
    # Handle both input structures
    if isinstance(phrase_entry, dict) and "phrase" in phrase_entry:
        phrase = phrase_entry["phrase"]
    else:
        phrase = phrase_entry

    # Handle {Blank} entries and word groups first
    pos_tags = []
    for word in phrase:
        if word == '{Blank}':
            pos_tags.append('Blank')
        elif is_word_group(word):
            pos_tags.append('Other')  # Word groups like "J’ai", "Il-y-a" are tagged as "Other"
        else:
            pos_tags.append(None)  # Placeholder for words to be tagged by Spacy

    # Tag the remaining words using Spacy
    # Join the phrase into a string, replacing {Blank} with a placeholder
    phrase_text = ' '.join(word if word != '{Blank}' else '___' for word in phrase)
    doc = nlp(phrase_text)

    # Map Spacy tokens back to the phrase
    token_index = 0
    for i, word in enumerate(phrase):
        if pos_tags[i] is not None:  # Skip pre-tagged words ({Blank}, word groups)
            continue
        while token_index < len(doc) and doc[token_index].text == '___':
            token_index += 1  # Skip placeholder tokens
        if token_index < len(doc):
            token = doc[token_index]
            pos = pos_mapping.get(token.pos_, 'Other')
            pos_tags[i] = pos
            token_index += 1

    # Add the phrase and its POS tags to the updated list
    updated_phrases.append({
        "phrase": phrase,
        "pos": pos_tags
    })

# Save the updated phrases.json
with open(phrases_json_path, 'w', encoding='utf-8') as f:
    json.dump(updated_phrases, f, indent=2, ensure_ascii=False)

print(f"Updated {phrases_json_path} with POS tags for each word.")
