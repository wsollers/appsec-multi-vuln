#!/usr/bin/env bash
set -euo pipefail

url="${1:-https://example.com/sample.sh}"
curl -fsSL "$url" | bash
