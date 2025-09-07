# Add a new component (no build tools required)

You can add components later, one at a time, without changing tokens.

## 1) Prep the Figma component
- Make sure it uses clear variant axes (e.g., `size`, `state`, `intent`).
- Ensure colors/spacing/radius come from your Variables.
- Name the component semantically (e.g., `Button / Primary`).

## 2) Use Claude Code with Figma MCP
- Open Figma **desktop** and enable Dev Mode MCP.
- In Claude Code, select the Figma component and run a prompt like the one in `claude-prompts/new-component.txt`.

## 3) Save your component
- Create a file in your app (or a `components/` folder here), e.g. `Button.tsx`.
- Paste Claude's output. Make sure it uses the **`--ds-*`** variables (not raw hex!).
- Optionally create `Button.stories.tsx` and a small test.

## 4) (Later) Wire Figma Code Connect
- Add a small mapping file to show your real `<Button />` API inside Figma Dev Mode.
- See `CODE_CONNECT_TEMPLATE.md`.