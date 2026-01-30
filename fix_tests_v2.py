import os
import glob
import re

directory = r"C:\Users\Vaibhav\Workspace\Mind-Sync\testsprite_tests"
pattern = os.path.join(directory, "*.py")

# Regex to match the corrupted URL pattern
# Matches: "http://localhost:3000/"C:/..."" or similar variations
# We want to replace it with "http://localhost:3000/"
url_regex = re.compile(r'"http://localhost:3000/["\']C:.*?(?<!\\)["\']"')
simple_url_regex = re.compile(r'"http://localhost:3000/C:.*?"')

# Regex to match markdown code blocks
markdown_regex = re.compile(r'^\s*```')

count_fixed = 0

for filepath in glob.glob(pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Remove markdown code blocks (```)
    # We do this line by line or regex substitution
    lines = content.split('\n')
    new_lines = [line for line in lines if not markdown_regex.search(line)]
    content = '\n'.join(new_lines)

    # Fix URLs
    # Replace "http://localhost:3000/"C:/..."" with "http://localhost:3000/"
    # The corrupted string often looks like: "http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""
    # which is effectively "http://localhost:3000/" followed by C:/...

    # Strategy: Look for specific bad patterns identified in the logs

    # Pattern 1: "http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""
    content = content.replace('"http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""', '"http://localhost:3000/"')

    # Pattern 2: "http://localhost:3000/C:/Users/Vaibhav/Workspace/Mind-Sync"
    content = content.replace('"http://localhost:3000/C:/Users/Vaibhav/Workspace/Mind-Sync"', '"http://localhost:3000/"')

    # Pattern 3: Single quotes variations if any
    content = content.replace("'http://localhost:3000/\"C:/Users/Vaibhav/Workspace/Mind-Sync\"'", "'http://localhost:3000/'")

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {os.path.basename(filepath)}")
        count_fixed += 1

print(f"Total files fixed: {count_fixed}")
