#!/bin/bash
# Integration API'ni real talaba ID va API key bilan sinash
# Usage: bash test-lms.sh

set -e
BASE=${BASE:-http://localhost:3001}

echo "1) Admin login..."
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@pdp.uz","password":"password123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

echo "2) API key olish..."
API_KEY=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/admin/api-keys \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[0]["key"])')
echo "   API_KEY = ${API_KEY:0:25}..."

echo "3) Birinchi 2 ta talaba ID..."
IDS=$(curl -s $BASE/api/public/rating \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[0]["id"]+" "+d[1]["id"])')
ID_A=$(echo $IDS | cut -d' ' -f1)
ID_B=$(echo $IDS | cut -d' ' -f2)
echo "   ID_A = $ID_A"
echo "   ID_B = $ID_B"

echo "4) LMS attendance (nested format)..."
sed "s/REPLACE_WITH_STUDENT_UUID/$ID_A/" lms-attendance.json \
  | curl -s -X POST $BASE/api/integrations/attendance \
    -H "X-API-Key: $API_KEY" \
    -H 'Content-Type: application/json' \
    -d @-
echo

echo "5) LMS grades (flat bulk)..."
sed -e "s/REPLACE_ID_A/$ID_A/" -e "s/REPLACE_ID_B/$ID_B/" lms-grades.json \
  | curl -s -X POST $BASE/api/integrations/grades \
    -H "X-API-Key: $API_KEY" \
    -H 'Content-Type: application/json' \
    -d @-
echo

echo "6) Talaba A ning yangi balli..."
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/students/$ID_A/score \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('  score=%s, status=%s' % (d['grantScore'], d['grantStatus']))"
