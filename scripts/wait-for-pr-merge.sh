#!/bin/bash

# Script to monitor PR merge status
# Usage: ./wait-for-pr-merge.sh <pr-number>

if [ -z "$1" ]; then
  echo "Error: PR number required"
  echo "Usage: $0 <pr-number>"
  exit 1
fi

PR_NUMBER=$1
MAX_CHECKS=60
CHECK_INTERVAL=30

echo "Monitoring PR #${PR_NUMBER} for merge..."
echo "Will check every ${CHECK_INTERVAL} seconds (max ${MAX_CHECKS} checks = 30 minutes)"
echo ""

for i in $(seq 1 $MAX_CHECKS); do
  echo "Check $i/$MAX_CHECKS: $(date '+%H:%M:%S')"

  STATE=$(gh pr view "$PR_NUMBER" --json state --jq '.state')
  echo "PR #${PR_NUMBER} status: $STATE"

  if [ "$STATE" = "MERGED" ]; then
    echo ""
    echo "✓ PR has been merged!"
    exit 0
  elif [ "$STATE" = "CLOSED" ]; then
    echo ""
    echo "✗ PR was closed without merging"
    exit 1
  fi

  if [ $i -lt $MAX_CHECKS ]; then
    echo "Waiting ${CHECK_INTERVAL} seconds before next check..."
    echo ""
    sleep $CHECK_INTERVAL
  fi
done

echo ""
echo "✗ Timeout: PR not merged after 30 minutes"
exit 2
