# WiTac project website

A buildless, responsive project page for **WiTac: Wrist-Informed Tactile Representations for Contact-Rich Manipulation**. All assets are local and links work under a GitHub Pages repository path.

## Preview

From this directory (the one containing `index.html`):

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Use HTTP because the video gallery loads its manifest with `fetch`.

For a server-side preview on FM_SH_HHT, run the command above in the website directory, then forward the port from your own computer:

```bash
ssh -N -L 8000:127.0.0.1:8000 FM_SH_HHT
```

## Repository and publication

This site is maintained in the private `HaotianHehaha/WiTac` repository. Its future project URL is `https://haotianhehaha.github.io/WiTac/`. Repository privacy does not make a published GitHub Pages site private. Leave Pages disabled until public publication is explicitly authorized.

When public publication is approved, deploy the `main` branch root through Settings → Pages. The standalone repository has `index.html` at its root and `.nojekyll` for direct static-file serving; no build or Actions workflow is required. If publishing from the manuscript workspace instead, deploy only its `website/` directory.

## Content and provenance

The page follows this order: four-task video cover and authors; Abstract; Insight and teaser; Method; closed-loop Experiments; four Representation Analysis points and reconstruction videos; real-robot comparisons; Citation placeholder.

The November 16, 2026 revision follows `tac_sharpa/sharpa-latex-template/main.pdf` on FM_SH_HHT (compiled 02:50 UTC), its abstract and experiments sources, and the figures referenced by that manuscript. The Paper download is the same PDF. The teaser was rendered from the current PDF because the source PNG was stale. The method figure was also rendered from the manuscript PDF; its scientific content was not edited.

The four Representation Analysis sections are independently expandable and start closed. Their responsive SVG charts use exact table values recorded in `data/representation-analysis.json`: horizontal bars for the three reconstruction error reductions (Table S4); separate 12/20-class tabs with original and confirmation macro-F1 comparisons (Table S5); a signed, zero-centered heatmap for noise robustness (Table 3); and task-faceted dot plots for action-direction cosine similarity (Table 4). Negative reductions and cases where concatenation exceeds WiTac are preserved. Each chart has desktop and mobile layouts, exact numeric labels, and descriptive alternative text. The class tabs support arrow keys, Home, and End; without JavaScript, both class-count panels remain available.

Website names consistently use **WiTac-NW**. This variant removes wrist fusion from the contact encoder; the downstream VLA retains its native visual inputs. Success-rate values and rounding follow the paper; the abstract displays literal `%` as requested by the author. Representation analysis distinguishes relative error/drift reductions from macro-F1 scores and direction cosine similarity. Frozen-feature probes are not closed-loop success measurements.

The twelve authors, their order, affiliation markers and equal contribution follow the paper. The hero shows only Paper and BibTeX links. The Citation remains a placeholder; no citation has been invented.

## Videos

- `data/videos.json` describes eight complete task recordings. The project author confirmed on November 16 that all success samples use **GR00T N1.7 + WiTac** and all failure samples use **GR00T N1.7 + WiTac-NW**. These are selected examples; aggregate results appear in Experiments.
- `assets/videos/hero-sequence.mp4` is a 32-second, original-speed montage: battery 30–38 s, USB 31–39 s, bowl 38–46 s, cabinet 14–22 s from the success recordings.
- `data/reconstructions.json` describes the four unchanged 1080p reconstruction clips from `D:/WiTac_video/assets/website_reconstruction_20261115`. Battery, USB, bowl, and cabinet clips are 4, 4, 6, and 3.2 seconds. They show GT/WiTac historical tactile changes `T(t) − T(t−8)` and masked DINO wrist features, not RGB image completion or future tactile prediction.
- The earlier static “Reconstructing recent contact changes” module is omitted. Its underlying image file is retained as an unused asset.
- No video files were edited during this revision. Gallery playback supports 1×, 2×, and 4×; starting a video pauses other videos. Hero playback respects reduced-motion preferences and pauses offscreen.

## Presentation and implementation

The initial academic layout was informed by [SALA](https://sala-vla.github.io/). The warm paper background, larger typography, and restrained reading/progress cues in this revision were informed by [T-Rex](https://tactile-reactive-dexterous.github.io/).

`index.html`, `styles.css`, and `app.js` provide the static page, responsive styling, chart switcher, task/outcome filters, and playback controls. The reading bar tracks scroll position; the four hero indicators track actual media time. Reduced-motion preferences disable decorative animation. Keep HTML table values and `resultSets` in `app.js` consistent when updating results.

Preparation sources and validation records are kept outside the website in `inspection/website_revision_20261116/` and `inspection/website_analysis_charts_20261116/` in the local workspace. The latter contains the reproducible Matplotlib renderer and table provenance for the analysis charts. Manuscript files and publication visibility are managed separately.
