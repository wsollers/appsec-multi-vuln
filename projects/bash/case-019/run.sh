#!/usr/bin/env bash
set -euo pipefail

value="${1:-printf sample}"
eval "$value"
