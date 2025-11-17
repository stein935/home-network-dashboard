---
description: Running list of tasks I would like to make to the project. When run, CLAUDE will grab the first task from the 'Ready' section and work through the change.
---

# Next Task

## Instructions

1. Review first task in the "Ready" list in @local/prompt-drafts/task-list.md
2. State the task with a high level summary of your understanding
3. Ask clarifying questions about the task
4. Present a plan for fulfilling the task and wait for confirmation or additional instruction.
5. Make a feature branch from branch `dev`
6. Switch to new branch
7. Execute the accepted plan
8. Prompt me to test the change and wait for confirmation that the task is complete
9. Update documentation and config if necessary.

- @CLAUDE.md
- @README.md
- @Dockerfile
- @docker-compose.yml
- @schema.sql
- @package.json
- @packages/client/package.json

10. Commit ALL changes to the feature branch from `stein935@gmail.com` github account. Include all your changes and all of the changes I made.
11. Push ALL changes to the feature branch from `stein935@gmail.com` github account. Include all your changes and all of the changes I made.
12. Create a PR to merge the feature branch to `dev` branch
13. Wait for me to confirm that the PR has been merged
14. Switch to `dev` branch
15. Pull on `dev` branch and confirm feature changes
16. Delete feature branch locally and on the remote
17. Move the task from the "Ready" list to the "Complete" list in @local/prompt-drafts/task-list.md
18. End operation with message "💥💣💥 Boom! COMPLETE! 💥💣💥"
