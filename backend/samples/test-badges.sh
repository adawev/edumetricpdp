#!/bin/bash
set -e
BASE=${BASE:-http://localhost:3001}

echo "🏆 Badge'lar smoke test"
echo

echo "1) Public catalog (loginsiz):"
curl -s $BASE/api/public/badges/catalog | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  {len(d)} ta badge mavjud')
for b in d[:5]:
    print(f\"  {b['icon']} {b['name']} ({b['category']})\")
print('  ...')
"

echo
echo "2) Public rating'da har talabaning badge'lari:"
curl -s $BASE/api/public/rating | python3 -c "
import json, sys
d = json.load(sys.stdin)
for s in d[:5]:
    badges = ' '.join(b['icon'] for b in s['badges'])
    print(f\"  #{s['rank']} {s['fullName']:25} → {badges or '(yo\\'q)'}\")
"

echo
echo "3) Top talabaning public profili (loginli, badge bilan):"
TOKEN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@pdp.uz","password":"password123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
TOP_ID=$(curl -s $BASE/api/public/rating | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/students/$TOP_ID/public | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"  {d['fullName']} — {len(d['badges'])} ta badge:\")
for b in d['badges']:
    print(f\"    {b['icon']} {b['name']} — {b['description']}\")
"

echo
echo "4) Student'ning /me/badges:"
SID=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"student1@pdp.uz","password":"password123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
curl -s -H "Authorization: Bearer $SID" $BASE/api/students/me/badges | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"  Talabada {len(d)} ta badge:\")
for b in d: print(f\"    {b['icon']} {b['name']}\")
"

echo
echo "✅ Badge tizimi ishlamoqda"
