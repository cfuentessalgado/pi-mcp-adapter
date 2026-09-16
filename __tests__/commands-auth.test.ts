import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  removeAuth: vi.fn(),
}));

vi.mock("../mcp-auth-flow.ts", () => ({
  authenticate: mocks.authenticate,
  removeAuth: mocks.removeAuth,
  supportsOAuth: (definition: { url?: string; auth?: string }) => Boolean(definition.url) && definition.auth !== "bearer",
  formatAuthorizationUrlMessage: (serverName: string, authorizationUrl: string) =>
    `Open this URL to authenticate ${serverName}:\n\n${authorizationUrl}\n\nAfter approving, return to Pi; the local callback will complete automatically.`,
  extractCallbackEndpoint: () => null,
}));

vi.mock("../init.ts", () => ({
  getFailureAgeSeconds: vi.fn(() => null),
  lazyConnect: vi.fn(),
  updateMetadataCache: vi.fn(),
  updateStatusBar: vi.fn(),
}));

describe("authenticateServer", () => {
  it("surfaces the exact OAuth URL through UI notification", async () => {
    const authorizationUrl = "https://auth.example.com/authorize?resource=https%3A%2F%2Fmcp.sentry.dev%2Fmcp";
    mocks.authenticate.mockImplementationOnce(async (_name, _url, _definition, options) => {
      await options.onAuthorizationUrl(authorizationUrl);
      return "authenticated";
    });
    const ui = { notify: vi.fn(), setStatus: vi.fn() };
    const { authenticateServer } = await import("../commands.ts");

    const result = await authenticateServer("sentry", {
      mcpServers: {
        sentry: { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      },
    }, { hasUI: true, ui } as any);

    expect(result.ok).toBe(true);
    expect(mocks.authenticate).toHaveBeenCalledWith(
      "sentry",
      "https://mcp.sentry.dev/mcp",
      { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      { onAuthorizationUrl: expect.any(Function) },
    );
    expect(ui.notify).toHaveBeenCalledWith(
      expect.stringContaining(authorizationUrl),
      "info",
    );
  });

  it("forwards the authorization URL to displayAuthUrl when provided", async () => {
    const authorizationUrl = "https://auth.example.com/authorize";
    mocks.authenticate.mockImplementationOnce(async (_name, _url, _definition, options) => {
      await options.onAuthorizationUrl(authorizationUrl);
      return "authenticated";
    });
    const ui = { notify: vi.fn(), setStatus: vi.fn() };
    const displayAuthUrl = vi.fn();
    const { authenticateServer } = await import("../commands.ts");

    await authenticateServer("sentry", {
      mcpServers: {
        sentry: { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      },
    }, { hasUI: true, ui } as any, { displayAuthUrl });

    expect(displayAuthUrl).toHaveBeenCalledWith(authorizationUrl, null);
    expect(ui.notify).toHaveBeenCalledWith(expect.stringContaining(authorizationUrl), "info");
  });

  it("prompts Open/Skip when the prompt option is enabled", async () => {
    const authorizationUrl = "https://auth.example.com/authorize";
    mocks.authenticate.mockImplementationOnce(async (_name, _url, _definition, options) => {
      await options.onAuthorizationUrl(authorizationUrl);
      return "authenticated";
    });
    const ui = { notify: vi.fn(), setStatus: vi.fn(), select: vi.fn().mockResolvedValue("Open") };
    const { authenticateServer } = await import("../commands.ts");

    const result = await authenticateServer("sentry", {
      mcpServers: {
        sentry: { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      },
    }, { hasUI: true, ui } as any, { prompt: true });

    expect(result.ok).toBe(true);
    expect(ui.select).toHaveBeenCalledWith(
      expect.stringContaining(authorizationUrl),
      ["Open", "Skip (open it manually)"],
    );
  });

  it("returns false from onAuthorizationUrl when the user skips the browser", async () => {
    const authorizationUrl = "https://auth.example.com/authorize";
    mocks.authenticate.mockImplementationOnce(async (_name, _url, _definition, options) => {
      const decision = await options.onAuthorizationUrl(authorizationUrl);
      expect(decision).toBe(false);
      return "authenticated";
    });
    const ui = { notify: vi.fn(), setStatus: vi.fn(), select: vi.fn().mockResolvedValue("Skip (open it manually)") };
    const { authenticateServer } = await import("../commands.ts");

    const result = await authenticateServer("sentry", {
      mcpServers: {
        sentry: { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      },
    }, { hasUI: true, ui } as any, { prompt: true });

    expect(result.ok).toBe(true);
  });

  it("cancels authentication when the prompt is dismissed", async () => {
    const authorizationUrl = "https://auth.example.com/authorize";
    mocks.authenticate.mockImplementationOnce(async (_name, _url, _definition, options) => {
      await options.onAuthorizationUrl(authorizationUrl);
      return "authenticated";
    });
    const ui = { notify: vi.fn(), setStatus: vi.fn(), select: vi.fn().mockResolvedValue(undefined) };
    const { authenticateServer } = await import("../commands.ts");

    const result = await authenticateServer("sentry", {
      mcpServers: {
        sentry: { url: "https://mcp.sentry.dev/mcp", auth: "oauth" },
      },
    }, { hasUI: true, ui } as any, { prompt: true });

    expect(result.ok).toBe(false);
    expect(ui.notify).toHaveBeenCalledWith(
      expect.stringContaining("Authentication cancelled"),
      "warning",
    );
  });
});
