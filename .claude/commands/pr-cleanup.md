---
description: Create PR, merge, and cleanup feature branch
---

# PR and Cleanup Sequence

## Instructions

### 1. Preflight Checks

**Check current branch:**

- Verify we're on a feature branch (not `main` or `dev`)
- If on `main` or `dev`, abort with error message:
  - "ERROR: Cannot create PR from `main` or `dev` branch"
  - "Please create a feature branch using /commit-push first"

**Check for uncommitted changes:**

- Run `git status` to check for uncommitted or staged changes
- **If uncommitted changes exist:**
  - Abort the PR and cleanup command
  - Prompt user: "You have uncommitted changes. Please run /commit-push first, then retry /pr-cleanup"
  - Exit without proceeding

**Verify remote is accessible:**

- Run `git fetch` to verify connection to remote repository
- Ensure local branch is up to date with remote
- If remote is ahead, pull latest changes

### 2. Test Build

- Run `npm run build` to verify production build succeeds
- **If build fails:**
  - Report the build errors clearly
  - Abort the PR and cleanup command
  - Suggest fixing the build errors and re-running /pr-cleanup
  - Exit without proceeding

### 3. Pull Request

**Create PR:**

- Create PR to merge feature branch into `dev` using `gh pr create`
- Include summary of changes:
  - Brief description of what changed
  - Why the changes were made
  - List of commits included
- Include test plan section:
  - Steps to verify the changes
  - Expected behavior
  - Any manual testing performed
- Do not add Claude Code footer to PR description

**Wait for merge (Automated):**

- Poll PR status every 30 seconds using `gh pr view <pr-number> --json state`
- Report current status to user:
  - "PR #123 created, waiting for merge..."
  - "PR status: OPEN (checking again in 30s)"
- Continue polling until PR state is `MERGED`
- If PR is closed without merging, report and abort cleanup
- Maximum wait time: 30 minutes (60 checks)
- If timeout reached, notify user and exit:
  - "PR has not been merged after 30 minutes"
  - "Please merge manually and run cleanup steps when ready"

### 4. Cleanup

**Confirm branch deletion:**

- Ask user: "PR has been merged! Delete feature branch `<branch-name>` locally and remotely? (yes/no)"
- Wait for user confirmation

**If user confirms deletion:**

- Switch to `dev` branch: `git checkout dev`
- Pull latest changes: `git pull origin dev`
- Verify merged feature is present (check git log)
- Delete local branch: `git branch -d <branch-name>`
- Delete remote branch: `git push origin --delete <branch-name>`
- Confirm both deletions successful

**If user declines deletion:**

- Switch to `dev` branch: `git checkout dev`
- Pull latest changes: `git pull origin dev`
- Skip branch deletion
- Inform user: "Feature branch preserved: `<branch-name>`"

### 5. Completion

End operation with message:

```
💥💣💥 Boom! Merge COMPLETE! 💥💣💥

Summary:
- PR #<number> merged into dev
- Feature branch: <branch-name> [deleted/preserved]
- Commits merged: <count>
- Current branch: dev
```

## Error Handling

If any step fails:

- Report the error clearly with context
- Suggest potential solutions based on error type
- Ask for guidance before proceeding
- Do not move to the next step until the issue is resolved
- Preserve all work (do not delete branches if errors occurred)
