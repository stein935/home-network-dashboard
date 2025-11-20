---
description: The task captures all of the steps for pushing local changes.
---

# Push sequence

## Instructions

### 1. Branch Setup

- Create and switch to feature branch from `dev` using naming convention: `feature/<brief-description>`
- Example: `feature/add-calendar-export` or `fix/dialog-scroll-lock`

### 2. Commit & Push

- Stage all changes (both Claude's and user's modifications)
- Create a descriptive commit with the change summary
- Push the feature branch to remote

### 3. Pull Request

- Create a PR to merge the feature branch into `dev`
- Include summary of changes and testing notes in PR description
- Wait for confirmation that the PR has been merged

### 8. Cleanup

- Switch to `dev` branch
- Pull latest changes and confirm feature is present
- Delete feature branch both locally and on remote

### 9. Completion

End operation with message: "💥💣💥 Boom! Push COMPLETE! 💥💣💥"

## Error Handling

If any step fails:

- Report the error clearly
- Suggest potential solutions
- Ask for guidance before proceeding
- Do not move to the next step until the issue is resolved
