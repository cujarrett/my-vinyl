# my-vinyl

## Rules

- **Never run `git commit`, `git push`, or any git command that writes to or modifies repository history or remotes.** If a task requires committing or pushing, stop and tell the user to run the git command manually.
- **When debugging, always list every command used** — show the command, what it does, and why — so the user can learn the debugging workflow. Do this inline as you debug, not as a summary at the end.

### Pre-commit safety check

Before telling the user to commit, always run `/security-review`. It reviews the pending changes on the current branch for security issues. Once it confirms the changes are safe, offer the user a suggested commit message — do not run `git commit` yourself.

## What this app is

A single-page Angular app that browses any [Discogs](https://www.discogs.com/) user's vinyl record collection. The user types a Discogs username into the search bar; the app pages through the Discogs-backed API and renders the collection as a responsive square grid of album covers. Hovering a card shows a popup with artist, title, year, and label. Clicking a card opens the release on Discogs in a new tab.

The backend API lives at `https://my-vinyl-api.mattjarrett.dev` (configured via `src/environments/`). The frontend is a pure static Angular build served by nginx in a Docker container.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular 21, standalone components, `ChangeDetectionStrategy.OnPush` |
| State | Angular Signals only — no NgRx, no BehaviorSubject |
| Styling | Plain CSS custom properties, no preprocessor |
| Tests | Jest via `jest-preset-angular` |
| Build | Angular CLI + `ng build` |
| Container | Multi-stage Docker build → nginx:alpine |

## Project structure

```
src/app/
  app.config.ts          # Bootstrap, HttpClient provider
  app.routes.ts          # Routes (single route → Collection)
  app.ts                 # Root component
  collection/
    collection.ts        # Main page component — fetches pages, owns grid state
    collection.html
    collection.css
    vinyl-card/
      vinyl-card.ts      # Card component — hover popup, link to Discogs
      vinyl-card.html
      vinyl-card.css
  core/
    vinyl.model.ts       # CollectionItem, CollectionPage interfaces
    vinyl.service.ts     # HttpClient wrapper for the backend API
src/environments/
  environment.ts         # Dev: proxied via proxy.conf.json
  environment.prod.ts    # Prod: https://my-vinyl-api.mattjarrett.dev
```

## Key conventions

- **Signals over observables** for component state. `computed()` for derived values. `firstValueFrom()` to bridge HTTP observables into the async fetch loop.
- **No state management library.** Keep state in the component that owns it.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **CSS custom properties** for theming (`--color-accent`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-error`, `--font-sans`). Defined in `src/styles.css`.
- **No external component libraries.** Plain HTML + CSS only.
- **Grug-brained** — see [Philosophy](#philosophy-grug-brained-development) below.

## Philosophy: Grug-Brained Development

> "Complexity very, very bad." — [grugbrain.dev](https://grugbrain.dev/)

- **Say no.** The best weapon against complexity is the word "no". No new feature, no new abstraction, until it earns its place.
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

- `33280299` — Dr. Dre, *2001* (not HR-friendly)

Handled directly in `vinyl-card.html` with `@if (item().id === ...)`. Add new IDs there if needed.

## Running locally

```bash
npm install
npm start          # Angular dev server on :4200, proxies /api → backend
```

## Building

```bash
npm run build      # Production build to dist/my-vinyl/browser/
```

## Docker

```bash
docker build -t my-vinyl .
docker run -p 8080:80 my-vinyl
```

## Tests

```bash
npm test
```

## Deployment Context

This app is deployed on a self-hosted k3s homelab cluster via GitOps.

This is a **static SPA** served by nginx. The platform expects:
- A Docker image based on nginx with the built app copied into `/usr/share/nginx/html`
- A `/healthz` route that returns HTTP 200 (nginx stub_status or a static file)
- No server-side runtime — build output only

The image is defined as an `XSpa` Crossplane composite resource in the homelab repo at:
`platform/xrs/spa/my-vinyl.yaml`

On merge to `main`, CI (`.github/workflows/cicd.yml`) builds and pushes `ghcr.io/${{ github.repository }}` tagged `latest` and `sha-<full-sha>`. ArgoCD in the homelab detects the new image → Crossplane updates the Deployment → Kubernetes rolls out.

### Runtime environment

| Property | Value |
|---|---|
| Cluster | k3s, 4x Raspberry Pi 5, ARM64 |
| Ingress | Traefik, TLS via cert-manager |
| Public URL | `myvinyl.mattjarrett.dev` via Cloudflare Tunnel |
| TLS issuer | `letsencrypt-prod` |
| Replicas | 1 |
| CPU | request 50m / limit 200m |
| Memory | request 64Mi / limit 128Mi |

### Content Security Policy

The platform overwrites `/etc/nginx/conf.d/default.conf` at runtime via a ConfigMap volume mount. Any CSP or security headers in the image's `nginx.conf` are ignored in the cluster. To change CSP in production, update `contentSecurityPolicy` in `cujarrett/homelab` → `platform/xrs/spa/<app>.yaml`.

### What this repo does NOT own

- Kubernetes manifests — all in `cujarrett/homelab`
- TLS certificates — managed by cert-manager in the cluster
- DNS — managed by Cloudflare / AdGuard in the cluster
- nginx config — generated by the Crossplane Composition, not this repo
