import os
import zipfile
from pathlib import Path

def create_zip():
    repo_root = Path(__file__).resolve().parent.parent
    base_dir = repo_root / "tuf-extension"
    zip_path = repo_root / "tuf-gfg-links-v1.0.0.zip"
    
    # Also create extension.zip as standard alternative
    alt_zip_path = repo_root / "extension.zip"

    for target_zip in [zip_path, alt_zip_path]:
        if target_zip.exists():
            target_zip.unlink()
            
        with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(base_dir):
                for file in files:
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(base_dir).as_posix()
                    zf.write(full_path, arcname=rel_path)
                    print(f"Added to {target_zip.name}: {rel_path}")

        print(f"\nVerifying {target_zip.name} contents:")
        with zipfile.ZipFile(target_zip, 'r') as zf:
            namelist = zf.namelist()
            print("File count:", len(namelist))
            print("Files:", sorted(namelist))
            assert "manifest.json" in namelist, "manifest.json MUST be at root of ZIP!"
            assert not any("/" in name and name.split("/")[0] == "tuf-extension" for name in namelist), "Nested folder found!"
            assert not any(name.endswith(".py") for name in namelist), "Python scripts found in zip!"
            assert not any(name.endswith(".xlsx") for name in namelist), "Excel files found in zip!"
            assert not any(name.endswith(".md") for name in namelist), "Markdown files found in zip!"
            assert not any("leetcode" in name.lower() for name in namelist), "LeetCode file found in zip!"

    print("\n[SUCCESS] Production ZIP packages created and verified successfully!")

if __name__ == "__main__":
    create_zip()
