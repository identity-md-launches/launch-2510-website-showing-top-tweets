# Pond · IdentityMD

A dark green, responsive feed of top public tweets about IdentityMD, with custom AI-equipped Pepe artwork. Search the collection, filter by topic, sort by captured likes or publication date, expand context, open originals on X, and save posts in this browser.

The nine cards are **summaries of real public posts captured on 24 October 2026**, not verbatim tweets or a live X feed. “Top liked” ranks this selected collection. Original links and captured counts are documented in [sources](artifacts/sources.md). No account, wallet, backend, API key, or external runtime assets are required.

## Install and develop

Use Node.js 22.12 or later and npm.

```sh
npm ci
npm run dev
```

## Build and preview

```sh
npm run typecheck
npm run build
npm run preview
```

`dist/index.html` and all required assets are included. Serve `dist/` with any static HTTP server. Vite's `base: './'` and relative asset URLs support a gateway subpath. Navigation stays on one page; there are no server routes or rewrite requirements. Opening HTML directly with `file://` is not a supported preview because browsers restrict JavaScript modules there.

The runtime consists of bundled React, local post data, a local Manrope font, local author avatars, SVG artwork, a favicon, and a PNG share image. The site makes no external requests until a visitor opens an X link.

## Interaction validation

The validation script serves the actual export at `/preview/`, starts its own browser, exercises the site, and closes its server and browser on completion.

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pond-browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/pond-browsers npm run validate
```

It writes temporary results and screenshots to `test/scratch/validation/`; nothing there is required to build the site. WebKit is attempted when installed and its unavailability is reported as a limitation. The script also runs Axe against the feed and the About dialog.

To regenerate the share image, with the same browser setup:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pond-browsers node scripts/share-card.mjs
npm run build
```

The supplied design probe, while its pinned input exists, is:

```sh
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The pinned inputs are not runtime dependencies and are removed from the submission. The final recorded probe results remain in `artifacts/taste-results.json`.

## Actual validation results

The final production build and TypeScript check completed successfully. Dependencies were installed outside the repository for this assignment; the worker used the following equivalent commands with temporary module-resolution configuration:

```sh
/tmp/pond-toolchain/node_modules/.bin/tsc --noEmit --project /tmp/pond-toolchain/pond.tsconfig.json
/tmp/pond-toolchain/node_modules/.bin/vite build --config /tmp/pond-toolchain/pond.vite.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/pond-browsers node scripts/validate.mjs --playwright=/tmp/pond-checks/node_modules/playwright/index.mjs --axe=/tmp/pond-checks/node_modules/@axe-core/playwright/dist/index.mjs
IMD_PLAYWRIGHT=/tmp/pond-checks/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/pond-browsers node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

- Production build: **passed**, Vite 7.3.7; JavaScript 216.55 kB, CSS 20.18 kB before gzip.
- Typecheck: **passed**, TypeScript 5.9.3, no diagnostics.
- Interaction and layout validation: **35 passed, 0 failed** in Chromium, including static subpath loading, all filters, search and empty recovery, both sort orders, context disclosure, bookmark persistence, storage failure recovery, clipboard success/fallback, modal focus and dismissal, keyboard navigation, reduced motion, 200% text enlargement, and RTL reflow.
- Layout: no horizontal overflow at **320, 390, 768, 1024, and 1440 CSS pixels**. The 390 × 844 opening screen includes the product, Explore action, search, first post, and its original-link action.
- Automated accessibility: **0 Axe violations** in the feed and About dialog for the tested WCAG A/AA tags.
- Design probe: **16/16 passed**; no reported layout overlap, clipping, contrast failure, or missing share metadata.
- Console and resources: **0 page errors, 0 failed local resources** in the interaction run; browser tool inspection also reported no console errors or warnings.

WebKit could not launch in the available browser runtime. Safari, physical devices, screen-reader sessions, and native browser zoom remain unverified. The 200% check enlarged text through the root font size; it was not native zoom. External X destination availability and the authors' claims were not independently certified. Several secondary controls are 32–40 px high; all tested controls passed the probe's 24 px/spacing baseline.

See [the consolidated review](artifacts/validation.md), [design system](DESIGN.md), and [recorded interaction results](artifacts/interaction-results.json). These are worker-side observations, not independent verifier certification.

## Updating the collection

Edit `src/posts.json`. Preserve the original post URL and publication date, capture actual engagement counts, and write a clearly attributed summary and context. Keep each topic in the existing `AI agents`, `Building`, or `Community` vocabulary, or update the topic controls together. The result count and topic totals are computed from the collection.

Update the capture-date text in `src/main.tsx` and the source record when refreshing the snapshot. Add any new avatar to `public/avatars/`, then typecheck, rebuild, and validate. Browser bookmarks only contain post IDs and remain local to that browser; unavailable storage falls back to the current visit.

Design guidance and font attributions are preserved in [third-party notices](docs/third-party/NOTICE.md). No ignore file was changed, and dependency directories, browser downloads, caches, and dependency archives are not part of this repository's deliverable.
