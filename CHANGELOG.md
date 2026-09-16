# Changelog

All notable changes to this fork are documented in this file.

## [Unreleased]

### Changed
- Distribution now uses the Git repository: `pi install git:github.com/cfuentessalgado/pi-mcp-adapter`.
- Marked the package private and removed npm publishing metadata and artifacts.
- `/mcp-auth <server>` now always shows the authorization URL with the local callback endpoint and an SSH tunnel example, then asks Open / Skip before launching the browser. Choosing Skip or pressing Escape keeps the flow alive: Skip waits for the callback so the user can tunnel the port first; Escape cancels the pending auth. The MCP panel keeps the old notify-only behavior to avoid dialog conflicts while the panel is open.
- The console fallback (no UI) prints the same URL plus callback endpoint and tunnel hint.
