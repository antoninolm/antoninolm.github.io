# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

Open `index.html` in a browser directly, or use VS Code Live Server (configured on port 5501). There is no build step, no bundler, and no package manager.

## Architecture

This is a **zero-JavaScript, single-page portfolio** built with plain HTML and CSS. Interactivity is achieved entirely through CSS: hidden `<input type="checkbox">` and `<input type="radio">` elements with class `.state-input` act as state toggles, and their `:checked` state drives sibling elements via the CSS `~` combinator. The two main toggles in `index.html` are `#theme-toggle` (light/dark) and `#nav-toggle` (mobile drawer).

### CSS layer order

The stylesheet is split into six files, loaded in this order in `index.html`:

| File | Purpose |
|---|---|
| `css/reset.css` | Minimal modern reset |
| `css/tokens.css` | All design tokens — colors, type scale, spacing, borders, motion |
| `css/base.css` | Element defaults, reusable classes (`.btn`, `.section-label`, `.dot`) |
| `css/layout.css` | Page chrome (sticky header, footer) and section frames; breakpoints at 641px and 1024px |
| `css/components.css` | Section-specific components (project cards, skill grid, contact form, hero, etc.) |
| `css/interactive.css` | All `:checked`-state rules — theme switching, nav drawer, project filter tabs |

> **Note:** `components.css` and `interactive.css` are referenced in `index.html` but do not yet exist. They need to be created.

### Theming

Dark theme tokens live in `tokens.css` under the `.theme-dark` class and a `@media (prefers-color-scheme: dark)` block. The interactive toggle in `interactive.css` applies `.theme-dark` to `<html>` when `#theme-toggle` is checked, and `.theme-light` to suppress the OS preference when the user opts into light mode manually.

### Project pages

Each sub-project under `projects/` is self-contained (`index.html` + `style.css`). They do not share the main stylesheet.

### Design language

The site uses a brutalist aesthetic: monospace type (`--font-mono`), thick hard box-shadows, 2–3px solid borders, and `--accent: #ff3a00` (orange) as the only color accent. All interactive states (hover, focus) use this accent. Keep new components consistent with this language.
