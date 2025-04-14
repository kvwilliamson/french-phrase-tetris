import os

# Get file paths
script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, 'cleaned.txt')
output_file = os.path.join(script_dir, 'clean2.txt')

# Read all lines
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process lines
processed_lines = []
for line in lines:
    if line.rstrip().endswith('.'):  # only process lines ending with period
        line = line.rstrip()[:-1]
        line += ' .\n'  # remove period, add space + period + newline
    processed_lines.append(line)

# Write to new file
with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(processed_lines)

print("Done! Added spaces before periods and saved to clean2.txt")
