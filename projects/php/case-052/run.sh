#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
php -S 0.0.0.0:8080 -t "$(dirname "${BASH_SOURCE[0]}")" >/tmp/case-052-http.log 2>&1 &
openssl s_server -quiet -accept 8443 -cert "$root/support/local.crt" -key "$root/support/local.key" -www >/tmp/case-052-https.log 2>&1 &
wait
