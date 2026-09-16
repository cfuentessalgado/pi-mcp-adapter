import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_HOST_ENV = process.env.MCP_OAUTH_CALLBACK_HOST;

async function importProvider() {
  vi.resetModules();
  return await import("../mcp-oauth-provider.ts");
}

describe("OAuth callback host configuration", () => {
  afterEach(() => {
    if (ORIGINAL_HOST_ENV === undefined) {
      delete process.env.MCP_OAUTH_CALLBACK_HOST;
    } else {
      process.env.MCP_OAUTH_CALLBACK_HOST = ORIGINAL_HOST_ENV;
    }
  });

  it("reads MCP_OAUTH_CALLBACK_HOST at module load", async () => {
    process.env.MCP_OAUTH_CALLBACK_HOST = "192.168.1.129";
    const provider = await importProvider();

    expect(provider.getOAuthCallbackHost()).toBe("192.168.1.129");
    expect(provider.getAdvertisedCallbackHost()).toBe("192.168.1.129");
  });

  it("advertises localhost for wildcard binds", async () => {
    process.env.MCP_OAUTH_CALLBACK_HOST = "0.0.0.0";
    const provider = await importProvider();

    expect(provider.getOAuthCallbackHost()).toBe("0.0.0.0");
    expect(provider.getAdvertisedCallbackHost()).toBe("localhost");
  });

  it("falls back to localhost for an invalid MCP_OAUTH_CALLBACK_HOST", async () => {
    process.env.MCP_OAUTH_CALLBACK_HOST = "bad host/path";
    const provider = await importProvider();

    expect(provider.getOAuthCallbackHost()).toBe("localhost");
  });

  it("validates callback hosts", async () => {
    const provider = await importProvider();

    expect(provider.isValidCallbackHost("localhost")).toBe(true);
    expect(provider.isValidCallbackHost("0.0.0.0")).toBe(true);
    expect(provider.isValidCallbackHost("::")).toBe(true);
    expect(provider.isValidCallbackHost("myhost.tailnet.ts.net")).toBe(true);
    expect(provider.isValidCallbackHost("")).toBe(false);
    expect(provider.isValidCallbackHost("bad host")).toBe(false);
    expect(provider.isValidCallbackHost("bad/path")).toBe(false);
  });

  it("builds the redirect URL from the advertised host", async () => {
    process.env.MCP_OAUTH_CALLBACK_HOST = "192.168.1.129";
    const provider = await importProvider();
    const { McpOAuthProvider } = provider;

    const authProvider = new McpOAuthProvider("svc", "https://api.example.com/mcp", {}, {
      onRedirect: async () => {},
    });

    expect(authProvider.redirectUrl).toBe("http://192.168.1.129:19876/callback");
  });
});
