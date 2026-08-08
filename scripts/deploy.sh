#!/usr/bin/env bash
# git add -> commit -> push -> deploy.
# This Vercel project has no GitHub integration, so push alone does not
# deploy — `vercel --prod` is the actual publish step.
set -e
git add -A
git commit -m "${1:-update}"
git push
vercel --prod
