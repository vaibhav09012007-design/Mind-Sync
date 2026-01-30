import os
import glob
import re

directory = r"C:\Users\Vaibhav\Workspace\Mind-Sync\testsprite_tests"
pattern = os.path.join(directory, "*.py")

# Issues to fix:
# 1. Malformed URLs: "http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync"" -> "http://localhost:3000/"
# 2. Markdown code blocks: ``` -> (remove line)

bad_url_pattern = r'http://localhost:3000/["\']C:[^"\']*["\']'
good_url = 'http://localhost:3000/'

count_url = 0
count_markdown = 0

for filepath in glob.glob(pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    modified = False

    for line in lines:
        # Fix 2: Remove lines with ```
        if '```' in line:
            modified = True
            count_markdown += 1
            continue

        # Fix 1: Fix URLs
        if 'localhost:3000' in line and 'C:' in line:
            # Simple replace first
            if '"http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""' in line:
                 line = line.replace('"http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""', '"http://localhost:3000/"')
                 modified = True
                 count_url += 1
            elif 'http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync"' in line:
                 line = line.replace('http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync"', 'http://localhost:3000/')
                 modified = True
                 count_url += 1
            # Regex fallback
            elif re.search(bad_url_pattern, line):
                line = re.sub(bad_url_pattern, good_url, line)
                modified = True
                count_url += 1

        new_lines.append(line)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed {os.path.basename(filepath)}")

print(f"Total URL fixes: {count_url}")
print(f"Total Markdown lines removed: {count_markdown}")
