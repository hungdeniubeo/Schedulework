# Project Rules

## Project Context

- Repo: `hungdeniubeo/Schedulework`; package name: `lich-ca`.
- Desktop app built with:
  - Tauri v2 / Rust in `src-tauri/`
  - React 19 + TypeScript 5.8 in `src/`
  - Tailwind CSS 3.4
  - Vite 7
- Fully offline. No backend, API, cloud service, or database.
- Persistent data is stored in `data.json` in the OS app-data directory via `@tauri-apps/plugin-fs`.
  - macOS example: `~/Library/Application Support/com.lichca.scheduler/data.json`
- Native file dialogs use `@tauri-apps/plugin-dialog`.
- Main libraries:
  - `@dnd-kit/core` — drag-and-drop shift assignment
  - `date-fns` — date/week logic
  - `html2canvas` — JPG export of the schedule grid
- Package manager is npm.
  - `package-lock.json` is authoritative.
  - Never switch to yarn or pnpm.
- Preserve existing Vietnamese domain terminology and user-facing text such as `Sáng`, `Trưa`, `Tối`, `xếp ca`.
- Follow existing naming conventions in each file instead of translating or renaming existing domain concepts unnecessarily.

## Core Principles

- Preserve existing functionality unless explicitly asked to change it.
- Understand the existing implementation before editing.
- Make the smallest safe change that solves the task.
- Do not rewrite working code unnecessarily.
- Do not modify unrelated files.
- Reuse existing components, utilities, styles, and patterns when possible.
- Do not add dependencies without explicit approval.
- Check whether existing dependencies already solve the problem before proposing a new one.
- Do not introduce backend, API, database, authentication, telemetry, or online dependencies unless explicitly requested.

## Before Coding

- Inspect only the files relevant to the task first.
- Check `git status` and `git diff` before modifying existing unfinished work.
- Treat the current working tree as the source of truth.
- Do not scan the entire repository unless the task requires broader architectural understanding.
- Do not reread large unchanged files unnecessarily.
- If requirements are ambiguous, state the assumption briefly before implementing rather than guessing silently.
- Preserve existing user changes even when they are unrelated or incomplete.

## Validation

Use validation appropriate to the files changed.

### Frontend / TypeScript changes

Run:

`npm run build`

This performs TypeScript checking and the Vite production build.

Also run:

`npm test`

Tests use Node's built-in test runner:

`node --test tests/*.test.mjs`

There is currently no ESLint configuration or `lint` script.

- Do not invent or run a nonexistent lint command.
- Do not add ESLint unless explicitly requested.

### Rust / Tauri changes

If anything under `src-tauri/` is modified, also run:

`cargo check`

from inside `src-tauri/`.

### Native / packaging changes

Use:

`npm run tauri build`

only when the task involves packaging, native configuration, release behavior, or when explicitly requested.

For normal frontend work, a full Tauri production build is not required.

### Development commands

Frontend only:

`npm run dev`

Native Tauri development:

`npm run tauri dev`

These are development commands, not mandatory validation steps.

### Validation failures

- Fix errors introduced by the current changes before finishing.
- If a failure clearly existed before the current task and is unrelated, report it instead of silently changing unrelated code.
- Do not claim validation passed unless the command was actually run successfully.

## Data Persistence

- Existing `data.json` files must remain readable whenever reasonably possible.
- Do not change the persisted data schema casually.
- If a persisted structure must change, consider backward compatibility and existing user data.
- Prefer safe defaults for missing fields when reading older data.
- Never silently discard, reset, or overwrite stored user data.
- File I/O failures should be surfaced appropriately instead of silently swallowed.

## React / TypeScript

- Prefer existing components and utilities over duplication.
- Maintain TypeScript type safety.
- Avoid `any` unless there is a concrete reason.
- Do not suppress TypeScript errors merely to make the build pass.
- Preserve existing state-management patterns unless the task specifically requires restructuring them.
- Handle loading, empty, error, and edge-case states where relevant.
- Preserve desktop-window responsiveness during UI changes.
- Use stable identifiers for list items and drag-and-drop behavior.
- Use `date-fns` for date/week operations when it already covers the requirement rather than introducing custom date logic unnecessarily.

## Rust / Tauri

- Follow the Rust conventions already used in the file being edited.
- Do not impose JavaScript/React patterns on Rust code.
- Any new `#[tauri::command]` must be registered in the invoke handler and correctly wired to the frontend.
- Keep Rust errors meaningful and propagate relevant failures to the UI.
- Do not change Tauri capabilities, permissions, security configuration, or application identifiers unless required by the task.
- Do not modify generated build artifacts.

## UI / UX

- Preserve existing behavior unless the requested change explicitly alters it.
- Maintain visual consistency with the existing design system.
- Prefer existing Tailwind patterns and components.
- Avoid unnecessary one-off styles.
- Check relevant empty, long-content, overflow, and resized-window states.
- Do not change unrelated screens while implementing a local UI change.

## Dependencies and Generated Files

- Do not modify `package-lock.json` unless npm dependencies actually change.
- Do not modify `Cargo.lock` unless Rust dependencies actually change.
- Do not manually edit generated output such as `dist/`, `target/`, or other build artifacts.
- Do not upgrade dependency versions as part of an unrelated task.

## Git

- Never run destructive commands such as `git reset --hard`, `git clean`, or commands that discard user work without explicit permission.
- Never revert, overwrite, or discard existing user changes without permission.
- Do not commit, amend, rebase, merge, push, or force-push unless explicitly requested.
- Do not assume an uncommitted change was created by Codex.

## Completion Standard

Before reporting a task as complete:

1. Verify the requested behavior is implemented.
2. Review the final diff for unintended changes.
3. Run the relevant validation commands.
4. Fix regressions introduced by the change.
5. Report:
   - what changed
   - validation performed
   - any remaining limitation or pre-existing failure

Do not report success merely because the code was edited.

## Token and Context Efficiency

- Follow the global RTK instructions and use RTK-compatible commands when appropriate.
- Prefer targeted file reads and searches.
- Avoid repeatedly reading unchanged files.
- Avoid dumping large command outputs when a summarized or targeted command is sufficient.
- Do not explore unrelated parts of the repository.
- Keep plans and progress updates concise.
- Spend context primarily on implementation, debugging, validation, and review.
