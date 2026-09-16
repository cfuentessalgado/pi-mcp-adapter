# Changelog

All notable changes to this fork are documented in this file.

## [Unreleased]

### Changed
- Distribution now uses the Git repository: `pi install git:github.com/cfuentessalgado/pi-mcp-adapter`.
- Marked the package private and removed npm publishing metadata and artifacts.
- `/mcp-auth <server>` now always shows the authorization URL with the local callback endpoint and an SSH tunnel example, then asks Open / Skip before launching the browser. Choosing Skip or pressing Escape keeps the flow alive: Skip waits for the callback so the user can tunnel the port first; Escape cancels the pending auth.
- The MCP panel now shows the authorization URL (as a clickable OSC 8 hyperlink), the callback endpoint, and a tunnel hint inside the panel while auth runs, instead of only in the conversation below the modal.
- New env var `MCP_OAUTH_CALLBACK_HOST` binds the OAuth callback server to a chosen interface (`0.0.0.0`, a LAN IP, a tailscale hostname, an IPv6 literal, ...). It wins over the host derived from `oauth.redirectUri`. The advertised `redirect_uri` host follows the configured bind host, except wildcard binds (`0.0.0.0`, `::`), which keep advertising `localhost` for tunnel setups.
- `oauth.redirectUri` now accepts any hostname, not only loopback, so the auth server can redirect straight to the machine (e.g. a tailscale name). Still requires `http://`, an explicit numeric port, and no fragment or credentials.
- The console fallback (no UI) prints the same URL plus callback endpoint and tunnel hint.
