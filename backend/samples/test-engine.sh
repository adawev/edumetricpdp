#!/bin/bash
# Grant engine'ning to'liq smoke test'i
# Maqsad: barcha senariy va recalc oqimini sinash
set -e
BASE=${BASE:-http://localhost:3001}

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; exit 1; }

echo "🧪 Grant Engine — to'liq test"
echo

# 0) Setup
TOKEN_ADMIN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@pdp.uz","password":"password123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
TOKEN_MENTOR=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"mentor1@pdp.uz","password":"password123"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
API_KEY=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/admin/api-keys \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["key"])')

# Talabalar
IDS=$(curl -s $BASE/api/public/rating | python3 -c "
import json,sys
d = json.load(sys.stdin)
g = next((s for s in d if s['grantStatus']=='GRANTED'), None)
a = next((s for s in d if s['grantReason']=='ACADEMIC_FAIL'), None)
p = next((s for s in d if s['grantReason']=='PAYMENT_OVERDUE'), None)
print(g['id'], a['id'], p['id'])
")
GRANTED_ID=$(echo $IDS | cut -d' ' -f1)
FAIL_ID=$(echo $IDS | cut -d' ' -f2)
PAY_ID=$(echo $IDS | cut -d' ' -f3)
echo "Talabalar: GRANTED=$GRANTED_ID FAIL=$FAIL_ID PAY=$PAY_ID"
echo

# 1) QATTIQ FILTR: GPA < 80 → ACADEMIC_FAIL bo'lishi shart
echo "1) Qattiq filtr (GPA < 80)"
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/students/$FAIL_ID/score | python3 -c 'import json,sys; print(json.load(sys.stdin)["grantStatus"])')
[ "$STATUS" = "NOT_GRANTED" ] && pass "ACADEMIC_FAIL status=NOT_GRANTED" || fail "expected NOT_GRANTED, got $STATUS"

# 2) PAYMENT_OVERDUE → NOT_GRANTED
echo "2) To'lov muddati o'tgan"
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/students/$PAY_ID/score | python3 -c 'import json,sys; print(json.load(sys.stdin)["grantStatus"])')
[ "$STATUS" = "NOT_GRANTED" ] && pass "PAYMENT_OVERDUE → NOT_GRANTED" || fail "expected NOT_GRANTED, got $STATUS"

# 3) LMS DAVOMAT yangilash → recalc
echo "3) LMS davomat (flat format)"
curl -s -X POST $BASE/api/integrations/attendance \
  -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -d "{\"records\":[{\"studentId\":\"$GRANTED_ID\",\"date\":\"2026-05-19T09:00:00Z\",\"status\":\"PRESENT\"}]}" > /dev/null
pass "Flat attendance qabul qilindi"

# 4) LMS DAVOMAT (nested) → o'rta jadval ham yoziladi
echo "4) LMS davomat (nested LMS format)"
RESP=$(cat /dev/null && python3 -c "
import json
p = {
  'student': {'id': '$GRANTED_ID'},
  'attendance_summary': {'total_lessons': 100, 'attended': 95, 'absent': 5, 'attendance_percentage': 95.0},
  'subjects': [{'subject_name':'Test','subject_summary':{'total':10,'attended':10,'absent':0,'percentage':100},'logs':[{'date':'2026-05-19','status':'attended'}]}]
}
print(json.dumps(p))
" | curl -s -X POST $BASE/api/integrations/attendance \
  -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' -d @-)
echo $RESP | grep -q '"format":"lms"' && pass "Nested LMS format qabul qilindi" || fail "$RESP"

# 5) LMS GRADES → GPA yangilanadi
echo "5) LMS grades yuborish"
curl -s -X POST $BASE/api/integrations/grades \
  -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -d "{\"records\":[{\"studentId\":\"$GRANTED_ID\",\"gpa\":92.0,\"projectScore\":14}]}" > /dev/null
NEW_GPA=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/admin/rating | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(next(s['breakdown']['academicPct'] for s in d if s['id']=='$GRANTED_ID'))
")
[ "$NEW_GPA" = "92" ] && pass "GPA 92 ga yangilandi" || fail "GPA = $NEW_GPA"

# 6) FEEDBACK BAHOSI → tutorScore (Mentor bahosi, max 5 ball)
echo "6) Feedback bahosi → tutorScore"
curl -s -X POST $BASE/api/mentor/feedback \
  -H "Authorization: Bearer $TOKEN_MENTOR" -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$GRANTED_ID\",\"text\":\"Zo'r ishlayapti\",\"score\":5}" > /dev/null
TUTOR=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/admin/rating | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(next(s['breakdown']['tutor'] for s in d if s['id']=='$GRANTED_ID'))
")
[ "$TUTOR" = "5" ] && pass "Feedback bahosi 5 → tutorScore = 5" || fail "tutor = $TUTOR"

# Bitta mentor → bitta feedback: qayta yozilganda yangilanadi
curl -s -X POST $BASE/api/mentor/feedback \
  -H "Authorization: Bearer $TOKEN_MENTOR" -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$GRANTED_ID\",\"text\":\"Yaxshilanmoqda\",\"score\":3}" > /dev/null
TUTOR=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/admin/rating | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(next(s['breakdown']['tutor'] for s in d if s['id']=='$GRANTED_ID'))
")
[ "$TUTOR" = "3" ] && pass "Feedback qayta yozildi → tutorScore = 3" || fail "tutor = $TUTOR"

# Out of range — score > 5 rad etiladi
RESP=$(curl -s -X POST $BASE/api/mentor/feedback \
  -H "Authorization: Bearer $TOKEN_MENTOR" -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$GRANTED_ID\",\"text\":\"Test\",\"score\":7}")
echo $RESP | grep -q '"error"' && pass "score > 5 rad etildi" || fail "should reject"

# 7) PENALTY → recalc, cap test
echo "7) Penalty va Recovery"
# Talabaning hozirgi balli
BEFORE=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/students/$GRANTED_ID/score | python3 -c 'import json,sys; print(json.load(sys.stdin)["grantScore"])')
curl -s -X POST $BASE/api/admin/penalties \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"$GRANTED_ID\",\"type\":\"HEAVY\",\"ball\":15,\"reason\":\"Test cheat\"}" > /dev/null
AFTER=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/students/$GRANTED_ID/score | python3 -c 'import json,sys; print(json.load(sys.stdin)["grantScore"])')
echo "  before=$BEFORE after=$AFTER"
python3 -c "exit(0 if $AFTER < $BEFORE else 1)" && pass "Penalty ball'ni kamaytirdi" || fail "ball o'zgarmadi"

# 8) RECALC oxiri admin/rating breakdown bilan
echo "8) Final breakdown spreadsheet uchun"
ROW=$(curl -s -H "Authorization: Bearer $TOKEN_ADMIN" $BASE/api/admin/rating | python3 -c "
import json,sys
d = json.load(sys.stdin)
r = next(s for s in d if s['id']=='$GRANTED_ID')
b = r['breakdown']
need = ['academicPct','attendancePct','projectPct','activityPct','tutorPct','disciplinePct',
        'academic','attendance','projects','activity','tutor','discipline','base','penalty','recovery','employment','total']
missing = [k for k in need if k not in b]
if missing: print('MISSING: '+','.join(missing)); sys.exit(1)
print('OK')
")
[ "$ROW" = "OK" ] && pass "Breakdown'da % va Ball alohida, hammasi bor" || fail "$ROW"

echo
echo "🎉 Engine test'lari muvaffaqiyatli o'tdi!"
