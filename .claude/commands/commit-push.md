---
description: Commit and push changes during development (no PR creation)
---

# Commit and Push Sequence

## Instructions

### 1. Preflight Checks

**Check current branch:**

- Verify we're on a feature branch (not `main` or `dev`)
- If on `main` or `dev`, create and switch to a new feature branch using detected prefix
- Use branch naming convention: `<prefix>/<brief-description>`
  - `feature/` - New functionality
  - `fix/` - Bug fixes
  - `hotfix/` - Urgent production fixes
  - `release/` - Release preparation
  - `docs/` - Documentation changes
- Detect the type of change and use appropriate prefix
- Example: `feature/add-calendar-export` or `fix/dialog-scroll-lock`

**Check for uncommitted changes:**

- Run `git status` to see what changes exist
- Confirm there are changes to commit

**Verify remote is accessible:**

- Run `git fetch` to verify connection to remote repository
- Report any connection issues before proceeding

### 2. Format and Lint

- Run `npm run format` to fix formatting automatically
- Run `npm run lint:fix` to fix auto-fixable lint issues
- Run `npm run lint` to check for remaining issues
- **If lint returns issues that couldn't be fixed automatically:**
  - Review each lint error
  - Fix the issues manually
  - Re-run `npm run lint` to confirm all issues are resolved
  - Do not proceed until lint passes with zero errors

### 3. Organize Commits

**Analyze changes:**

- Review all staged and unstaged changes using `git status` and `git diff`
- Group related changes into logical, atomic commits
- Each commit should represent a single logical change

**Create meaningful commits:**

- Stage related files together using `git add`
- Write descriptive commit messages that:
  - Start with a verb (Add, Update, Fix, Remove, Refactor, etc.)
  - Clearly describe what changed and why
  - Keep the subject line under 72 characters
  - Do not include the Claude Code footer
- Create multiple commits if changes span different features or concerns

**Example commit organization:**

```bash
# Commit 1: Core feature implementation
git add packages/server/routes/foo.js packages/server/models/Foo.js
git commit -m "Add foo API endpoint and model"

# Commit 2: Frontend implementation
git add packages/client/src/components/features/foo/
git commit -m "Add foo UI components"

# Commit 3: Integration
git add packages/client/src/utils/api.js
git commit -m "Integrate foo API with frontend"
```

### 4. Push to Remote

- Push the feature branch to remote: `git push -u origin <branch-name>`
- Confirm push was successful
- Report the branch name and commit count

## Error Handling

If any step fails:

- Report the error clearly
- Suggest potential solutions
- Ask for guidance before proceeding
- Do not move to the next step until the issue is resolved

## Completion

End operation with message:

```
💥💣💥 Boom! Push COMPLETE! 💥💣💥

Summary:
- Branch name
- Number of commits created
- Files changed
- Next steps: "Ready for more changes, or run /pr-cleanup when ready to merge"
```
