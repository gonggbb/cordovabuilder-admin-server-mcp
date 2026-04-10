# cordovabuilder-admin-server-mcp

An MCP server that downloads installers and tooling needed for a Cordova build environment on Windows.

## Tools

- `prepare_cordova_env_windows`
- `download_node_from_docs`

## What it does

- Downloads Node.js (Windows x64 MSI)
- Downloads a JDK (Adoptium Temurin)
- Downloads Android command line tools
- Optionally installs Node.js, JDK, and Cordova CLI
- Optionally sets user environment variables

## Requirements

- Windows
- Node.js 18+ to run the MCP server
- If `install` is true, you may need Administrator privileges

## Quick start

```bash
pnpm install
pnpm run build
pnpm run start
```
