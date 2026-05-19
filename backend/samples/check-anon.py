import json, urllib.request

print('=== MEHMON (loginsiz) ===')
d = json.loads(urllib.request.urlopen('http://localhost:3001/api/public/rating').read())
for s in d:
    anon = ' (anonim)' if s.get('isAnonymized') else ''
    print(f"  #{s['rank']} {s['fullName']:25}{anon}")

print()
print('=== LOGIN (admin) ===')
tok = json.loads(urllib.request.urlopen(urllib.request.Request(
    'http://localhost:3001/api/auth/login',
    data=json.dumps({'email':'admin@pdp.uz','password':'password123'}).encode(),
    headers={'Content-Type':'application/json'})).read())['token']
d = json.loads(urllib.request.urlopen(urllib.request.Request(
    'http://localhost:3001/api/public/rating',
    headers={'Authorization': f'Bearer {tok}'})).read())
for s in d[:6]:
    print(f"  #{s['rank']} {s['fullName']:25}")
