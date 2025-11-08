# Design Reference Images - Addendum to Claude Code Prompt

## Design Reference Directory

Add this section to your CLAUDE_CODE_PROMPT.md after the "Design Requirements" section:

---

## Design Reference Images

A `design-reference/` directory has been provided with visual examples of the desired aesthetic:

### Directory Structure
```
design-reference/
├── brutalist-examples/     # Reference images for brutalist design style
└── color-inspiration/      # Reference images for color palette and contrast
```

### How to Use These References

When implementing the frontend design, review these images to understand:

1. **Brutalist Aesthetic:**
   - Bold, thick borders (3-5px)
   - Hard edges, no rounded corners
   - Geometric, grid-based layouts
   - Raw, unpolished appearance
   - Strong visual hierarchy
   - Functional over decorative

2. **Color Application:**
   - High contrast combinations
   - Bright, saturated accent colors
   - Colors used for functional emphasis, not decoration
   - Neon/bright colors against dark or neutral backgrounds
   - Bold color blocking

3. **Typography Treatment:**
   - Large, bold display text
   - Uppercase headings
   - Strong weight contrast between headers and body
   - Tight letter spacing on display text

4. **Layout Principles:**
   - Grid-based, modular layout
   - Asymmetric balance
   - Generous whitespace/negative space
   - Elements aligned to strong grid lines

### Applying to Components

**ServiceCard Component:**
- Match the boldness and geometric nature of brutalist cards in references
- Use bright border colors similar to the inspiration images
- Implement dramatic hover effects (shadow removal, position shift)

**Dashboard Layout:**
- Grid spacing and alignment should feel structured and intentional
- Card sizing should be bold and prominent
- Use bright accent colors for interactive elements

**Admin Interface:**
- Forms and inputs should have strong borders
- Buttons should have the brutal shadow effect
- Tables should have clear, bold dividing lines

**Color Usage:**
- Primary actions: Bright accent colors (magenta, cyan, bright green)
- Borders: Contrasting bright colors
- Backgrounds: Dark (#1a1a1a) or light (#f5f5f5) neutrals
- Text: High contrast (pure white or pure black)

### Design Validation

After implementing components, compare them against the reference images to ensure:
- ✓ Visual weight feels similar
- ✓ Color saturation and brightness matches intensity
- ✓ Borders are prominent and bold enough
- ✓ Layout feels structured and grid-based
- ✓ Typography hierarchy is strong and clear

---

## Updated Tailwind Configuration

Ensure your tailwind.config.js reflects the reference aesthetic:

```javascript
// Additional utility classes to add
@layer components {
  .card-brutal {
    @apply border-5 border-light-border dark:border-dark-border
           bg-light-surface dark:bg-dark-surface
           shadow-brutal
           hover:shadow-none hover:translate-x-2 hover:translate-y-2
           transition-all duration-200;
  }
  
  .text-neon-green {
    @apply text-[#00ff00];
  }
  
  .text-neon-magenta {
    @apply text-[#ff00ff];
  }
  
  .text-neon-cyan {
    @apply text-[#00ffff];
  }
  
  .border-neon-green {
    @apply border-[#00ff00];
  }
  
  .border-neon-red {
    @apply border-[#ff0000];
  }
}
```

---

**Note to Claude Code:** When implementing the design, please reference the images in the `design-reference/` directory to match the visual style, color intensity, and brutalist aesthetic shown in these examples.
