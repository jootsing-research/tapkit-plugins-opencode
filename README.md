# TapKit Plugins for OpenCode

Control a physical iPhone from OpenCode through the TapKit MCP server and reusable iOS app skills.

This repository is intentionally different from the Claude and Codex TapKit plugin repositories. OpenCode loads JavaScript/TypeScript plugins, skills, and MCP servers through separate mechanisms, so this package keeps those responsibilities separate:

- OpenCode plugin: a small helper module with TapKit guidance and session context.
- OpenCode MCP config: connects OpenCode to `https://mcp.tapkit.ai/mcp`.
- OpenCode skills: app-specific TapKit manuals under `.opencode/skills`.

## Requirements

- [OpenCode](https://opencode.ai)
- A TapKit account at [tapkit.ai](https://tapkit.ai)
- TapKit Mac app running with a connected iPhone
- TapKit authentication for the remote MCP server

## Local Development

From this repository:

```sh
npm install
npm run build
```

This checkout already includes a local OpenCode config, a local plugin at `.opencode/plugins/tapkit.ts`, and OpenCode-discoverable skills at `.opencode/skills`.

To install this local package into another OpenCode project before publishing:

```sh
opencode plugin /absolute/path/to/tapkit-plugins-opencode
```

Do not run `opencode plugin tapkit`: `tapkit` is the TapKit CLI package on npm, not this OpenCode plugin package.

Use the setup script in dry-run mode to inspect what it would install into another project:

```sh
node scripts/setup.mjs --dry-run --project
```

Then verify OpenCode sees the config, skills, and MCP server:

```sh
opencode debug config
opencode debug skill
opencode mcp list
opencode mcp auth tapkit
```

## OpenCode Config

The core config shape is:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@jootsing-research/opencode-tapkit"],
  "skills": {
    "paths": [".opencode/skills"]
  },
  "mcp": {
    "tapkit": {
      "type": "remote",
      "url": "https://mcp.tapkit.ai/mcp",
      "enabled": true
    }
  }
}
```

See [opencode.json.example](./opencode.json.example) for the full example with skill permissions.

## Skills

The package bundles the shared TapKit skills plus the Reddit skill from the Codex/Claude packages:

- `tapkit`
- `tapkit-cli`
- `clock`
- `craigslist`
- `facebook`
- `hinge`
- `instagram`
- `linkedin`
- `mail`
- `reddit`
- `telegram`
- `tiktok`
- `twitter`
- `uber-eats`
- `weather`
- `whatsapp`

Run this after updating the root `skills/` directory to refresh OpenCode's local discovery copy:

```sh
npm run sync:skills
```

To sync from a checkout of the shared skills repository:

```sh
node scripts/sync-skills.mjs ../skills
```

## Usage

After setup and MCP authentication, prompts should reference the relevant skill:

```text
Use the tapkit skill. What phones can you see right now?
```

```text
Use the tapkit and weather skills. Check the weather in Tokyo on my iPhone.
```

The control loop is always:

```text
list phones -> screenshot -> act -> screenshot to verify
```

## Publishing

OpenCode installs plugins from npm rather than a Codex-style marketplace. Once published, users can install the package with:

```sh
opencode plugin @jootsing-research/opencode-tapkit
npx @jootsing-research/opencode-tapkit --global
```

The first command registers the plugin package. The second command installs TapKit MCP config and bundled skills.
