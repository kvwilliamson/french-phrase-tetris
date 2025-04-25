import os

# Get file paths
script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, '7motphrase.txt')
output_file = os.path.join(script_dir, 'cleaned.txt')

# Read all lines
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process lines
seven_word_lines = []
for line in lines:
    # Remove final punctuation and count words
    words = line.strip().rstrip('.!?').split()
    if len(words) == 7:
        seven_word_lines.append(line)

# Write to new file
with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(seven_word_lines)

print(f"Done! Saved {len(seven_word_lines)} lines with exactly 7 words to cleaned.txt")
