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

## Tool: prepare_cordova_env_windows
### Input
- `downloadDir` (string, optional) Default: `./downloads`
- `install` (boolean, optional) Default: `false`
- `includeNode` (boolean, optional) Default: `true`
- `includeJdk` (boolean, optional) Default: `true`
- `includeAndroid` (boolean, optional) Default: `true`
- `includeCordova` (boolean, optional) Default: `true`
- `setEnv` (boolean, optional) Default: `false`
- `androidCmdlineToolsUrl` (string, optional) Override the Android cmdline tools zip URL

### Notes
- Android tools are extracted to `<downloadDir>\android\cmdline-tools\latest`
- When `setEnv` is true, the tool sets user-level `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and `JAVA_HOME`
- Cordova CLI is installed via `npm install -g cordova` when `install` is true

## Extending for macOS/Linux
This server currently targets Windows only. Add platform-specific URLs and installation logic if you need macOS/Linux.

## Tool: download_node_from_docs
This tool reads the local Swagger UI spec at `http://localhost:3001/api/docs/swagger-ui-init.js`,
extracts the embedded OpenAPI `swaggerDoc`, and then calls `/node/download` with parameters.

### Input
- `baseUrl` (string, optional) Default: `http://localhost:3001`
- `version` (string, optional) If empty, tries `/env/current` to get `profile.node`. Falls back to `v18.16.0`.
- `platform` (string, optional)
- `arch` (string, optional)

### Output
- A multi-line log with the Swagger init URL, the POST request, HTTP status, and raw response body.

## Local MCP Workflow (How It Works)
1. Start the MCP server with `pnpm run start`.
1. Your MCP client connects over stdio.
1. The client asks for `tools/list`, this server returns tool schemas.
1. The client calls a tool (e.g. `download_node_from_docs`) with JSON args.
1. The server:
- Fetches `http://localhost:3001/api/docs/swagger-ui-init.js`
- Parses the embedded OpenAPI JSON
- Calls the local API endpoint (e.g. `/node/download`)
- Returns the log text as the tool result
