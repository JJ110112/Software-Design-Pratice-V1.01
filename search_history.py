import os
import glob
import shutil

history_path = os.path.expanduser(r'~\AppData\Roaming\Code\User\History')
if not os.path.exists(history_path):
    print("No VS Code History folder.")
else:
    files = glob.glob(os.path.join(history_path, '**', '*'), recursive=True)
    found = False
    best_file = None
    best_mtime = 0
    for file in files:
        if os.path.isfile(file):
            try:
                # Need to read as UTF-8
                with open(file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'const QUIZ_DATA =' in content and '"Q5": {' in content and 'bug_tests: [' in content:
                        mtime = os.path.getmtime(file)
                        if mtime > best_mtime:
                            best_mtime = mtime
                            best_file = file
                        found = True
            except Exception:
                pass
                
    if found:
        print(f"FOUND BEST RECOVERY: {best_file}")
        shutil.copy(best_file, 'js/quiz_data.js.recovered')
        print("COPIED to js/quiz_data.js.recovered")
    else:
        print("Could not find any intact quiz_data.js backups in VS Code History.")
