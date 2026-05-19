#!/bin/bash
# /me/rankings va /:id/public sinash
set -e
BASE=${BASE:-http://localhost:3001}

echo "1) Student1 login..."
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student1@pdp.uz","password":"password123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

echo "2) Mening reytinglarim..."
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/students/me/rankings | python3 -m json.tool
echo

echo "3) Top talabaning public profili..."
TOP_ID=$(curl -s $BASE/api/public/rating | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/students/$TOP_ID/public | python3 -m json.tool
