---
description: Running list of tasks I would like to make to the project. When run, CLAUDE will grab the first task from the
'Ready' section and work through the change.
---

# Next Task

## Instructions

### 1. Review & Plan

- Use the product-manager and frontend-developer to review first task in the "Ready" list in @local/prompt-drafts/task-list.md
- State the task with a high-level summary of your understanding
- Ask clarifying questions about the task one at a time with selectable options
- Present a detailed plan for fulfilling the task and ask with selector for confirmation or additional instruction

### 2. Branch Setup

- Create and switch to feature branch from `dev` using naming convention: `feature/<brief-description>`
- Example: `feature/add-calendar-export` or `fix/dialog-scroll-lock`

### 3. Implementation

- Execute the accepted plan
- Run linting and formatting checks if code changes are made
- Run tests if they exist in the project
- Verify the application builds successfully

### 4. Documentation Updates

Update relevant documentation if the changes affect:

- @CLAUDE.md - Architecture, features, or API changes
- @README.md - User-facing features or setup instructions
- @Dockerfile - Build or deployment changes
- @docker-compose.yml - Service configuration changes
- @schema.sql - Database schema changes
- @package.json - Dependencies or scripts
- @packages/client/package.json - Client dependencies or scripts

### 5. User Testing

- Prompt me to test the change
- Wait for confirmation that the task is complete
- Address any issues found during testing

### 6. Commit & Push

- Stage all changes (both Claude's and user's modifications)
- Create a descriptive commit with the change summary
- Push the feature branch to remote

### 7. Pull Request

- Create a PR to merge the feature branch into `dev`
- Include summary of changes and testing notes in PR description
- Wait for confirmation that the PR has been merged

### 8. Cleanup

- Switch to `dev` branch
- Pull latest changes and confirm feature is present
- Delete feature branch both locally and on remote
- Move the completed task from "Ready" to "Complete" in @local/prompt-drafts/task-list.md

### 9. Completion

End operation with message: "💥💣💥 Boom! COMPLETE! 💥💣💥"

## Error Handling

If any step fails:

- Report the error clearly
- Suggest potential solutions
- Ask for guidance before proceeding
- Do not move to the next step until the issue is resolved
