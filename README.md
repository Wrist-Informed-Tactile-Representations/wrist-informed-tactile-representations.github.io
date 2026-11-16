# WiTac research website

A buildless, responsive research project page for **WiTac: Wrist-Informed Tactile Representations for Contact-Rich Manipulation**. All assets are local and all URLs are relative, including deployment under a GitHub Pages repository path.

The layout follows the user-supplied [SALA project page](https://sala-vla.github.io/): a full-width video cover with centered title and authors, followed by Abstract, Insight and teaser, the WiTac method figure and explanations, Experiments, real-robot videos, and a Citation placeholder. No citation entry has been invented.

## Preview

From the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:8000/`. Use HTTP rather than opening `index.html` directly because the gallery loads `data/videos.json` with `fetch`.

For a preview running on FM_SH_HHT, run the same server command there, then forward it from your computer:

```bash
ssh -L 8000:127.0.0.1:8000 FM_SH_HHT
```

## Publish with GitHub Pages

The repository workflow `.github/workflows/witac-pages.yml` uploads **only `website/`**. It does not publish the rest of the manuscript repository.

1. Commit `website/` and `.github/workflows/witac-pages.yml` to the repository's `main` branch, then push.
2. In repository **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Run **Deploy WiTac website** under Actions, or push a subsequent website change. The successful workflow reports the actual published URL.

No npm install or build is required. The workflow is based on the [official GitHub Pages custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Contents

- `index.html`, `styles.css`, `app.js`: page, responsive layout, background-video controls, chart switcher, video filters and playback-speed selector.
- `data/videos.json`: eight source-labelled success/failure examples.
- `assets/videos/`: complete recordings, re-encoded as H.264/yuv420p with faststart, original speed, no audio; approximately 26 MB total.
- `assets/videos/hero-sequence.mp4`: a separate 32-second background montage, four 8-second excerpts in order: battery, USB, bowl, cabinet. Original speed, no audio; approximately 2.2 MB. Source time ranges are 30–38, 31–39, 38–46, and 14–22 seconds of their respective success recordings.
- `assets/posters/`: real video-frame thumbnails.
- `assets/figures/`: unchanged figures from the manuscript.
- `assets/papers/`: copies of the current manuscript and supplement.
- `.nojekyll`: direct static-file serving.

Edit captions and videos in the manifest. Results are recorded in `app.js` and the full baseline table in `index.html`; update both when the manuscript's results change. Replace copied PDFs and figures when revising the manuscript.

## Evidence and labeling

Scientific content follows the current paper, especially `paper/sections/0_abstract.tex`, `3_method.tex`, `4_experiments.tex`, `5_conclusion.tex`, and `paper/tables/closed_loop.tex`. Success-rate gains are **percentage points**, and averages follow manuscript rounding. NW retains the VLA's native visual inputs. The reconstruction figure represents **historical tactile changes**, not future tactile prediction.

The eight source video filenames supply task and outcome labels, but do not verify a policy identity. Accordingly, cards are labeled only by task and success/failure; the video pairs are not presented as WiTac-versus-baseline comparisons. The cabinet failure clip briefly opens the door before it closes again.

The website author information follows page 1 of `tac_sharpa/sharpa-latex-template/main.pdf` on FM_SH_HHT, verified on 2026-11-15. Its twelve authors retain the PDF's order and affiliation markers; Haotian He and Yiyang Chen share equal contribution. Affiliations are 1 Sharpa Robotics, 2 PKU, 3 SJTU, 4 ShanghaiTech, and 5 CUHK. Correspondence: zhijied@sjtu.edu.cn. This updates only the website byline; manuscript sources and existing paper-download files are unchanged.

The eight complete recordings preserve source frame counts; the separate hero is explicitly a montage of selected excerpts. No experimental scene has been synthesized. Detailed local preparation and validation records are under `inspection/website_media_20261114/` and `inspection/website_redesign_20261114/` in the preparation workspace. Source recordings remain unmodified. Background playback respects reduced-motion preferences and pauses when offscreen; complete demonstration players support 1×, 2×, and 4× playback.

## Reconstruction videos

The Experiments section includes a four-task reconstruction viewer at `#reconstructions`. The 1080p MP4s and posters are copied unchanged from `D:/WiTac_video/assets/website_reconstruction_20261115`; `data/reconstructions.json` retains their metadata. Durations are 4, 4, 6, and 3.2 seconds (battery, USB, bowl, cabinet), at original speed. Each panel compares GT and WiTac for ten-finger historical tactile changes T(t) - T(t-8) and masked wrist DINO features. Task buttons switch one full-width player at a time; playback requires a user action and pauses other page videos. Without JavaScript, all four players remain available. The eight success/failure recordings are unchanged.
