import json, urllib.request

for p in ['all', 'week', 'month']:
    print(f'=== period={p} ===')
    d = json.loads(urllib.request.urlopen(f'http://localhost:3001/api/public/rating?period={p}').read())
    for s in d[:5]:
        print(f"  #{s['rank']} {s['fullName']:25} periodBall={s['periodBall']:>6}  grantScore={s['grantScore']}")
    print()
