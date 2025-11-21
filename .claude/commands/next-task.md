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

### 2. Implementation

- Execute the accepted plan
- Run linting and formatting checks if code changes are made
- Run tests if they exist in the project
- Verify the application builds successfully

### 3. Documentation Updates

Read and update relevant documentation ONLY if the changes affect:

- CLAUDE.md - Architecture, features, or API changes
- README.md - User-facing features or setup instructions
- Dockerfile - Build or deployment changes
- docker-compose.yml - Service configuration changes
- schema.sql - Database schema changes
- package.json - Dependencies or scripts
- packages/client/package.json - Client dependencies or scripts

### 4. User Testing

**IMPORTANT: DO NOT proceed to Step 5 until testing is confirmed complete.**

- Present a summary of changes and what was implemented
- Provide a clear, actionable test plan with specific scenarios to verify
- Explicitly ask: "Please test these changes and let me know if you encounter any issues or if everything works as expected."
- **STOP and WAIT** for user response
- If issues are found, address them and repeat this step
- Only proceed to Step 5 after user explicitly confirms testing is complete and successful

### 5. Completion

**ONLY after user confirms testing is complete**

- Delete the task from the ready list in @local/prompt-drafts/task-list.md
- End operation with message: "💥💣💥 Boom! Task COMPLETE! 💥💣💥"

## Error Handling

If any step fails:

- Report the error clearly
- Suggest potential solutions
- Ask for guidance before proceeding
- Do not move to the next step until the issue is resolved
