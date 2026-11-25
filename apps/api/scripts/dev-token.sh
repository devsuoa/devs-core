#!/usr/bin/env bash
# Prints a JWT for one of the seeded local users, signed with the local compose secret.
# Only works against the local stack (docker compose), never a real Supabase project.
#
#   apps/api/scripts/dev-token.sh techexec   # admin, tech team (also: admin)
#   apps/api/scripts/dev-token.sh pres       # admin, president
#   apps/api/scripts/dev-token.sh superuser  # admin, president, superuser (also: super)
#   apps/api/scripts/dev-token.sh user       # Una User, not an exec
#
#   curl -H "Authorization: Bearer $(apps/api/scripts/dev-token.sh admin)" localhost:8080/api/me
set -euo pipefail

case "${1:-techexec}" in
  techexec|admin) sub=00000000-0000-4000-8000-000000000001 ;;
  superuser|super) sub=00000000-0000-4000-8000-000000000002 ;;
  user) sub=00000000-0000-4000-8000-000000000003 ;;
  pres) sub=00000000-0000-4000-8000-000000000004 ;;
  *) echo "usage: $0 techexec|pres|superuser|user" >&2; exit 1 ;;
esac

secret="local-dev-jwt-secret-not-for-production-0123456789"
issuer="http://localhost:54321/auth/v1"
now=$(date +%s)

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

header=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
payload=$(printf '{"sub":"%s","iss":"%s","aud":"authenticated","role":"authenticated","email":"%s@example.test","iat":%d,"exp":%d}' \
  "$sub" "$issuer" "${1:-techexec}" "$now" "$((now + 3600))" | b64url)
signature=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)

printf '%s.%s.%s\n' "$header" "$payload" "$signature"
