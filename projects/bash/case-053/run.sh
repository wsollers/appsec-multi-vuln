#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
while true; do printf 'HTTP/1.1 302 Found\r\nLocation: /\r\nContent-Length: 8\r\n\r\ncase-053' | nc -l -p 8080; done &
openssl s_server -quiet -accept 8443 -cert "$root/support/local.crt" -key "$root/support/local.key" -www &
wait
