#!/bin/bash
set -euo pipefail

echo "--- :bk-status-passed: test"
yarn
yarn test