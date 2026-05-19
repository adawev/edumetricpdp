import json, urllib.request
d = json.loads(urllib.request.urlopen('http://localhost:3001/api/public/rating').read())
print('Top 6:')
for s in d[:6]:
    b = s['badge']
    line = f"  #{s['rank']} {s['fullName']:25} [{s['badgeCount']}]"
    if b:
        line += f"  → {b['rarity']:>9}  {b['name']}"
    else:
        line += '  (no badge)'
    print(line)
