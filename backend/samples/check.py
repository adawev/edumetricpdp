import json, urllib.request
from collections import Counter

d = json.loads(urllib.request.urlopen('http://localhost:3001/api/public/rating').read())
c = Counter((s['grantStatus'], s['grantReason']) for s in d)
print('Scenarios:')
for k, v in c.items():
    print('  %-12s / %-18s -> %d' % (k[0], k[1], v))
print('\nTop 5:')
for s in d[:5]:
    print('  #%d %-25s %5s %12s / %-18s risk=%s' % (
        s['rank'], s['fullName'], s['grantScore'],
        s['grantStatus'], s['grantReason'], s['riskLevel']))
