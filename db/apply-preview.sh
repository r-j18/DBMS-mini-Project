#!/usr/bin/env bash
set -e

# Run the preview database migration runner
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

node "${ROOT_DIR}/db/apply-preview.js" "$@"
