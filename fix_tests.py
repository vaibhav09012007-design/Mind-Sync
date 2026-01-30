
import os
import glob

directory = r"C:\Users\Vaibhav\Workspace\Mind-Sync\testsprite_tests"
pattern = os.path.join(directory, "*.py")

bad_string = '"http://localhost:3000/"C:/Users/Vaibhav/Workspace/Mind-Sync""'
good_string = '"http://localhost:3000/"'

count = 0
for filepath in glob.glob(pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if bad_string in content:
        new_content = content.replace(bad_string, good_string)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {os.path.basename(filepath)}")
        count += 1

print(f"Total files fixed: {count}")
