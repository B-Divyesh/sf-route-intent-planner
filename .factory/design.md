# Route Intent Planner — visual thesis

## Direction: cassette-era route zine

This product is about keeping a rider's authored line intact. Its interface borrows from a hand-labelled club-ride cassette and a photocopied route sheet: magnetic tape becomes the route, punched registration marks become control points, and fluorescent highlighter becomes the deviation signal. It is deliberately single-mode and ink-forward, like a physical tool used at a kitchen table before a ride. The decoration is explanatory: locked tape is the intended corridor, loose/dashed tape is a gap, and orange annotation marks require inspection.

## Palette

- `--paper #f4efdf`: warm recycled route-sheet stock.
- `--paper-raised #fffaf0`: clean writing surface.
- `--ink #181713`: near-black cassette plastic; primary text (15.1:1 on paper).
- `--ink-soft #565047`: graphite annotation; secondary text (6.7:1 on paper).
- `--tape #246b5b`: oxidised green magnetic tape; primary actions (5.9:1 with white).
- `--tape-dark #15443a`: pressed/focus state.
- `--signal #bd3e1c`: dark fluorescent grease-pencil orange; warnings and off-intent segments (5.3:1 with white).
- `--signal-ink #8f2f13`: warning text (7.1:1 on paper).
- `--blue #255d8a`: route controls and informational marks (6.5:1 on paper).
- `--success #286744`; `--danger #a52d2d`.

No dark theme is provided: the thesis is explicitly a single physical-paper mode. The root background is always painted, including installed-app splash and overscroll.

## Type

No web fonts are loaded. Headings use `Arial Black`, `Arial Narrow`, and system sans fallbacks in tight, uppercase display settings that recall dry-transfer cassette labels. Body, controls, and data use `ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, `Roboto Mono`, and monospace fallbacks, evoking route cue sheets while keeping coordinates and measurements aligned. This avoids font payload and third-party requests.

Scale: 14px utility, 16px body, 20px section, 32px display, clamp(42px–76px) masthead. Body line-height is 1.55 and readable measures stay below 72 characters.

## Spacing and shape

The base rhythm is 4px, with primary intervals at 8, 12, 16, 24, 32, 48, and 64px. Controls are at least 44px. Corners are mostly 2–6px rather than generic pills. Panels are grouped by proximity and sparse rules; independent saved routes are the only card-like objects. Slight 1–2 degree rotations appear only on passive labels and never on form controls or copy.

## Interaction grammar

- Add route points by clicking/tapping the paper map or by importing GPX.
- Every consecutive pair is a segment. A segment can be `locked` (must follow the authored trace), a `gap` (the only part an external router may optimize), or `flagged` (review before export).
- Routing is a deliberate `Optimize gaps` action, never an automatic redraw. It calls the OpenStreetMap-compatible bicycle router with each selected gap’s endpoints only, retains its interior geometry locally, and always exports the author’s exact endpoint coordinates around that geometry. This makes the locked-corridor invariant visible and testable.
- Segment state is never color-only: line style, labels, and the inspection ledger repeat it.
- Editing a point updates analysis immediately. Undo/redo preserve author confidence.
- Export is always available; paid Route Tape unlock adds more than 12 points, unlimited saved route tapes, and JSON backup/restore. Accessibility, GPX export, and all safety/deviation warnings stay free.

## Motion

State changes use 160–220ms opacity and transform transitions: route marks settle onto the sheet from their control point, and toast messages slide from the edge. Nothing loops. Under `prefers-reduced-motion: reduce`, all transforms and smooth scrolling are disabled and state changes are instantaneous.

## Responsive intent

Wide screens show the drafting map beside the inspection ledger. At 390px the masthead compresses, tools wrap, and the ledger stacks below the full-width map. Nonessential desktop registration marks disappear; route editing, status, undo, import, save, and export remain present. Legal/about copy is moved below the task.

## Original asset plan and provenance

The hero is a generated square risograph-style collage used behind the compact intro panel, depicting a cassette whose tape becomes a cycle route. It clarifies the “route tape” mental model without pretending to be a live map. UI icons and map marks are original inline SVG/CSS authored for this repository.

### Prompt sheet

- Subject: top-down bicycle route map assembled from one translucent cassette, with magnetic tape forming a deliberate winding road and three punched waypoint markers.
- World/materials: recycled paper, torn photocopy edges, halftone ink, grease-pencil checks, screen-printed registration marks.
- Light/lens: flat editorial scan, top-down, no photographic depth.
- Palette words: warm oat paper, carbon black, oxidised teal, safety orange, restrained cobalt.
- Negative list: no people, no real brands, no logos, no legible text, no watermark, no UI mockup, no gradients, no glossy 3D.

Asset: `public/art/route-tape-hero.webp`. Generated 2026-08-28 with the factory Azure image deployment via `/opt/fleet/lib/gen-image.sh`, then reviewed for malformed content, stray brands/text, and palette fit; optimized locally to WebP. Original generated imagery, licensed for this product. The exact production prompt is stored in `assets/src/route-tape-hero.json`. The footer discloses its generated provenance.
