---
name: users_page_selectors
description: Selectors and patterns for the /users page table and CRUD dialogs
metadata:
  type: project
---

## Table row selection

Use `page.getByRole('row').filter({ hasText: name })` to locate a specific user's row. Filter by name or email — both appear in the same row.

## Action buttons (inside a row)

- Edit: `row.getByRole('button', { name: 'Edit user' })` — pencil icon, ghost variant
- Delete: `row.getByRole('button', { name: 'Delete user' })` — trash icon, ghost variant; **disabled** when `role === 'admin'`

## UserDialog form field IDs

The form uses explicit `id` attributes paired with `htmlFor` on Labels:
- Name: `id="user-name"` → `getByLabel('Name')`
- Email: `id="user-email"` → `getByLabel('Email')`
- Role: `id="user-role"` → `getByLabel('Role')` — only rendered in edit mode (native `<select>`)
- Password: `id="user-password"` → `getByLabel('Password')`

## Create vs. Edit dialog differences

- Create: shows Name, Email, Password fields; no Role field; submit button says "Create user"
- Edit: shows Name, Email, Role (select), Password (optional); submit button says "Save changes"; fields pre-populated from user data

## Delete confirmation dialog

Contains the user name in a `<span>` inside a `<p>`. Confirm button: `getByRole('button', { name: 'Delete user' })` (destructive variant).

## Sequential test ordering

The suite creates a TEST_USER in the create test, edits it in the update test (name changes to `updatedName`), then deletes the `updatedName` row. Tests must run in order (single worker, `fullyParallel: false`).

**How to apply:** Always filter row by the current name — after the edit test the original name is gone, so the delete test targets `updatedName`.
