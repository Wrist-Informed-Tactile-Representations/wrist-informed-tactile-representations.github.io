'use strict';

// Success rates follow the manuscript, including its one-decimal averages.
const resultSets = {
  groot: [[30, 40, 10, 70, 37.5], [45, 60, 5, 80, 47.5], [55, 80, 40, 90, 66.3]],
  pi05: [[55, 65, 10, 45, 43.8], [60, 65, 15, 65, 51.3], [70, 75, 20, 70, 58.8]]
};
const taskNames = ['Insert battery', 'Wipe bowl', 'Reinsert USB', 'Open cabinet', 'Average'];
const series = [
  {name: 'Base', color: 'base-color'},
  {name: 'WiTac-NW', color: 'nw-color'},
  {name: 'WiTac', color: 'witac-color'}
];
const chart = document.querySelector('#results-chart');
const backboneButtons = [...document.querySelectorAll('[data-backbone]')];
function animateChart() {
  if (!chart || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  chart.querySelectorAll('.bar-fill').forEach(fill => fill.classList.add('animate-in'));
}
if (chart && 'IntersectionObserver' in window) {
  const chartObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      animateChart();
      chartObserver.disconnect();
    }
  }, {threshold: 0.2});
  chartObserver.observe(chart);
}

function renderChart(backbone) {
  if (!chart || !resultSets[backbone]) return;
  chart.replaceChildren();
  taskNames.forEach((task, index) => {
    const group = document.createElement('div');
    group.className = 'task-chart';
    const bars = document.createElement('div');
    bars.className = 'bar-group';
    series.forEach((item, seriesIndex) => {
      const value = resultSets[backbone][seriesIndex][index];
      const displayValue = index === 4 ? value.toFixed(1) : String(value);
      const column = document.createElement('div');
      column.className = 'bar-column';
      column.style.setProperty('--value', String(value));
      column.setAttribute('role', 'img');
      column.setAttribute('aria-label', `${task}, ${item.name}: ${displayValue}% success`);
      const number = document.createElement('span');
      number.className = 'bar-value';
      number.textContent = displayValue;
      number.setAttribute('aria-hidden', 'true');
      const track = document.createElement('div');
      track.className = 'bar-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div');
      fill.className = `bar-fill ${item.color}`;
      fill.style.height = `${value}%`;
      track.append(fill);
      column.append(number, track);
      bars.append(column);
    });
    const heading = document.createElement('h4');
    heading.textContent = task;
    group.append(bars, heading);
    chart.append(group);
  });
  if (chart.getBoundingClientRect().top < window.innerHeight) animateChart();
  backboneButtons.forEach(button => {
    const selected = button.dataset.backbone === backbone;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

backboneButtons.forEach(button => {
  button.addEventListener('click', () => renderChart(button.dataset.backbone));
});
renderChart('groot');

const gallery = document.querySelector('#video-gallery');
const taskButtons = [...document.querySelectorAll('.task-filters [data-task]')];
const taskInfo = {
  battery: {name: 'Insert battery', description: 'Align the battery with the compartment and seat it in place.', number: '01'},
  usb: {name: 'Reinsert USB', description: 'Grasp, remove, and reinsert a USB connector.', number: '02'},
  bowl: {name: 'Wipe bowl', description: 'Hold the bowl while wiping its interior with a sponge.', number: '03'},
  cabinet: {name: 'Open cabinet', description: 'Turn the key and pull the cabinet door open.', number: '04'}
};
let videos = [];
let galleryLoaded = false;
let selectedTask = 'battery';

function pauseGallery(exceptVideo = null) {
  document.querySelectorAll('#video-gallery video, #reconstructions video').forEach(video => {
    if (video !== exceptVideo) video.pause();
  });
}

// User intent survives visibility changes. Gallery playback suspends the hero
// until its own play button is explicitly pressed, so it never steals playback.
const heroVideo = document.querySelector('#hero-video');
const heroToggle = document.querySelector('#hero-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroWantsPlayback = !reducedMotion.matches;
let heroUserSetPlayback = false;
let heroSuspendedByGallery = false;
let heroVisible = false;
let heroPlayPending = false;

function heroShouldPlay() {
  return Boolean(heroVideo && heroWantsPlayback && !heroSuspendedByGallery && heroVisible && !document.hidden);
}

function updateHeroButton() {
  if (!heroVideo || !heroToggle) return;
  const label = heroVideo.paused ? 'Play video' : 'Pause video';
  heroToggle.textContent = label;
  heroToggle.setAttribute('aria-label', label);
}

function syncHeroPlayback() {
  if (!heroVideo) return;
  if (!heroShouldPlay()) {
    heroVideo.pause();
    updateHeroButton();
    return;
  }
  if (!heroVideo.paused || heroPlayPending) return;
  heroPlayPending = true;
  const attempt = heroVideo.play();
  Promise.resolve(attempt).catch(() => {
    // Browsers can block autoplay; the visible play control remains usable.
  }).finally(() => {
    heroPlayPending = false;
    if (!heroShouldPlay()) heroVideo.pause();
    updateHeroButton();
  });
}

function suspendHeroForGallery() {
  heroSuspendedByGallery = true;
  syncHeroPlayback();
}

function updateHeroTimeline() {
  if (!heroVideo) return;
  // The montage has four consecutive eight-second segments and loops at 32 s.
  const index = Math.min(3, Math.floor((heroVideo.currentTime % 32) / 8));
  document.querySelectorAll('.hero-segment').forEach((segment, segmentIndex) => {
    const progress = Math.max(0, Math.min(1, ((heroVideo.currentTime % 32) - segmentIndex * 8) / 8));
    segment.querySelector('i')?.style.setProperty('--progress', String(progress));
    segment.classList.toggle('active', segmentIndex === index);
    segment.classList.toggle('completed', progress === 1);
  });
}

if (heroVideo) {
  heroVideo.autoplay = false;
  heroVideo.removeAttribute('autoplay');
  heroVideo.muted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  const rect = heroVideo.getBoundingClientRect();
  heroVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  heroVideo.addEventListener('timeupdate', updateHeroTimeline);
  heroVideo.addEventListener('loadedmetadata', updateHeroTimeline);
  heroVideo.addEventListener('play', () => {
    if (!heroShouldPlay()) {
      heroVideo.pause();
      return;
    }
    pauseGallery();
    updateHeroButton();
  });
  heroVideo.addEventListener('pause', updateHeroButton);
  heroVideo.addEventListener('error', updateHeroButton);
  heroToggle?.addEventListener('click', () => {
    heroUserSetPlayback = true;
    if (!heroVideo.paused) {
      heroWantsPlayback = false;
    } else {
      heroWantsPlayback = true;
      heroSuspendedByGallery = false;
      pauseGallery();
    }
    syncHeroPlayback();
  });
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncHeroPlayback();
    }, {threshold: 0});
    heroObserver.observe(heroVideo);
  } else {
    const checkHeroVisibility = () => {
      const bounds = heroVideo.getBoundingClientRect();
      heroVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      syncHeroPlayback();
    };
    window.addEventListener('scroll', checkHeroVisibility, {passive: true});
    window.addEventListener('resize', checkHeroVisibility, {passive: true});
  }
  document.addEventListener('visibilitychange', syncHeroPlayback);
  const handleMotionPreference = () => {
    if (!heroUserSetPlayback) heroWantsPlayback = !reducedMotion.matches;
    syncHeroPlayback();
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', handleMotionPreference);
  else reducedMotion.addListener(handleMotionPreference);
  updateHeroTimeline();
  syncHeroPlayback();
  updateHeroButton();
}

function formatDuration(seconds) {
  const duration = Math.max(0, Math.floor(seconds));
  return `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
}

function matchingVideos() {
  return videos.filter(video => video.task === selectedTask);
}

function renderGallery() {
  if (!gallery || !galleryLoaded) return;
  pauseGallery();
  gallery.replaceChildren();
  const shown = matchingVideos();
  Object.entries(taskInfo).forEach(([key, task]) => {
    const clips = shown.filter(video => video.task === key)
      .sort((a, b) => (a.outcome === 'success' ? 0 : 1) - (b.outcome === 'success' ? 0 : 1));
    if (!clips.length) return;
    const section = document.createElement('section');
    section.className = 'video-group';
    section.setAttribute('aria-labelledby', `task-${key}`);
    const heading = document.createElement('div');
    heading.className = 'video-group-heading';
    const title = document.createElement('h3');
    title.id = `task-${key}`;
    const number = document.createElement('span');
    number.textContent = task.number;
    title.append(number, task.name);
    const description = document.createElement('p');
    description.textContent = task.description;
    heading.append(title, description);
    const pair = document.createElement('div');
    pair.className = 'video-pair';
    clips.forEach(clip => {
      const outcomeName = clip.outcome === 'success' ? 'Success' : 'Failure';
      const card = document.createElement('article');
      card.className = 'video-card';
      const video = document.createElement('video');
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = clip.poster || '';
      video.setAttribute('aria-label', `${task.name}: ${clip.backbone} + ${clip.policy}, ${outcomeName.toLowerCase()} example`);
      const source = document.createElement('source');
      source.src = clip.src;
      source.type = 'video/mp4';
      video.append(source);
      const info = document.createElement('div');
      info.className = 'video-info';
      const meta = document.createElement('div');
      meta.className = 'video-meta';
      const badge = document.createElement('span');
      badge.className = `outcome-badge ${clip.outcome}`;
      badge.textContent = `${outcomeName} example`;
      const duration = document.createElement('span');
      duration.className = 'duration';
      const updateDuration = () => {
        const rate = video.playbackRate || 1;
        duration.textContent = `${formatDuration(clip.duration / rate)} · ${rate}× speed`;
        duration.title = `Original recording: ${formatDuration(clip.duration)}. Playback speed does not alter the source file.`;
      };
      updateDuration();
      video.addEventListener('ratechange', updateDuration);
      video.addEventListener('loadedmetadata', () => {
        updateDuration();
      });
      meta.append(badge, duration);
      const caption = document.createElement('p');
      caption.textContent = clip.caption || `${task.name}, ${outcomeName.toLowerCase()} recording.`;
      const showVideoError = () => {
        caption.textContent = 'This video could not be loaded. Please reload the page and try again.';
      };
      video.addEventListener('error', showVideoError);
      source.addEventListener('error', showVideoError);
      video.addEventListener('play', () => {
        suspendHeroForGallery();
        pauseGallery(video);
      });
      const policy = document.createElement('p');
      policy.className = 'video-policy';
      policy.textContent = `${clip.backbone} + ${clip.policy}`;
      info.append(meta, policy, caption);
      card.append(video, info);
      pair.append(card);
    });
    section.append(heading, pair);
    gallery.append(section);
  });
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'gallery-empty';
    empty.textContent = 'No videos are available for this task.';
    gallery.append(empty);
  }
}

taskButtons.forEach(button => button.addEventListener('click', () => {
  selectedTask = button.dataset.task;
  taskButtons.forEach(other => {
    const selected = other === button;
    other.classList.toggle('active', selected);
    other.setAttribute('aria-pressed', String(selected));
  });
  renderGallery();
}));
function showGalleryLoadError() {
  if (!gallery) return;
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'The video list could not load. Please reload the page and try again.';
  gallery.replaceChildren(message);
}

if (gallery) {
  fetch('data/videos.json?v=failure-captions-20261117')
    .then(response => {
      if (!response.ok) throw new Error('Video manifest unavailable');
      return response.json();
    })
    .then(data => {
      const entries = Array.isArray(data) ? data : data.videos;
      if (!Array.isArray(entries) || !entries.length || entries.some(clip => !clip
        || !Object.prototype.hasOwnProperty.call(taskInfo, clip.task)
        || !['success', 'failure'].includes(clip.outcome)
        || !['WiTac', 'WiTac-NW'].includes(clip.policy) || clip.backbone !== 'GR00T N1.7'
        || typeof clip.src !== 'string' || !clip.src
        || !Number.isFinite(clip.duration) || clip.duration <= 0)) {
        throw new Error('Invalid video manifest');
      }
      videos = entries;
      galleryLoaded = true;
      renderGallery();
    })
    .catch(showGalleryLoadError);
}

// Mark the chapter currently crossing the reading area below the fixed nav.
const chapterLinks = [...document.querySelectorAll('nav a[href^="#"]')]
  .map(link => ({link, section: document.getElementById(link.getAttribute('href').slice(1))}))
  .filter(entry => entry.section);

function setActiveChapter(section) {
  chapterLinks.forEach(entry => {
    const active = entry.section === section;
    entry.link.classList.toggle('active', active);
    if (active) entry.link.setAttribute('aria-current', 'location');
    else entry.link.removeAttribute('aria-current');
  });
}

chapterLinks.forEach(({link, section}) => {
  link.addEventListener('click', () => setActiveChapter(section));
});
if (chapterLinks.length) {
  const initial = chapterLinks.find(entry => entry.link.getAttribute('href') === window.location.hash);
  setActiveChapter(initial?.section || null);
  if ('IntersectionObserver' in window) {
    let chapterObserver;
    const observeChapters = () => {
      chapterObserver?.disconnect();
      const readingLine = Math.round(window.innerHeight * 0.3);
      const bottomInset = Math.max(0, window.innerHeight - readingLine - 1);
      chapterObserver = new IntersectionObserver(() => {
        const crossed = chapterLinks.filter(({section}) => section.getBoundingClientRect().top <= readingLine + 1);
        setActiveChapter(crossed.length ? crossed[crossed.length - 1].section : null);
      }, {rootMargin: `-${readingLine}px 0px -${bottomInset}px 0px`, threshold: 0});
      chapterLinks.forEach(({section}) => chapterObserver.observe(section));
    };
    observeChapters();
    window.addEventListener('resize', observeChapters, {passive: true});
  }
}

// Keep reconstruction panels large enough to inspect their ten-finger details.
const reconstructionButtons = [...document.querySelectorAll('[data-reconstruction]')];
const reconstructionPanels = [...document.querySelectorAll('.reconstruction-panel')];
function selectReconstruction(task) {
  reconstructionPanels.forEach(panel => {
    const selected = panel.id === `reconstruction-${task}`;
    panel.hidden = !selected;
    if (!selected) panel.querySelector('video')?.pause();
  });
  reconstructionButtons.forEach(button => {
    const selected = button.dataset.reconstruction === task;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
if (reconstructionButtons.length) {
  document.querySelector('.reconstruction-controls').hidden = false;
  reconstructionButtons.forEach(button => button.addEventListener('click', () => {
    selectReconstruction(button.dataset.reconstruction);
  }));
  reconstructionPanels.forEach(panel => {
    const video = panel.querySelector('video');
    video.addEventListener('play', () => {
      suspendHeroForGallery();
      pauseGallery(video);
    });
    video.addEventListener('error', () => {
      const caption = panel.querySelector('figcaption p');
      caption.textContent = 'This video could not be loaded. Refresh the page and try again.';
    });
  });
  selectReconstruction(reconstructionButtons[0].dataset.reconstruction);
}

// A quiet reading cue; scroll updates are limited to one per animation frame.
const readingProgress = document.querySelector('#reading-progress-fill');
let readingFrame = 0;
function updateReadingProgress() {
  readingFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;
  readingProgress?.style.setProperty('--progress', String(progress));
}
function scheduleReadingProgress() {
  if (!readingFrame) readingFrame = window.requestAnimationFrame(updateReadingProgress);
}
window.addEventListener('scroll', scheduleReadingProgress, {passive: true});
window.addEventListener('resize', scheduleReadingProgress, {passive: true});
if ('ResizeObserver' in window) new ResizeObserver(scheduleReadingProgress).observe(document.body);
updateReadingProgress();


// Native disclosures stay independent; these tabs switch only class counts.
// Without JavaScript both complete evaluation panels remain visible.
const analysisTabs = [...document.querySelectorAll('[data-analysis-classes]')];
if (analysisTabs.length) {
  const tablist = document.querySelector('.analysis-tabs');
  const panelFor = tab => document.getElementById(tab.getAttribute('aria-controls'));
  function selectAnalysisTab(selected, focus = false) {
    analysisTabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panelFor(tab).hidden = !active;
    });
    if (focus) selected.focus();
    document.dispatchEvent(new CustomEvent('analysis-tabchange', {detail: panelFor(selected)}));
  }
  if (tablist && analysisTabs.every(panelFor)) {
    analysisTabs.forEach((tab, index) => {
      const panel = panelFor(tab);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      tab.addEventListener('click', () => selectAnalysisTab(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % analysisTabs.length;
        else if (event.key === 'ArrowLeft') next = (index + analysisTabs.length - 1) % analysisTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = analysisTabs.length - 1;
        else return;
        event.preventDefault();
        selectAnalysisTab(analysisTabs[next], true);
      });
    });
    tablist.hidden = false;
    selectAnalysisTab(analysisTabs[0]);
  }
}

// Enhance the exported plots with per-mark motion; static pictures are the fallback.
const motionFigures = [...document.querySelectorAll('#analysis-1 .analysis-chart, #analysis-2 .analysis-chart, #analysis-4 .analysis-chart')];
const motionPanelsPlayed = new WeakSet();
const motionSources = new Map();
const motionRequests = new WeakMap();
const mobilePlots = window.matchMedia('(max-width: 600px)');
function revealAnalysisPanel(panel) {
  if (reducedMotion.matches || motionPanelsPlayed.has(panel)) return;
  const box = panel.getBoundingClientRect();
  if (!box.width || !box.height || box.bottom <= 64 || box.top >= window.innerHeight) return;
  motionPanelsPlayed.add(panel);
  panel.classList.add('is-revealing');
}
const motionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) revealAnalysisPanel(entry.target); });
}, {threshold: .12, rootMargin: '-64px 0px 0px 0px'}) : null;

function replayAnalysisPlots(scope) {
  scope.querySelectorAll('[data-motion-panel]').forEach(panel => {
    panel.classList.remove('is-revealing');
    motionPanelsPlayed.delete(panel);
  });
  // Commit the reset before reapplying the animation on the next frame.
  scope.getBoundingClientRect();
  window.requestAnimationFrame(() => {
    scope.querySelectorAll('[data-motion-panel]').forEach(revealAnalysisPanel);
  });
}

async function enhanceAnalysisPlot(figure, index) {
  const picture = figure.querySelector('picture');
  const image = picture.querySelector('img');
  const mobileSource = picture.querySelector('source');
  const path = mobilePlots.matches ? mobileSource.getAttribute('srcset') : image.getAttribute('src');
  const url = new URL(path, document.baseURI);
  url.searchParams.set('v', 'motion-20261116');
  const request = figure.dataset.motionRequest = url.href;
  const requestId = {};
  motionRequests.set(figure, requestId);
  const oldPlot = figure.querySelector('.analysis-plot-svg');
  if (oldPlot?.dataset.source === request) return;
  try {
    if (!motionSources.has(request)) {
      motionSources.set(request, fetch(request).then(response => {
        if (!response.ok) throw new Error('Plot unavailable');
        return response.text();
      }).catch(error => { motionSources.delete(request); throw error; }));
    }
    const source = await motionSources.get(request);
    if (motionRequests.get(figure) !== requestId) return;
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = parsed.documentElement;
    if (root.localName !== 'svg' || parsed.querySelector('parsererror, script, foreignObject') || !root.querySelector('[data-motion-panel]')) throw new Error('Invalid plot');
    // Each inline plot needs its own clip-path and marker IDs.
    const prefix = `analysis-plot-${index}-`;
    const ids = new Map([...root.querySelectorAll('[id]')].map(node => [node.id, prefix + node.id]));
    root.querySelectorAll('*').forEach(node => {
      [...node.attributes].forEach(attribute => {
        let value = attribute.value.replace(/url\(#([^)]+)\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        if (attribute.localName === 'href' && value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
        if (attribute.name === 'id') value = ids.get(value);
        node.setAttributeNS(attribute.namespaceURI, attribute.name, value);
      });
    });
    root.querySelectorAll('style').forEach(style => { style.textContent = style.textContent.replace('*{', '.analysis-plot-svg *{'); });
    const svg = document.importNode(root, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', 'analysis-plot-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', image.alt);
    svg.dataset.source = request;
    svg.querySelectorAll('[data-motion]').forEach(mark => {
      mark.style.setProperty('--analysis-delay', `${Number(mark.dataset.motionOrder) * 70}ms`);
      if (mark.dataset.motion === 'point') mark.style.setProperty('--analysis-from-x', `${Number(mark.dataset.motionFromX)}px`);
    });
    const previousPlot = figure.querySelector('.analysis-plot-svg');
    previousPlot?.querySelectorAll('[data-motion-panel]').forEach(panel => motionObserver?.unobserve(panel));
    if (previousPlot) previousPlot.replaceWith(svg);
    else picture.after(svg);
    picture.hidden = true;
    svg.querySelectorAll('[data-motion-panel]').forEach(panel => motionObserver?.observe(panel));
    window.requestAnimationFrame(() => svg.querySelectorAll('[data-motion-panel]').forEach(revealAnalysisPanel));
  } catch {
    // A failed enhancement must never hide the original, accessible chart.
    if (motionRequests.get(figure) !== requestId) return;
    const previousPlot = figure.querySelector('.analysis-plot-svg');
    previousPlot?.querySelectorAll('[data-motion-panel]').forEach(panel => motionObserver?.unobserve(panel));
    previousPlot?.remove();
    picture.hidden = false;
  }
}
motionFigures.forEach(enhanceAnalysisPlot);
mobilePlots.addEventListener('change', () => motionFigures.forEach(enhanceAnalysisPlot));
document.querySelectorAll('.analysis-item').forEach(disclosure => {
  disclosure.addEventListener('toggle', () => {
    if (disclosure.open) replayAnalysisPlots(disclosure);
    else disclosure.querySelectorAll('[data-motion-panel]').forEach(panel => {
      panel.classList.remove('is-revealing');
      motionPanelsPlayed.delete(panel);
    });
  });
});
document.addEventListener('analysis-tabchange', event => replayAnalysisPlots(event.detail));
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) motionFigures.forEach(figure => {
    figure.querySelectorAll('.is-revealing').forEach(panel => panel.classList.remove('is-revealing'));
  });
});
if (!motionObserver) window.addEventListener('scroll', () => {
  motionFigures.forEach(figure => figure.querySelectorAll('[data-motion-panel]').forEach(revealAnalysisPanel));
}, {passive: true});
