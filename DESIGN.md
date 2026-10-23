# Pond design system

## Overview

Pond is an independent reading and discovery interface for the IdentityMD conversation. The requested dark green palette and AI-equipped Pepe theme are carried by forest surfaces, lime actions, and the repository-authored vector operators in `public/pepe-ops.svg`. The feed is the product: a short introduction leads directly into filters and real post summaries.

The source of truth is `src/styles.css`; `src/main.tsx` defines the `App`, `TweetCard`, and `Icon` patterns. Prefer the existing type scale, semantic colors, and control states when extending the interface.

## Colors

Colors are declared as sRGB hex semantic properties in `:root`. The artwork has its own illustrative palette; do not use its colors as new interface tokens.

| Tokens | Values | Role |
| --- | --- | --- |
| `--bg` | `#091a11` | Page and header |
| `--surface`, `--surface-raised`, `--surface-hover` | `#10251a`, `#172e20`, `#193322` | Cards/search, selected/raised surfaces, hover states |
| `--text`, `--muted`, `--body-text` | `#e8eedf`, `#a4b4a2`, `#c8d3c3` | Headings/primary labels, metadata, post summaries/context |
| `--line` | `#294032` | Structural separators and card outlines |
| `--control-border`, `--selected-border` | `#66825b` | Input/outlined action boundaries and selected topic boundary |
| `--accent`, `--accent-hover`, `--accent-ink` | `#b9ed80`, `#d0f5a6`, `#13210e` | Primary action, hover, dark text on lime |
| `--focus` | `#d7ff9c` | Keyboard focus outline |
| `--featured-bg`, `--featured-banner`, `--featured-border`, `--featured-divider` | `#142a1c`, `#1c3522`, `#4b6641`, `#3d5737` | Highest-liked post and its ranking strip |
| `--network-bg`, `--network-text`, `--network-line` | `#1b3220`, `#c0d0b8`, `#4a6442` | Supporting network panel |
| `--backdrop`, `--image-outline`, `--toast-shadow` | `#020b07cc`, `#ffffff1a`, `#0004` | Modal backdrop, avatar outline, notification elevation |

Measured pairs: primary text/page **15.18:1**, muted text/page **8.25:1**, muted text/card **7.40:1**, summary/featured surface **9.84:1**, primary-button text/fill **12.38:1**. Search and selected-control boundaries are **3.77:1** and **3.39:1** against their fills. See `artifacts/contrast-results.json` for the pairs. The focus ring is 2 px with a 4 px offset, so the surrounding dark surface separates it from the lime button fill.

There is one implemented dark theme. Saved state also changes the bookmark shape; selected controls expose their state semantically and with an outline/fill, rather than using hue alone.

## Typography

Manrope is bundled in `public/fonts/manrope-latin.woff2` and loaded through `@font-face` with `font-display: swap`, normal style, and a declared 400–800 weight range. Fallbacks are Arial and sans-serif. The browser confirmed the Manrope face loaded. Interface weights are 400, 600, and 800; no italic style is used.

| Token | Size at the default root | Use |
| --- | --- | --- |
| `--s-xs` | 12 px / 0.75 rem | Metadata, topic filters, compact secondary actions |
| `--s-sm` | 14 px / 0.875 rem | Navigation, normal card summaries, secondary buttons |
| `--s-body` | 16 px / 1 rem | Prominent body copy, mobile inputs/action, card titles |
| `--s-section` | 20 px / 1.25 rem | Section headings and featured desktop title |
| `--s-title` | 32 px / 2 rem | Wordmark, mobile headline, dialog title |
| `--s-display` | 48 px / 3 rem | Desktop headline |

Headlines use 1.1–1.12 line height and -0.05/-0.045 em tracking. Smaller titles use -0.015 to -0.02 em and 1.4 line height. Post summaries use 1.7; general prose uses 1.6. Metadata has natural spacing. Counts and engagement numbers use tabular numerals. Headings balance where appropriate, descriptions use pretty wrapping, and handles can wrap anywhere rather than losing content. The featured summary is limited to 65 characters of measure. There is no text clamping.

## Layout

`.page-shell` and `.header-content` share a 1320 px maximum outer width. Their normal inline padding is 32 px, reducing to 24, 20, and 16 px at the implemented breakpoints. The major spacing vocabulary is 4, 8, 12, 16, 20, 24, 32, and 48 px; a few smaller optical offsets align icons and illustrations.

The desktop `.workspace` has a flexible feed and 276 px sidebar with a 32 px gap. `.tweet-grid` uses two equal columns with 16 px gaps. The highest-liked card spans both columns. Card inner padding is 22 px on wide screens; the feed controls sit above the content they change.

