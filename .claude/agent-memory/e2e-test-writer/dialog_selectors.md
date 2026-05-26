---
name: dialog_selectors
description: Selectors for shadcn/base-ui dialog components used in this project
metadata:
  type: project
---

The project uses `@base-ui/react/dialog` wrapped in `client/src/components/ui/dialog.tsx`. Key data-slot attributes:

- Dialog popup container: `[data-slot="dialog-content"]`
- Dialog title: `[data-slot="dialog-title"]` — use `.toContainText('...')` for title assertions
- Close button: `[data-slot="dialog-close"]`

To assert dialog closed: `expect(page.locator('[data-slot="dialog-content"]')).not.toBeVisible()`

The `DialogFooter` renders a "Close" button when `showCloseButton` prop is passed. The submit action button (e.g. "Create user", "Save changes", "Delete user") lives inside `DialogFooter` and is the primary action button — target it with `getByRole('button', { name: '...' })`.

**Why:** base-ui/react uses data-slot conventions rather than aria roles for the dialog container, so role-based selectors don't directly target the popup itself.

**How to apply:** Always use `[data-slot="dialog-content"]` to detect dialog open/close state, and `[data-slot="dialog-title"]` for title text assertions.
