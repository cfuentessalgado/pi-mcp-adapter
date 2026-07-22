import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
  private?: boolean;
  pi?: { extensions?: string[] };
};

describe("package.json", () => {
  it("is private and declares its Pi extension entry point", () => {
    expect(packageJson.private).toBe(true);
    expect(packageJson.pi?.extensions).toEqual(["./index.ts"]);
  });
});
