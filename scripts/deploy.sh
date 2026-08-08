#!/usr/bin/env bash
# git add -> commit -> push. Vercel auto-deploys on push to main.
set -e
git add -A
git commit -m "${1:-update}"
git push
