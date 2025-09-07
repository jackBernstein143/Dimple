# Code Connect template (React)

Once you have a real component, you can map it to a Figma component so Dev Mode shows your exact API.

```tsx
// Button.figma.tsx (example mapping)
import * as React from "react";
import { Button } from "./Button";

// The `examples` export shows how your component renders with props that
// correspond to Figma variants.
export const examples = [
  {
    name: "Primary",
    render: () => <Button>Primary</Button>,
    // controls: { size: ["sm","md","lg"], variant: ["primary","secondary"] } // optional controls
  },
  {
    name: "Secondary",
    render: () => <Button variant="secondary">Secondary</Button>,
  },
];
```

**Publish** with the Code Connect CLI and select your DS file:
```
npx @figma/code-connect publish
```
(You’ll need a personal access token with Code Connect permissions.)