#!/bin/bash
# SEO Check Hook - PostToolUse on Write|Edit
# Reads stdin JSON, validates SEO rules on changed .ts/.tsx files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)

# Only check .tsx/.ts files that exist
if [[ -z "$FILE_PATH" ]] || [[ ! "$FILE_PATH" =~ \.(tsx?|ts)$ ]] || [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

WARNINGS=""

# 1. Check title-like strings for duplicate Korean words
while IFS= read -r line; do
  # Extract Korean words (2+ chars) from lines containing title/hookTitle
  WORDS=$(echo "$line" | grep -oP '[가-힣]{2,}' | sort)
  DUPES=$(echo "$WORDS" | uniq -d)
  if [[ -n "$DUPES" ]]; then
    WARNINGS="$WARNINGS | TITLE DUPLICATE: $DUPES"
  fi
done < <(grep -iP '(title|hookTitle).*[:=]' "$FILE_PATH" 2>/dev/null)

# 2. Check for banned words (2차, 무료체험, 성매매)
BANNED=$(grep -nP '2차|무료체험|성매매' "$FILE_PATH" 2>/dev/null | head -3)
if [[ -n "$BANNED" ]]; then
  WARNINGS="$WARNINGS | BANNED WORD: $BANNED"
fi

# 3. Check for family/kids content words
FAMILY=$(grep -nP '아기|엄마|가족|키즈|어린이|돌잔치|가정|부모' "$FILE_PATH" 2>/dev/null | head -3)
if [[ -n "$FAMILY" ]]; then
  WARNINGS="$WARNINGS | FAMILY CONTENT BANNED: $FAMILY"
fi

if [[ -n "$WARNINGS" ]]; then
  # Escape for JSON
  SAFE=$(echo "$WARNINGS" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"[SEO-CHECK]$SAFE\"}}"
fi