- **At 1160 px and below:** sidebar becomes 250 px, gaps/padding reduce, and search moves below topics. Card padding becomes 18 px. Compact secondary copy-link controls are hidden on nonfeatured cards at this intermediate density; original post links remain available.
- **At 940 px and below:** the sidebar moves under the feed into two columns; controls return to a shared row when space permits. The external-X header action is omitted, while original links stay in every card.
- **At 660 px and below:** the feed becomes one column; header utilities stay compact, brand project text is omitted, search sits below wrapping topic controls, and sidebar sections stack. The intro headline is 32 px and the main action is 16 px. The 219 px hero illustration is positioned at the trailing edge and cropped on its decorative leading side. Text and controls remain inside the content margins.
- **At 360 px and below:** inline padding is 16 px, redundant nav icons disappear, the hero illustration becomes 165 px wide, and the product description wraps to avoid the artwork.

Header, topic controls, heading/sort row, card footer, and page footer can wrap when text grows. The 390 × 844 opening screen contains the product, main Explore control, search, first card, and Open on X action. Reflow was checked at 320, 390, 768, 1024, and 1440 px; 200% root text enlargement and an RTL direction check also retained the page width. Native zoom and physical devices were not tested.

## Elevation & Depth

The interface is deliberately flat: tonal surfaces, one-pixel outlines, and separators organize the feed. Cards do not use shadows. Only the dismissible notification has a shadow. The native modal enters the browser top layer with `--backdrop`; notifications use z-index 30 and the keyboard skip link uses 20.

The hero SVG contains illustrative depth and gradients, which are artwork rather than gradient interface text or a second surface system.

## Shapes

`--radius` is 12 px for cards and the network panel. The ranking strip uses 11 px top radii inside a 1 px card outline. Actions use 8 px; search and icon controls use 7 px; filters use 6 px; count badges use 4–5 px. The dialog uses 16 px. Avatars are circular. Artwork may be cropped; meaningful post text is not clipped.

## Components

- **`Icon` (`src/main.tsx`)**: one inline SVG set, 24-unit viewBox, 1.7 px stroke, `currentColor`. Icons are decorative to assistive technology; icon-only controls carry their own descriptive labels.
- **Primary/secondary actions (`.primary-button`, `.secondary-button`)**: one lime primary action per primary view; outlined supporting links/buttons. Native anchors retain original-link behavior and new-tab names. Press feedback is scale 0.96 when motion is allowed.
- **Navigation (`.main-nav`)**: Discover and Saved are native buttons with active text, an underline, and `aria-current`. Saved count is computed from local bookmark state. The brand returns to the page top and resets discovery filters.
- **Filters/search/sort**: topic buttons use `aria-pressed`; search has a real label, native search type, a clear control, and 16 px text on mobile; sort is a labeled native select. A stable live region announces result changes.
- **`TweetCard`**: accepts `post`, `rank`, `saved`, `onSave`, and `onStatus`. It renders an author link, summary title/body, topic/date, context disclosure, captured engagement, bookmark, copy link, and original X link. Rank 1 gets the featured treatment. Bookmark state changes its shape and accessible name. Context expands in place. Clipboard failure reveals a selected read-only URL with an explicit label and Dismiss control; dismissal restores focus to Copy.
- **Empty state**: explains a no-match search or empty Saved collection. Clear filters restores discovery results; Explore returns an empty Saved view to discovery.
- **Notification (`.announcement`)**: stable polite status container with a dismiss button. Messages do not auto-expire. Storage failure is also explained beside the feed, and saves remain usable for the visit.
- **About dialog**: native `dialog.showModal()` supplies modal/inert behavior; Tab and Shift+Tab explicitly wrap between its controls. Escape, backdrop, and Close dismiss it. Focus returns to the invoking control.

Focus is an explicit 2 px ring with a 4 px offset. Hover treatments are gated by pointer hover capability. State transitions use 120 ms and `cubic-bezier(0.2, 0, 0, 1)` only under `prefers-reduced-motion: no-preference`. There is no autoplay, endless motion, loading imitation, remote fetch state, wallet, or transaction flow. Forced colors retain system focus/selected outlines.

## Do's and Don'ts

- Start an additional surface inside `.page-shell`; reuse the shared semantic colors and six-step type scale.
- Use a native link for an original source and a button for a local action. Include an accessible name for an icon-only control and keep mobile primary targets at least 44 px high.
- Add another feed item through `src/posts.json`; use an actual source, capture counts, and distinguish summary from author quotation.
- Keep the feed controls before results, preserve visible empty-state recovery, and show where bookmarks live.
- Use the existing vector illustration and icon vocabulary. Do not add a new font, accent ramp, wallet connection, simulated live data, or text over the illustration.
- Preserve the captured-snapshot language when extending the feed. A new page can reuse the header, `.page-shell`, section type, outlined actions, and card pattern, then adapt the existing single-column breakpoint rather than inventing a second layout system.

Design guidance attribution is preserved in `docs/third-party/NOTICE.md` and its linked license files. Review findings and remaining evidence limitations belong in `artifacts/validation.md`, not in this factual system description.
