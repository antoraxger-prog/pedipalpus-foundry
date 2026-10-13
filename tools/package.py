import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'module.json').read_text(encoding='utf-8'))
output = root.parent / 'artifacts' / f"pedipalpus-foundry-{manifest['version']}.zip"
output.parent.mkdir(parents=True, exist_ok=True)
files = [root / 'module.json', root / 'README.md', root / 'AUDIO-CREDITS.md']
files += sorted((root / 'scripts').glob('*.js'))
files += sorted((root / 'styles').glob('*.css'))
files += sorted((root / 'assets').glob('*.svg'))
files += sorted((root / 'assets/sounds').glob('*.wav'))
for relative in manifest['esmodules'] + manifest['styles']:
    assert (root / relative) in files, relative
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file in files:
        archive.write(file, 'pedipalpus-foundry/' + file.relative_to(root).as_posix())
with ZipFile(output) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert 'pedipalpus-foundry/module.json' in names
    assert not any('/tests/' in name or '/tools/' in name for name in names)
print(f'{output}\n{len(files)} Dateien; {output.stat().st_size} Bytes; ZIP geprüft.')
