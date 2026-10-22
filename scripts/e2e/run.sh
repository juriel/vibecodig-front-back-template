#!/usr/bin/env bash
# Browser tests of the admin panel against a running server. Usage (from the repo root):
#   scripts/e2e/run.sh                 # every test
#   scripts/e2e/run.sh inicio colores  # some of them
# Needs: the server running at BASE_URL, Google Chrome, Node, and the mysql client with access to the database.
# Creates two temporary admins (zz_test_a, zz_test_b) and removes them, with what they uploaded, at the end.
set -uo pipefail
cd "$(dirname "$0")"
BASE_URL="${BASE_URL:-http://localhost:8001}"
MYSQL_DEFAULTS="${MYSQL_DEFAULTS:-$HOME/.config/nexvia_cms/my.cnf}"
DB="${DB:-nexvia_cms}"
VFS_PATH="${VFS_PATH:-$(grep -E '^VFS_PATH=' ../../.env 2>/dev/null | cut -d= -f2)}"
export BASE_URL OUT="${OUT:-out}"
mkdir -p "$OUT"
[ -d node_modules ] || npm install --silent --no-audit --no-fund

M="mysql --defaults-extra-file=$MYSQL_DEFAULTS $DB"
HASH=$(python3 -c "import hashlib; print(hashlib.sha256(b'ABCDEFPruebaClaude-1234').hexdigest())")

reset_users() {
  $M -e "UPDATE cms_page SET owner='jhonny' WHERE owner LIKE 'zz_test%';
         DELETE FROM api_token WHERE login LIKE 'zz_test%'; DELETE FROM user_preference WHERE login LIKE 'zz_test%'; DELETE FROM user_x_profile WHERE login LIKE 'zz_test%'; DELETE FROM users WHERE login LIKE 'zz_test%';
         INSERT INTO users (login,password,salt,name,email,deleted) VALUES ('zz_test_a','$HASH','ABCDEF','Jhonny Hortua',NULL,0),('zz_test_b','$HASH','ABCDEF','Jefe',NULL,0);
         INSERT INTO user_x_profile (login,profile) VALUES ('zz_test_a',1),('zz_test_b',1);"
}
remove_test_media() {   # files uploaded by clic.mjs / rapido.mjs
  for p in $($M -N -e "SELECT v.path FROM vfs v JOIN cms_mediamanager_file f ON f.vfs=v.uuid WHERE f.filename LIKE 'foto-oficina-chia%' OR f.filename LIKE 'politica-de-datos%'"); do
    [ -n "$VFS_PATH" ] && rm -f "$VFS_PATH$p"; done
  $M -e "DELETE v FROM vfs v JOIN cms_mediamanager_file f ON f.vfs=v.uuid WHERE f.filename LIKE 'foto-oficina-chia%' OR f.filename LIKE 'politica-de-datos%';
         DELETE FROM cms_mediamanager_file WHERE filename LIKE 'foto-oficina-chia%' OR filename LIKE 'politica-de-datos%';
         DELETE s FROM cms_page_seo s JOIN cms_page p ON p.id=s.cms_page WHERE p.url LIKE 'borrador-ia%' OR p.url='zz-visual';
         DELETE FROM cms_page WHERE url LIKE 'borrador-ia%' OR url='zz-visual';"
}
cleanup() { reset_users; $M -e "DELETE FROM api_token WHERE login LIKE 'zz_test%'; DELETE FROM user_preference WHERE login LIKE 'zz_test%'; DELETE FROM user_x_profile WHERE login LIKE 'zz_test%'; DELETE FROM users WHERE login LIKE 'zz_test%';"; remove_test_media; }
trap cleanup EXIT

# ia.mjs needs the server started with AI_FAKE=1; it only runs when asked for by name.
TESTS=("$@"); [ ${#TESTS[@]} -eq 0 ] && TESTS=(login inicio cuenta tokens colores pager visual clic rapido ejemplos)
failed=0
for t in "${TESTS[@]}"; do
  reset_users; remove_test_media
  out=$(node "${t%.mjs}.mjs" 2>&1); status=$?
  if [ $status -eq 0 ] && ! grep -q '^FAIL' <<<"$out"; then echo "OK    $t"; else echo "FALLA $t"; grep -E '^FAIL|Error' <<<"$out" | sed 's/^/      /'; failed=1; fi
done
exit $failed
