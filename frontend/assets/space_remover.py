import os

# Get the full path to the input file
script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, 'ListeDesPhrase.txt')

# Read the file content
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process each line separately
cleaned_lines = []
for line in lines:
    # First, clean up spaces before {Blank}
    line = line.replace('  {Blank}', ' {Blank}')
    # Then handle any remaining multiple spaces
    cleaned_line = ' '.join(line.split())
    cleaned_lines.append(cleaned_line + '\n')

# Write back to the file
with open(input_file, 'w', encoding='utf-8') as f:
    f.writelines(cleaned_lines)

print(f"Removed double spaces from {input_file} while preserving line breaks")
