#!/bin/bash
# deploy.sh — run from inside the videoboard folder
# Usage: ./deploy.sh "commit message"

cd "$(dirname "$0")"

# Init git if needed
if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/bjornerix/videoboard.git
fi

git add .
git commit -m "${1:-Update videoboard}"
git branch -M main
git push -f origin main

echo ""
echo "✓ Pushed — Vercel will auto-deploy in ~30 seconds"
