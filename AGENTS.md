# my-vinyl

## Rules

- **Never run `git commit`, `git push`, or any git command that writes to or modifies repository history or remotes.** If a task requires committing or pushing, stop and tell the user to run the git command manually.
- **Never add a `Co-Authored-By` trailer or a "Generated with Claude Code" line** to commit messages or PR descriptions, including in suggested commit messages. Commits are authored by the user alone.
- **When debugging, always list every command used** - show the command, what it does, and why - so the user can learn the debugging workflow. Do this inline as you debug, not as a summary at the end.

### Pre-commit safety check

Before telling the user to commit, always run `/security-review`. It reviews the pending changes on the current branch for security issues. Once it confirms the changes are safe, offer the user a suggested commit message - do not run `git commit` yourself.

## What this app is

A single-page Angular app that browses any [Discogs](https://www.discogs.com/) user's vinyl record collection. The user types a Discogs username into the search bar; the app pages through the Discogs-backed API and renders the collection as a responsive square grid of album covers. Hovering a card shows a popup with artist, title, year, and label. Clicking a card opens the release on Discogs in a new tab.

The backend API URL is read from `/config.json` at load, so one image runs in any environment. The platform serves it from the Spa's `publicConfig`; `public/config.json` is the dev default that prod overrides. The frontend is a pure static Angular build served by nginx in a Docker container.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular, standalone components, `ChangeDetectionStrategy.OnPush` |
| State | Angular Signals only, with no NgRx and no BehaviorSubject |
| Styling | Plain CSS custom properties, no preprocessor |
| Tests | Jest via `jest-preset-angular` |
| Build | Angular CLI + `ng build` |
| Container | Multi-stage Docker build onto `ghcr.io/cujarrett/base-spa` (nginx) |

## Project structure

```
src/app/
  app.config.ts          # Bootstrap, HttpClient provider, config initializer
  app.routes.ts          # Routes (single route → Collection)
  app.ts                 # Root component
  collection/
    collection.ts        # Main page component: fetches pages, owns grid state
    collection.html
    collection.css
    vinyl-card/
      vinyl-card.ts      # Card component: hover popup, link to Discogs
      vinyl-card.html
      vinyl-card.css
  core/
    config.service.ts    # Loads /config.json before bootstrap; exposes apiUrl
    vinyl.model.ts       # CollectionItem, CollectionPage interfaces
    vinyl.service.ts     # HttpClient wrapper for the backend API
public/
  config.json            # Dev default, proxied via proxy.conf.json
```

## Key conventions

- **Signals over observables** for component state. `computed()` for derived values. `firstValueFrom()` to bridge HTTP observables into the async fetch loop.
- **No state management library.** Keep state in the component that owns it.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **CSS custom properties** for theming (`--color-accent`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-error`, `--font-sans`). Defined in `src/styles.css`.
- **No external component libraries.** Plain HTML + CSS only.
- **Grug-brained.** See [Philosophy](#philosophy-grug-brained-development) below.

## Philosophy: Grug-Brained Development

> "Complexity very, very bad." - [grugbrain.dev](https://grugbrain.dev/)

- **Say no.** The best weapon against complexity is the word "no". No new feature, no new abstraction, until it earns its place.
- **Cheapest rung that works.** Before writing code go down the ladder and stop at the first rung that solves it - skip the feature, reuse code already here, standard library, native platform feature, a dependency already installed, one line, then build the minimum.
- **No abstraction until a pattern repeats three times.** Let cut points emerge naturally from the code; don't invent them up front.
- **80/20 solutions.** Ship 80% of the value with 20% of the code. Ugly but working beats elegant but over-engineered.
- **Chesterton's Fence.** Understand why code exists before removing it. If you don't see the use, go away and think.
- **Boring, obvious code wins.** Intermediate variables with good names beat clever one-liners. Easier to debug.
- **DRY is not a law.** A little copy-paste beats a complex abstraction built for two cases.
- **No FOLD** (Fear Of Looking Dumb). If something is too complex, say so. That's a signal to simplify, not a personal failing.

## Grid layout

Column count is a `computed` derived from `vpWidth`, `vpHeight`, and `totalItems` signals. It targets a roughly square overall grid based on the viewport aspect ratio:

```ts
cols = Math.max(1, Math.round(Math.sqrt(n * W / H)))
```

Resize is handled via `@HostListener('window:resize')` updating `vpWidth`/`vpHeight` signals, which re-derives `cols` automatically.

## Content moderation

Specific release IDs can be flagged to show a blurred cover instead of the original image. Currently flagged:

- `33280299`: Dr. Dre, *2001* (not HR-friendly)

Handled directly in `vinyl-card.html` with `@if (item().id === ...)`. Add new IDs there if needed.

## Commands

```bash
npm install
npm start          # Angular dev server on :4200, proxies /api to the backend
npm test           # Jest
npm run build      # Production build to dist/my-vinyl/browser/
docker build -t my-vinyl . && docker run -p 8080:80 my-vinyl
```

## Deployment Context

The app runs as a `Spa` on the homelab platform. The workspace file is `my-vinyl/my-vinyl.yaml` in [homelab-workspaces](https://github.com/cujarrett/homelab-workspaces).

- **Image:** a static build copied into `/usr/share/nginx/html`, with no server-side runtime.
- **CI:** on a push to `main`, `.github/workflows/cicd.yml` pushes `ghcr.io/cujarrett/my-vinyl` tagged `latest`, `main` and `sha-<full-sha>`. It then updates the tag in the workspace file, and ArgoCD rolls it out.
- **Public URL:** `myvinyl.mattjarrett.dev`, through Cloudflare Tunnel.
- **API:** the platform's nginx proxies `/api/` to `my-vinyl-api`. `publicConfig.apiUrl` in the workspace file becomes `/config.json`.
- **nginx config:** the platform generates it. This repo ships none.
- **Content Security Policy:** set `contentSecurityPolicy` in the workspace file.
- **Manifests, TLS and DNS:** the [homelab](https://github.com/cujarrett/homelab) repo owns them.
