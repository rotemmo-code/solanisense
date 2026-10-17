#!/usr/bin/env bash
# shortcut: text grep, flags these words even in comments and misses import()/require and path aliases; upgrade to an AST import-boundary lint if core needs any of those
set -e
[ -d src/core ] || { echo "core is pure"; exit 0; }
if grep -rnE "from 'react'|from \"react\"|src/platform|src/ui|\.\./(platform|ui)\b|\bdocument\b|\bwindow\b|\bnavigator\b|\bImageData\b|canvas" src/core --include=*.ts --include=*.tsx | grep -v '\.test\.ts' ; then
  echo "core must stay pure"; exit 1
fi
echo "core is pure"
