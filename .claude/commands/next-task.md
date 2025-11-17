---
description: Running list of tasks I would like to make to the project. When run, CLAUDE will grab the first task from the 'Ready' section and work through the change.
---

# Next Task

## Instructions

1. Review first task in the "Ready" list
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
17. Move the task from the "Ready" list to the "Complete" list
18. End operation

## Task Format

```markdown
### "Title"

> #### Goal
>
> ...
>
> #### Requirements
>
> ...
```

## Ready

## Draft

### Recipe Box Card

> #### Goal
>
> ...
>
> #### Requirements
>
> ...

---

### Weekly Dinner Menu

> #### Goal
>
> ...
>
> #### Requirements
>
> ...

---

### Better System Notifications

> #### Goal
>
> ...
>
> #### Requirements
>
> ...

---

### Note Delete Confirmation

> #### Goal
>
> ...
>
> #### Requirements
>
> ...

## Complete

### Make the universal dialog full screen on mobile

> #### Goal
>
> When used on a mobile device, the dialog utility should be full screen. With the dialog header and footer fixed to the top and bottom respectively.
>
> #### Requirements
>
> 1. Dialog is 100% of screen height
> 2. Dialog is 100% of screen width
> 3. Header is fixed to the top of the screen. Always visible and never moves
> 4. Footer is fixed to the bottom of the screen. Always visible and never moves
> 5. Content section is 100% of the height between the header and footer
> 6. Content section is scrollable
> 7. Only apply these changes to mobile
> 8. Non-mobile stays as-is
>
> #### Completed
>
> - Implemented mobile-optimized full-screen dialog layout using Tailwind's `sm:` breakpoint (< 640px)
> - Dialog container uses flexbox column layout with `flex h-screen w-screen flex-col` on mobile
> - Header and footer remain in document flow with `flex-shrink-0` to prevent compression
> - Content section uses `flex-1` to fill remaining space and `overflow-y-auto` for scrolling
> - Desktop behavior preserved: centered modal with max-width constraint and original styling
> - Updated Dialog.jsx with responsive Tailwind classes
> - Updated documentation in CLAUDE.md and README.md
> - All dialogs (notes, events, services, sections, users) automatically inherit mobile-optimized behavior

---

### Add 'Edit' and 'See more' Buttons to Note Cards

> #### Goal
>
> Add action buttons to the bottom of each note card. One to edit, and one to 'See more'
>
> #### Requirements
>
> 1. Clicking the note does not open the edit view
> 2. Add button cluster to the bottom of each note card
> 3. The cluster only appears when the user hovers the note
> 4. The cluster contains 'Edit' and 'See more'
> 5. When clicked, the 'Edit' button opens the edit view
> 6. The 'See more' button only appears if the content of the note overflows the card view
> 7. The 'See more' button opens a new view that shows the entire content of the note
> 8. The new 'See more' view looks like the note card.
>
> - Overlay with grayed out background
> - Same note color
> - Same content format
>   - Title
>   - Author
>   - Message
> - No `ellipsis-vertical` icon for drag-and-drop
> - Same edit button, always visible
> - 'See less' button instead of 'See more'
>
> #### Completed
>
> - Added Edit and "See more" buttons to bottom of sticky note cards
> - Buttons fade in on hover (desktop), always visible on mobile
> - "See more" button only appears when content overflows
> - Created detail view modal for viewing full note content
> - Detail view includes same color, full content, Edit button, and Close button
> - Fixed text overlap issues with gradient fade effect
> - Optimized line-height for rich text content display
> - Updated CLAUDE.md documentation

---

### Modify drag-and-drop UI

> #### Goal
>
> Change drag-and-drop UI on notes and services so that the user needs to click and hold a `ellipsis-vertical` icon in the top right corner of the note / service in order to move.
>
> #### Requirements
>
> 1. New `ellipsis-vertical` icon in top right corner of all cards
> 2. Drag-and-drop mode ONLY initiates when the user clicks and holds the new icon
> 3. Note card hover state ONLY happens when a user hovers over the new icon
> 4. Clicking the new icon does not open edit mode
>
> #### Completed
>
> - Added MoreVertical icon to StickyNoteCard, ServiceCard, and CalendarCard
> - Implemented drag-only-from-icon functionality for all card types
> - Created conditional hover effects for sticky notes (lift effect)
> - Implemented conditional icon color change for service cards
> - Set drag preview to show entire card instead of just icon
> - Fixed positioning to avoid overlap with other UI elements
