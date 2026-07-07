// src/lib/assets/help-assets/index.ts

// Vite loads every .md in this folder as raw text at build time
const modules = import.meta.glob("./*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const helpContent: Record<string, string> = {};

for (const path in modules) {
  // "./t1.md" -> "t1"
  const id = path.replace("./", "").replace(".md", "");
  helpContent[id] = modules[path] as string;
}
