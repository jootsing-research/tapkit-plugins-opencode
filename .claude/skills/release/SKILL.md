---
name: release
description: Walk through releasing @jootsing-research/opencode-tapkit to npm through GitHub Actions.
argument-hint: "<version>"
---

# Release OpenCode TapKit

Release a new version of the `@jootsing-research/opencode-tapkit` npm package.

## How It Works

Publishing is triggered by pushing a git tag matching `v*` to the `origin` remote. GitHub Actions runs `.github/workflows/publish.yml`, builds the project, typechecks it, and runs `npm publish --access public`.

## Steps

1. Bump the version in `package.json` and `package-lock.json`:

   ```bash
   npm version <version> --no-git-tag-version
   ```

2. Run local validation:

   ```bash
   npm ci
   npm run typecheck
   npm run build
   npm pack --dry-run
   ```

3. Commit the version bump:

   ```bash
   git add package.json package-lock.json
   git commit -m "Bump version to <version>"
   ```

4. Create and push the tag:

   ```bash
   git tag v<version>
   git push origin main
   git push origin v<version>
   ```

5. Verify the publish workflow:

   ```text
   https://github.com/Jootsing-Research/tapkit-plugins-opencode/actions
   ```

## Prerequisites

- The GitHub repo must have an Actions secret named `NPM_TOKEN`.
- The token must have permission to publish `@jootsing-research/opencode-tapkit`.
- The version in `package.json` must not already exist on npm.

## Version Guidance

- Patch: docs, packaging fixes, small compatibility fixes
- Minor: new workflow support, new skills, backwards-compatible plugin features
- Major: breaking install/config behavior
