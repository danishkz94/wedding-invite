(() => {
  "use strict";

  const config = window.INVITE || {};
  const root = document.documentElement;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themes = ["royal-olive", "ivory-garden", "rose-romance"];
  const byId = id => document.getElementById(id);
  const isPlaceholder = value => !value || value.includes("[PLACEHOLDER:");
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  let repaintScratch = () => {};
  let refreshArtwork = () => {};

  function applyTheme(theme) {
    root.dataset.theme = themes.includes(theme) ? theme : themes[0];
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === root.dataset.theme));
    });
    document.querySelector('meta[name="theme-color"]').content = css("--door");
    repaintScratch();
    refreshArtwork();
  }

  applyTheme(config.theme);
  byId("theme-preview").hidden = !config.previewThemes;
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeChoice));
  });
  document.querySelectorAll("[data-content]").forEach(element => {
    const value = element.dataset.content.split(".").reduce((object, key) => object?.[key], config);
    element.textContent = typeof value === "string" ? value : "[PLACEHOLDER: Details to be confirmed]";
  });
  byId("door-prompt").textContent = config.door?.prompt || "Tap to open";
  document.title = `${config.couple?.brideName || "Bride"} & ${config.couple?.groomName || "Groom"} | Wedding Invitation`;
  const versePlaceholder = isPlaceholder(config.verse?.arabic);
  document.querySelector(".verse .placeholder-label").hidden = !versePlaceholder;
  if (versePlaceholder) {
    document.querySelector(".verse-arabic").lang = "en";
    document.querySelector(".verse-arabic").dir = "ltr";
  }

  function initializeCountdown() {
    const event = config.couple || {};
    const timestamp = event.eventDate || "";
    const explicitOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp);
    const calendarDate = timestamp.slice(0, 10);
    const calendarDay = new Date(`${calendarDate}T00:00:00Z`);
    const validDay = Number.isFinite(calendarDay.getTime()) && calendarDay.toISOString().startsWith(`${calendarDate}T`);
    const target = explicitOffset && validDay ? Date.parse(timestamp) : NaN;
    const grid = byId("countdown-grid");
    const message = byId("countdown-finished");
    let formattedDate;
    let formattedTime;
    try {
      if (!Number.isFinite(target) || !event.timeZone) throw new Error("Unconfigured wedding date");
      formattedDate = new Intl.DateTimeFormat("en", { timeZone: event.timeZone, day: "numeric", month: "long", year: "numeric" }).format(target);
      formattedTime = new Intl.DateTimeFormat("en", { timeZone: event.timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(target);
    } catch {
      grid.hidden = true;
      message.hidden = false;
      message.textContent = "Our wedding date is still to be confirmed.";
      byId("countdown-date").textContent = "Date and timezone to be confirmed";
      document.querySelector(".scratch-date").textContent = "Date to be confirmed";
      document.querySelector(".scratch-time").textContent = "Please check back for the celebration details.";
      return;
    }
    const dateLabel = isPlaceholder(event.displayDate) ? formattedDate : event.displayDate;
    const timeLabel = isPlaceholder(event.displayTime) ? formattedTime : event.displayTime;
    document.querySelector(".scratch-date").textContent = dateLabel;
    document.querySelector(".scratch-time").textContent = timeLabel;
    byId("countdown-date").textContent = `${formattedDate} · ${formattedTime}`;
    if (event.dateIsSample) {
      byId("date-notice").hidden = false;
      byId("date-notice").textContent = "Sample date only. The hosts will confirm the wedding details.";
      document.querySelector(".scratch-time").textContent = `${timeLabel} · sample date`;
    }
    let timer;
    function update() {
      const remaining = target - Date.now();
      if (remaining <= 0) {
        grid.hidden = true;
        message.hidden = false;
        message.textContent = config.countdown?.passedMessage || "Our forever has begun. Thank you for celebrating with us!";
        window.clearInterval(timer);
        return;
      }
      const seconds = Math.floor(remaining / 1000);
      const values = [Math.floor(seconds / 86400), Math.floor(seconds % 86400 / 3600), Math.floor(seconds % 3600 / 60), seconds % 60];
      ["days", "hours", "minutes", "seconds"].forEach((unit, index) => {
        byId(`countdown-${unit}`).textContent = String(values[index]).padStart(2, "0");
      });
    }
    update();
    if (target > Date.now()) timer = window.setInterval(update, 1000);
  }

  function initializeGallery() {
    const track = byId("gallery-track");
    const photos = config.gallery?.photos || [];
    photos.forEach(photo => {
      const figure = document.createElement("figure");
      figure.className = "gallery-slide swiper-slide";
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt || "Wedding detail";
      image.width = 800;
      image.height = 900;
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      const title = document.createElement("span");
      title.textContent = photo.caption || "";
      caption.append(title);
      image.addEventListener("error", () => {
        image.hidden = true;
        figure.classList.add("photo-unavailable");
        title.textContent = `Photo placeholder: ${photo.alt || "Wedding detail"}`;
      });
      figure.append(image, caption);
      track.append(figure);
    });
    if (!photos.length) {
      byId("photos").hidden = true;
      return;
    }
    if (!window.Swiper) {
      document.querySelector(".gallery-controls").hidden = true;
      return;
    }
    const carousel = new window.Swiper("#gallery-carousel", {
      slidesPerView: 1,
      spaceBetween: 24,
      speed: motion.matches ? 0 : 550,
      grabCursor: true,
      keyboard: { enabled: false },
      a11y: { enabled: true, slideLabelMessage: "Photo {{index}} of {{slidesLength}}" },
      pagination: { el: "#gallery-pagination", clickable: true, renderBullet: (index, className) => `<button type="button" class="${className}" aria-label="Show photo ${index + 1}"></button>` },
      navigation: { nextEl: "#gallery-next", prevEl: "#gallery-prev" },
      breakpoints: { 700: { slidesPerView: 1.65, centeredSlides: true, spaceBetween: 28 } }
    });
    byId("gallery-carousel").addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        if (event.key === "ArrowRight") carousel.slideNext();
        else carousel.slidePrev();
      }
    });
    motion.addEventListener("change", () => { carousel.params.speed = motion.matches ? 0 : 550; });
  }

  function defaultMapsLink(query) {
    const encoded = encodeURIComponent(query);
    const agent = navigator.userAgent;
    if (/iPhone|iPad|iPod|Macintosh/.test(agent)) return `https://maps.apple.com/?q=${encoded}`;
    if (/Android/i.test(agent)) return `geo:0,0?q=${encoded}`;
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  function initializeVenue() {
    const query = config.venue?.mapsQuery || config.venue?.address;
    if (isPlaceholder(query)) {
      byId("map-notice").hidden = false;
      document.querySelector(".map-frame").hidden = true;
      byId("directions-button").hidden = true;
      return;
    }
    const encoded = encodeURIComponent(query);
    const link = defaultMapsLink(query);
    byId("venue-map").src = `https://www.google.com/maps?q=${encoded}&output=embed`;
    byId("venue-map").tabIndex = -1;
    byId("map-overlay").href = link;
    byId("directions-button").href = link;
  }

  function heartPath(width, height) {
    const shape = new Path2D();
    shape.moveTo(width * .5, height * .92);
    shape.bezierCurveTo(width * .39, height * .81, width * .04, height * .54, width * .06, height * .30);
    shape.bezierCurveTo(width * .08, height * .04, width * .39, height * .02, width * .5, height * .25);
    shape.bezierCurveTo(width * .61, height * .02, width * .92, height * .04, width * .94, height * .30);
    shape.bezierCurveTo(width * .96, height * .54, width * .61, height * .81, width * .5, height * .92);
    shape.closePath();
    return shape;
  }

  function initializeScratch() {
    const canvas = byId("scratch-canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const status = byId("scratch-status");
    const button = byId("reveal-date");
    let revealed = false;
    let pointer = null;
    let previous = null;
    let width = 0;
    let height = 0;
    let shape;
    let samples = [];
    let strokes = [];
    let lastCheck = 0;
    let celebrationFired = false;
    let celebration;
    motion.addEventListener("change", () => { if (motion.matches) celebration?.reset(); });
    const under = byId("scratch-under");
    under.setAttribute("aria-hidden", "true");
    status.textContent = config.scratch?.prompt || "Scratch to reveal";
    function celebrate() {
      if (celebrationFired) return;
      celebrationFired = true;
      if (!motion.matches && window.confetti) {
        const bounds = canvas.getBoundingClientRect();
        celebration = window.confetti.create(byId("confetti-canvas"), { resize: true, disableForReducedMotion: true });
        celebration({
          particleCount: 85, spread: 65, startVelocity: 25, ticks: 145, gravity: 1.1,
          origin: { x: .5, y: Math.min(.85, Math.max(.15, (bounds.top + bounds.height / 2) / window.innerHeight)) },
          colors: [css("--gold"), css("--petal"), css("--leaf"), css("--scratch-light")]
        });
      }
    }
    function releasePointer() {
      if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
      pointer = null;
      previous = null;
    }
    function reveal() {
      if (revealed) return;
      revealed = true;
      releasePointer();
      canvas.hidden = true;
      under.removeAttribute("aria-hidden");
      button.disabled = true;
      button.textContent = "Date revealed";
      status.textContent = config.scratch?.revealedMessage || "The wedding date is revealed.";
      celebrate();
    }
    button.addEventListener("click", reveal);
    if (!context) {
      canvas.hidden = true;
      return;
    }
    function erase(start, end) {
      context.save();
      context.clip(shape);
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = Math.max(28, width * .105);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(start.x * width, start.y * height);
      context.lineTo(end.x * width + .01, end.y * height + .01);
      context.stroke();
      context.restore();
    }
    function paint() {
      if (revealed) return;
      releasePointer();
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      shape = heartPath(width, height);
      const foil = context.createLinearGradient(0, 0, width, height);
      foil.addColorStop(0, css("--scratch-light"));
      foil.addColorStop(.45, css("--scratch"));
      foil.addColorStop(1, css("--scratch-light"));
      context.fillStyle = foil;
      context.fill(shape);
      context.save();
      context.clip(shape);
      context.strokeStyle = css("--gold");
      context.globalAlpha = .14;
      context.lineWidth = .7;
      for (let line = -height; line < width + height; line += 9) {
        context.beginPath();
        context.moveTo(line, 0);
        context.lineTo(line + height, height);
        context.stroke();
      }
      context.restore();
      context.strokeStyle = css("--gold");
      context.lineWidth = 1.5;
      context.stroke(shape);
      context.fillStyle = css("--ink");
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "italic 23px Georgia, serif";
      context.fillText("A date with forever", width / 2, height * .45, width * .7);
      context.font = "11px Georgia, serif";
      context.fillText(config.scratch?.prompt || "Scratch to reveal", width / 2, height * .55, width * .65);
      const mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      const maskContext = mask.getContext("2d");
      maskContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      maskContext.fill(shape);
      const maskPixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
      samples = [];
      const step = Math.max(1, Math.round(ratio * 3));
      for (let row = 0; row < mask.height; row += step) {
        for (let column = 0; column < mask.width; column += step) {
          const alpha = (row * mask.width + column) * 4 + 3;
          if (maskPixels[alpha] > 240) samples.push(alpha);
        }
      }
      strokes.forEach(stroke => erase(stroke.start, stroke.end));
      canvas.classList.add("is-ready");
    }
    function checkProgress() {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let erased = 0;
      samples.forEach(alpha => { if (pixels[alpha] < 64) erased += 1; });
      const cleared = samples.length ? erased / samples.length : 0;
      canvas.dataset.cleared = cleared.toFixed(3);
      if (cleared >= .5) reveal();
    }
    function point(event) {
      const bounds = canvas.getBoundingClientRect();
      return { x: (event.clientX - bounds.left) / width, y: (event.clientY - bounds.top) / height };
    }
    function inside(location) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      const result = context.isPointInPath(shape, location.x * width, location.y * height);
      context.restore();
      return result;
    }
    canvas.addEventListener("pointerdown", event => {
      if (revealed || pointer !== null || !event.isPrimary || event.button !== 0) return;
      const location = point(event);
      if (!inside(location)) return;
      event.preventDefault();
      pointer = event.pointerId;
      previous = location;
      canvas.setPointerCapture(pointer);
      erase(location, location);
      strokes.push({ start: location, end: location });
    });
    canvas.addEventListener("pointermove", event => {
      if (pointer !== event.pointerId || revealed) return;
      event.preventDefault();
      const location = point(event);
      erase(previous, location);
      strokes.push({ start: previous, end: location });
      previous = location;
      if (performance.now() - lastCheck > 100) {
        lastCheck = performance.now();
        checkProgress();
      }
    });
    function stop(event) {
      if (pointer !== event.pointerId) return;
      releasePointer();
      checkProgress();
    }
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    canvas.addEventListener("lostpointercapture", stop);
    window.addEventListener("blur", releasePointer);
    canvas.addEventListener("touchstart", event => {
      if (pointer !== null) event.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchmove", event => {
      if (pointer !== null) event.preventDefault();
    }, { passive: false });
    repaintScratch = paint;
    let resizeFrame;
    new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(paint);
    }).observe(canvas);
    paint();
  }

  function initializeReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const media = window.gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      document.querySelectorAll(".section-pad .reveal").forEach(element => {
        window.gsap.from(element, {
          y: 22, duration: .85, ease: "power2.out", immediateRender: false,
          scrollTrigger: { trigger: element, start: "top 94%", once: true }
        });
      });
    });
  }

  function createDrapery(parent, state) {
    const canvas = document.createElement("canvas");
    canvas.className = "intro-fabric";
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d");
    const texture = document.createElement("canvas");
    const textureContext = texture.getContext("2d");
    let image;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let lastGather = -1;
    let lastHem = -1;
    let bands = [];
    if (!context || !textureContext) return { setImage() {}, resize() {}, render() {}, dispose() {} };
    parent.append(canvas);
    parent.classList.add("is-gathered");

    function render() {
      if (!image || !width || !height || (lastGather === state.gather && lastHem === state.hem)) return;
      lastGather = state.gather;
      lastHem = state.hem;
      const upper = state.gather;
      const lower = state.hem;
      const billow = Math.sin(lower * Math.PI) * 24;
      const widths = [500 - 70 * upper, 500 - 320 * upper, 500 - 500 * upper, 500 - 390 * upper, 500 - 460 * lower + billow, 500 - 580 * lower + billow, 500 - 630 * lower];
      const edges = bands.map(band => band.weights.reduce((total, weight, index) => total + weight * widths[band.segment + index], 0) * width / 1000);
      context.clearRect(0, 0, width, height);
      [false, true].forEach(mirrored => {
        const outline = new Path2D();
        outline.moveTo(mirrored ? width : 0, 0);
        bands.forEach((band, index) => outline.lineTo(mirrored ? width - edges[index] : edges[index], band.top));
        outline.lineTo(mirrored ? width : 0, height);
        outline.closePath();
        context.save();
        context.shadowColor = "rgba(48, 29, 19, .45)";
        context.shadowBlur = 16 * ratio;
        context.shadowOffsetX = mirrored ? -7 : 7;
        context.shadowOffsetY = 6;
        context.fillStyle = css("--curtain-shadow");
        context.fill(outline);
        context.restore();
      });
      const sourceHalf = texture.width / 2;
      bands.forEach((band, index) => {
        const sourceTop = band.top * ratio;
        const sourceHeight = Math.min(band.height * ratio, texture.height - sourceTop);
        const edge = Math.max(.15, edges[index]);
        context.drawImage(texture, 0, sourceTop, sourceHalf, sourceHeight, 0, band.top, edge, band.height + .3);
        context.drawImage(texture, sourceHalf, sourceTop, sourceHalf, sourceHeight, width - edge, band.top, edge, band.height + .3);
      });
      const valance = new Path2D();
      valance.moveTo(0, 0);
      valance.lineTo(width, 0);
      valance.lineTo(width, height * .11);
      valance.quadraticCurveTo(width * .83, height * .2, width * .66, height * .08);
      valance.quadraticCurveTo(width * .5, height * .23, width * .33, height * .08);
      valance.quadraticCurveTo(width * .16, height * .2, 0, height * .11);
      valance.closePath();
      context.save();
      context.clip(valance);
      context.drawImage(texture, 0, 0, texture.width, texture.height, 0, 0, width, height);
      context.restore();
      context.save();
      const upperKnotProgress = Math.min(1, Math.max(0, (upper - .72) / .28));
      const lowerKnotProgress = Math.min(1, Math.max(0, (lower - .68) / .32));
      const knotProgress = Math.min(upperKnotProgress, lowerKnotProgress);
      const knotReveal = knotProgress * knotProgress * (3 - 2 * knotProgress);
      if (knotProgress > 0) {
        context.globalAlpha = knotReveal;
        [false, true].forEach(mirrored => {
          context.save();
          if (mirrored) { context.translate(width, 0); context.scale(-1, 1); }
          context.scale(width / 1000, height / 1000);
          const knotScale = .72 + .28 * knotProgress;
          context.translate(111, 559);
          context.scale(knotScale, knotScale);
          context.translate(-111, -559);
          const rope = context.createLinearGradient(0, 535, 0, 605);
          rope.addColorStop(0, "#fff1c1");
          rope.addColorStop(.28, css("--gold-light"));
          rope.addColorStop(.6, css("--gold"));
          rope.addColorStop(1, "#64441f");
          context.shadowColor = "rgba(50, 29, 13, .6)";
          context.shadowBlur = 4;
          context.shadowOffsetX = 2;
          context.shadowOffsetY = 3;
          context.strokeStyle = rope;
          context.lineWidth = 9;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(-8, 545);
          context.bezierCurveTo(32, 584, 76, 581, 112, 557);
          context.stroke();
          context.lineWidth = 5;
          context.beginPath();
          context.ellipse(111, 559, 17, 10, -.5, 0, Math.PI * 2);
          context.ellipse(111, 559, 17, 10, .5, 0, Math.PI * 2);
          context.moveTo(110, 570);
          context.bezierCurveTo(102, 591, 92, 592, 92, 617);
          context.moveTo(115, 569);
          context.bezierCurveTo(128, 588, 116, 603, 119, 633);
          context.stroke();
          context.shadowBlur = 0;
          context.fillStyle = rope;
          [ { x: 92, y: 617 }, { x: 119, y: 633 } ].forEach(tassel => {
            context.beginPath();
            context.ellipse(tassel.x, tassel.y, 8, 6, 0, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.moveTo(tassel.x - 6, tassel.y + 3);
            context.quadraticCurveTo(tassel.x - 10, tassel.y + 18, tassel.x - 10, tassel.y + 26);
            context.lineTo(tassel.x + 10, tassel.y + 26);
            context.quadraticCurveTo(tassel.x + 10, tassel.y + 18, tassel.x + 6, tassel.y + 3);
            context.closePath();
            context.fill();
            context.strokeStyle = "#fff0bb";
            context.lineWidth = .9;
            for (let strand = -5; strand <= 5; strand += 2.5) {
              context.beginPath();
              context.moveTo(tassel.x + strand * .6, tassel.y + 6);
              context.lineTo(tassel.x + strand, tassel.y + 25);
              context.stroke();
            }
            context.strokeStyle = rope;
          });
          context.restore();
        });
      }
      context.restore();
      canvas.dataset.gather = upper.toFixed(3);
      canvas.dataset.hem = lower.toFixed(3);
      canvas.dataset.tiebacks = knotProgress > .999 ? "visible" : knotProgress > 0 ? "forming" : "hidden";
      canvas.dataset.hemTucked = lower > .99 ? "true" : "false";
      canvas.dataset.source = image.getAttribute("src");
    }

    function resize() {
      if (!image) return;
      const bounds = parent.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      texture.width = canvas.width;
      texture.height = canvas.height;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      textureContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      textureContext.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
      bands = Array.from({ length: Math.ceil(height) }, (_, index) => {
        const progress = Math.min(index / height, 1);
        const segment = progress < .56 ? 0 : 3;
        const fraction = progress < .56 ? progress / .56 : (progress - .56) / .44;
        const remaining = 1 - fraction;
        return { top: index, height: Math.min(1, height - index), segment, weights: [remaining ** 3, 3 * remaining ** 2 * fraction, 3 * remaining * fraction ** 2, fraction ** 3] };
      });
      lastGather = -1;
      lastHem = -1;
      render();
    }

    return {
      render,
      resize,
      setImage(source) { if (image !== source) { image = source; resize(); } },
      dispose() { canvas.width = 1; canvas.height = 1; texture.width = 1; texture.height = 1; }
    };
  }

  function initializeEntrance() {
    const stage = byId("door-stage");
    const main = byId("invitation");
    const preview = byId("theme-preview");
    const button = byId("door-open");
    const audio = byId("invite-audio");
    const musicToggle = byId("music-toggle");
    const musicStatus = byId("music-status");
    const frame = stage.querySelector(".intro-frame");
    const scene = byId("intro-scene");
    const doors = byId("intro-doors");
    const curtains = byId("intro-curtains");
    const hero = byId("couple");
    const content = hero.querySelector(".couple-content");
    const backdrop = hero.querySelector(".curtain-backdrop");
    const backgroundImage = document.createElement("img");
    const displacement = byId("taj-background-displacement");
    const status = byId("intro-status");
    const skip = byId("entrance-skip");
    let opening = false;
    let finished = false;
    let timeline;
    let fallback;
    let ready = false;
    let generation = 0;
    let images;
    const imageCache = new Map();
    const doorTextureCache = new WeakMap();
    const fabricState = { gather: 0, hem: 0 };
    const fabric = createDrapery(curtains, fabricState);
    audio.volume = .45;

    function syncMusicButton(playing) {
      musicToggle.setAttribute("aria-pressed", String(playing));
      musicToggle.textContent = playing ? "Pause music" : "Play music";
    }

    function startMusic() {
      musicStatus.textContent = "";
      audio.play().catch(error => {
        syncMusicButton(false);
        musicStatus.textContent = "Music could not start. Use the Play music button to try again.";
        console.warn("Invitation music could not be played:", error);
      });
    }

    audio.addEventListener("play", () => syncMusicButton(true));
    audio.addEventListener("pause", () => syncMusicButton(false));
    audio.addEventListener("error", () => {
      syncMusicButton(false);
      musicStatus.textContent = "Invitation music could not be loaded.";
      console.warn("Invitation music could not be loaded.");
    });
    musicToggle.addEventListener("click", () => {
      if (audio.paused) startMusic();
      else audio.pause();
    });
    hero.classList.add("is-image-hero");
    backdrop.replaceChildren();
    backgroundImage.className = "hero-scene-image";
    backgroundImage.alt = "";
    backgroundImage.setAttribute("aria-hidden", "true");
    backgroundImage.decoding = "async";
    backgroundImage.fetchPriority = "high";
    scene.append(backgroundImage);
    scene.append(content);
    frame.append(preview);
    button.disabled = true;

    function loadImage(source) {
      if (typeof source !== "string" || !source.trim()) return Promise.reject(new Error("Missing intro image"));
      if (imageCache.has(source)) return imageCache.get(source);
      const request = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const decoded = typeof image.decode === "function" ? image.decode().catch(() => {}) : Promise.resolve();
          decoded.then(() => resolve(image));
        };
        image.onerror = () => reject(new Error(`Unable to load intro image: ${source}`));
        image.src = source;
      });
      imageCache.set(source, request);
      return request;
    }

    function fitPanels(image, left, right) {
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      if (left.id === "left-door") {
        if (!doorTextureCache.has(image)) {
          const sample = document.createElement("canvas");
          sample.width = Math.floor(image.naturalWidth * .25);
          sample.height = image.naturalHeight;
          const context = sample.getContext("2d");
          const textures = [0, image.naturalWidth - sample.width].map(sourceX => {
            context.clearRect(0, 0, sample.width, sample.height);
            context.drawImage(image, sourceX, 0, sample.width, sample.height, 0, 0, sample.width, sample.height);
            return sample.toDataURL("image/jpeg", .94);
          });
          doorTextureCache.set(image, textures);
        }
        [left, right].forEach((panel, index) => {
          panel.style.backgroundImage = `url(${JSON.stringify(doorTextureCache.get(image)[index])})`;
          panel.style.backgroundSize = "cover";
          panel.style.backgroundPosition = "center";
        });
        return;
      }
      const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const offsetX = (bounds.width - width) / 2;
      const offsetY = (bounds.height - height) / 2;
      [left, right].forEach((panel, index) => {
        panel.style.backgroundImage = `url(${JSON.stringify(image.src)})`;
        panel.style.backgroundSize = `${width}px ${height}px`;
        panel.style.backgroundPosition = `${offsetX - index * bounds.width / 2}px ${offsetY}px`;
      });
    }

    function resizePanels() {
      if (!images) return;
      if (!finished) {
        fitPanels(images[0], byId("left-door"), byId("right-door"));
        fitPanels(images[1], byId("left-curtain"), byId("right-curtain"));
      }
      fabric.setImage(images[1]);
      fabric.resize();
    }

    const resizeObserver = new ResizeObserver(resizePanels);
    resizeObserver.observe(frame);
    refreshArtwork = () => {
      const artwork = config.artwork?.[root.dataset.theme] || {};
      const intro = config.intro || {};
      const sources = [artwork.doorImage || intro.doorImage, artwork.closedCurtains || intro.curtainImage, artwork.openBackdrop || intro.backgroundImage];
      const current = ++generation;
      ready = false;
      button.disabled = true;
      status.textContent = "Preparing your invitation...";
      Promise.all(sources.map(loadImage)).then(loaded => {
        if (current !== generation) return;
        images = loaded;
        backgroundImage.src = loaded[2].src;
        backgroundImage.width = loaded[2].naturalWidth;
        backgroundImage.height = loaded[2].naturalHeight;
        hero.dataset.artworkStatus = "ready";
        ready = true;
        resizePanels();
        status.textContent = "";
        button.disabled = finished || opening;
        if (!finished && !opening && document.activeElement === skip) button.focus({ preventScroll: true });
      }).catch(error => {
        if (current !== generation) return;
        console.warn(error.message);
        hero.dataset.artworkStatus = "unavailable";
        status.textContent = "The artwork is unavailable. Opening the invitation.";
        finish();
      });
    };

    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      resizeObserver.disconnect();
      timeline?.kill();
      doors.style.display = "none";
      fabricState.gather = 1;
      fabricState.hem = 1;
      fabric.render();
      backgroundImage.style.removeProperty("transform");
      backgroundImage.style.filter = "none";
      displacement.setAttribute("scale", "0");
      backdrop.append(backgroundImage);
      hero.append(curtains);
      hero.append(musicToggle);
      resizeObserver.observe(hero);
      hero.insertBefore(content, hero.querySelector(".scroll-cue"));
      root.classList.remove("is-locked");
      main.inert = false;
      stage.hidden = true;
      preview.inert = false;
      musicToggle.hidden = false;
      document.body.append(preview);
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      hero.tabIndex = -1;
      hero.focus({ preventScroll: true });
      window.requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
      window.ScrollTrigger?.refresh();
    }
    function open(skipAnimation = false) {
      if (skipAnimation) { startMusic(); finish(); return; }
      if (opening || finished || !ready) return;
      opening = true;
      startMusic();
      button.disabled = true;
      button.style.pointerEvents = "none";
      preview.inert = true;
      skip.focus({ preventScroll: true });
      fallback = window.setTimeout(finish, 8500);
      if (motion.matches || !window.gsap) { finish(); return; }
      try {
        const backgroundScale = window.matchMedia("(max-height: 500px)").matches ? 1.04 : 1.14;
        timeline = window.gsap.timeline({ onComplete: finish, onUpdate: fabric.render });
        timeline.to(button, { scale: .96, opacity: 0, duration: .35, ease: "power2.inOut" }, 0)
          .to("#left-door", { rotationY: -108, duration: 2.4, ease: "power2.inOut", transformOrigin: "left center" }, .2)
          .to("#right-door", { rotationY: 108, duration: 2.4, ease: "power2.inOut", transformOrigin: "right center" }, .2)
          .set(doors, { display: "none" }, 2.6)
          .set(backgroundImage, { scale: 1.045, skewX: .4, filter: "url(#taj-background-morph)", transformOrigin: "50% 100%" }, 0)
          .set(displacement, { attr: { scale: 18 } }, 0)
          .to(backgroundImage, { scale: backgroundScale, skewX: 0, duration: 2.25, ease: "sine.inOut" }, 2.25)
          .to(displacement, { attr: { scale: 0 }, duration: 2.25, ease: "sine.inOut" }, 2.25)
          .to(fabricState, { gather: 1, duration: 1.8, ease: "power2.inOut" }, 2.3)
          .to(fabricState, { hem: 1, duration: 2.05, ease: "power2.inOut" }, 2.45);
      } catch { finish(); }
    }
    button.addEventListener("click", () => open());
    byId("entrance-skip").addEventListener("click", () => open(true));
    document.querySelector(".skip-link").addEventListener("click", () => finish());
    stage.addEventListener("keydown", event => {
      if (event.key === "Escape") open(true);
      if (event.key !== "Tab") return;
      const focusable = [...stage.querySelectorAll("button:not(:disabled)")].filter(element => !element.closest("[hidden], [inert]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    motion.addEventListener("change", () => { if (opening && motion.matches) finish(); });
    main.inert = true;
    stage.hidden = false;
    root.classList.add("is-locked");
    skip.focus({ preventScroll: true });
    refreshArtwork();
    window.addEventListener("pagehide", finish, { once: true });
  }

  [initializeCountdown, initializeGallery, initializeVenue, initializeScratch, initializeReveals].forEach(initialize => {
    try { initialize(); } catch (error) { console.error("Invitation enhancement unavailable:", error); }
  });
  initializeEntrance();
})();