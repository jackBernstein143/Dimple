# Dimple Tokens — Portable Suitcase (tokens-only)

This folder is your **carry-on**: drop it into any project to get your tokens + a stable `--ds-*` variable API.

## Files
- `tokens.css` — your Light/Dark CSS variables (generated from Figma)
- `theme.css` — project-stable aliases like `--ds-bg`, `--ds-text`, `--ds-accent` mapped to your tokens
- `demo.html` — open in a browser to preview tokens and toggle dark mode
- `ADD_COMPONENT.md` — step-by-step to add components later with Claude Code + Figma MCP
- `CODE_CONNECT_TEMPLATE.md` — how to wire components back into Figma with Code Connect
- `claude-prompts/new-component.txt` — copy-paste prompt for generating a component

## Use in ANY app
Import once (e.g., in `globals.css` or your main CSS):
```css
@import "./your/path/tokens.css";
@import "./your/path/theme.css";
```

Then just style with the `--ds-*` variables or build components that reference them.

## Dark mode
Switch by setting `data-theme="dark"` on `<html>` or `<body>` (your tokens.css contains the dark overrides).

## Next steps
When you're ready, open `ADD_COMPONENT.md` and follow the instructions to generate your first component.