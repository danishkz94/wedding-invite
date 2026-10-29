(() => {
  "use strict";

  const config = window.INVITE;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const doorStage = document.getElementById("door-stage");
  const doorButton = document.getElementById("door-open");
  const status = document.getElementById("scratch-status");
  let doorOpening = false;

  function openDoors() {
    if (doorOpening) return;
    doorOpening = true;
    doorButton.disabled = true;
    doorStage.classList.add("is-opening");
    window.setTimeout(() => {
      root.classList.remove("is-locked");
      doorStage.setAttribute("aria-hidden", "true");
      doorStage.hidden = true;
      doorButton.blur();
    }, reducedMotion.matches ? 0 : 1450);
  }

  doorButton.addEventListener("click", openDoors);
  document.querySelector(".skip-link").addEventListener("click", event => {
    event.preventDefault();
    openDoors();
    window.setTimeout(() => document.getElementById("verse").scrollIntoView(), reducedMotion.matches ? 0 : 1500);
  });
  doorButton.focus({ preventScroll: true });

  if (!config) {
    console.error("Missing invitation configuration: invite-config.js");
  } else {
    document.querySelectorAll("[data-content]").forEach(element => {
      const value = element.dataset.content.split(".").reduce((object, key) => object?.[key], config);
      if (typeof value !== "string") {
        console.error(`Missing invitation text: ${element.dataset.content}`);
        return;
      }
      element.textContent = value;
    });
    document.getElementById("door-prompt").textContent = config.door.prompt;
    document.title = `${config.couple.brideName} & ${config.couple.groomName} | Wedding Invitation`;
    status.textContent = config.scratch.prompt;
  }

  function initializeGallery() {
    if (!config?.gallery?.photos?.length) return;
    const track = document.getElementById("gallery-track");
    const carousel = document.getElementById("gallery-carousel");
    const pagination = document.getElementById("gallery-pagination");
    const slides = config.gallery.photos.map((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = "gallery-slide";
      figure.id = `gallery-slide-${index + 1}`;

      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";

      const caption = document.createElement("figcaption");
      const title = document.createElement("span");
      title.textContent = photo.caption;
      const credit = document.createElement("a");
      credit.href = photo.creditUrl;
      credit.target = "_blank";
      credit.rel = "noopener noreferrer";
      credit.textContent = `Photo by ${photo.photographer}`;
      caption.append(title, credit);
      figure.append(image, caption);
      track.append(figure);

      const dot = document.createElement("button");
      dot.className = "pagination-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show photo ${index + 1}`);
      dot.setAttribute("aria-current", index === 0 ? "true" : "false");
      dot.addEventListener("click", () => {
        pagination.querySelectorAll("button").forEach((button, buttonIndex) => {
          button.setAttribute("aria-current", String(buttonIndex === index));
        });
        figure.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
      });
      pagination.append(dot);
      return figure;
    });

    let framePending = false;
    carousel.addEventListener("scroll", () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(() => {
        const center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        slides.forEach((slide, index) => {
          const bounds = slide.getBoundingClientRect();
          const distance = Math.abs(bounds.left + bounds.width / 2 - center);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        pagination.querySelectorAll("button").forEach((button, index) => {
          button.setAttribute("aria-current", String(index === nearestIndex));
        });
        framePending = false;
      });
    }, { passive: true });
  }

  initializeGallery();

  function initializeVenue() {
    if (!config?.venue?.address) return;
    const address = encodeURIComponent(config.venue.address);
    const directions = `https://www.google.com/maps/search/?api=1&query=${address}`;
    document.getElementById("venue-map").src = `https://www.google.com/maps?q=${address}&output=embed`;
    document.getElementById("map-overlay").href = directions;
    document.getElementById("directions-button").href = directions;
  }

  initializeVenue();

  function initializeCountdown() {
    const target = Date.parse(config?.couple?.eventDate || "");
    if (!Number.isFinite(target)) return;
    const grid = document.getElementById("countdown-grid");
    const finished = document.getElementById("countdown-finished");
    let timer;

    function update() {
      const remaining = target - Date.now();
      if (remaining <= 0) {
        grid.hidden = true;
        finished.hidden = false;
        finished.textContent = config.countdown.passedMessage;
        if (timer) window.clearInterval(timer);
        return;
      }
      const seconds = Math.floor(remaining / 1000);
      document.getElementById("countdown-days").textContent = String(Math.floor(seconds / 86400));
      document.getElementById("countdown-hours").textContent = String(Math.floor((seconds % 86400) / 3600)).padStart(2, "0");
      document.getElementById("countdown-minutes").textContent = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      document.getElementById("countdown-seconds").textContent = String(seconds % 60).padStart(2, "0");
    }

    update();
    if (target > Date.now()) timer = window.setInterval(update, 1000);
  }

  initializeCountdown();

  function makeHeartPath(width, height) {
    const path = new Path2D();
    path.moveTo(width * 0.5, height * 0.9);
    path.bezierCurveTo(width * 0.08, height * 0.61, width * 0.02, height * 0.38, width * 0.16, height * 0.2);
    path.bezierCurveTo(width * 0.31, height * 0.02, width * 0.47, height * 0.13, width * 0.5, height * 0.3);
    path.bezierCurveTo(width * 0.53, height * 0.13, width * 0.69, height * 0.02, width * 0.84, height * 0.2);
    path.bezierCurveTo(width * 0.98, height * 0.38, width * 0.92, height * 0.61, width * 0.5, height * 0.9);
    path.closePath();
    return path;
  }

  function launchConfetti() {
    if (reducedMotion.matches) return;
    const canvas = document.getElementById("confetti-canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = ["#a57a42", "#ba7662", "#7d8564", "#e4c990", "#fbf5e8"];
    const pieces = Array.from({ length: 95 }, () => ({
      x: Math.random() * width,
      y: -Math.random() * height * 0.45,
      vx: (Math.random() - 0.5) * 2.8,
      vy: Math.random() * 2.2 + 1.5,
      size: Math.random() * 7 + 4,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    const started = performance.now();

    function drawFrame(now) {
      context.clearRect(0, 0, width, height);
      pieces.forEach(piece => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.035;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.65);
        context.restore();
      });
      if (now - started < 2100) window.requestAnimationFrame(drawFrame);
      else context.clearRect(0, 0, width, height);
    }

    window.requestAnimationFrame(drawFrame);
  }

  function initializeScratchCard() {
    const canvas = document.getElementById("scratch-canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let drawing = false;
    let revealed = false;
    let shape;

    function paintCover() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      shape = makeHeartPath(width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#d8c398");
      gradient.addColorStop(0.5, "#c2a16b");
      gradient.addColorStop(1, "#e5d6b7");
      context.fillStyle = gradient;
      context.fill(shape);
      context.save();
      context.clip(shape);
      context.globalAlpha = 0.18;
      for (let line = -height; line < width + height; line += 13) {
        context.beginPath();
        context.moveTo(line, 0);
        context.lineTo(line + height, height);
        context.strokeStyle = line % 2 ? "#fffaf0" : "#8f7146";
        context.lineWidth = 1;
        context.stroke();
      }
      context.restore();
      context.strokeStyle = "#8e7047";
      context.lineWidth = 1.5;
      context.stroke(shape);
      context.fillStyle = "#fffaf0";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "500 14px Manrope, sans-serif";
      context.fillText(config?.scratch?.prompt || "Scratch to reveal", width / 2, height * 0.48);
      context.font = "20px serif";
      context.fillText("✦", width / 2, height * 0.58);
    }

    function position(event) {
      const bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    function eraseTo(x, y) {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 44;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineTo(x, y);
      context.stroke();
      context.beginPath();
      context.arc(x, y, 22, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(x, y);
    }

    function scratchedRatio() {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let erased = 0;
      const step = Math.max(8, Math.round(10 * ratio));
      for (let y = step; y < canvas.height - step; y += step) {
        for (let x = step; x < canvas.width - step; x += step) {
          if (!context.isPointInPath(shape, x / ratio, y / ratio)) continue;
          total += 1;
          if (pixels[(y * canvas.width + x) * 4 + 3] < 30) erased += 1;
        }
      }
      return total ? erased / total : 0;
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      context.clearRect(0, 0, width, height);
      canvas.style.pointerEvents = "none";
      document.getElementById("reveal-date").hidden = true;
      status.textContent = config?.scratch?.revealedMessage || "The wedding date is revealed.";
      launchConfetti();
    }

    canvas.addEventListener("pointerdown", event => {
      if (revealed) return;
      event.preventDefault();
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const point = position(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
      eraseTo(point.x, point.y);
    });
    canvas.addEventListener("pointermove", event => {
      if (!drawing || revealed) return;
      event.preventDefault();
      const point = position(event);
      eraseTo(point.x, point.y);
    });
    function stopScratching() {
      if (!drawing) return;
      drawing = false;
      context.beginPath();
      if (scratchedRatio() >= 0.5) reveal();
    }
    canvas.addEventListener("pointerup", stopScratching);
    canvas.addEventListener("pointercancel", stopScratching);
    document.getElementById("reveal-date").addEventListener("click", reveal);
    window.addEventListener("resize", () => { if (!revealed) paintCover(); });
    paintCover();
  }

  initializeScratchCard();

  function initializeReveals() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    function updateMotion() {
      if (reducedMotion.matches) {
        root.classList.remove("motion-ready");
        elements.forEach(element => element.classList.add("is-visible"));
        return;
      }
      root.classList.add("motion-ready");
      elements.forEach(element => {
        if (!element.classList.contains("is-visible")) observer.observe(element);
      });
    }

    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
  }

  initializeReveals();
})();
