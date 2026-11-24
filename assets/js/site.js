/* ============================================================
   Jesus Pena Jr. - portfolio behaviour
   Vanilla JS, no dependencies, no build step.

   Motion inventory (each one earns its place):
     reels     - one video plays at a time, and only while it is on
                 screen, so the page never becomes eight competing
                 autoplaying clips
     carousel  - a multi-slide piece stays one tile that swipes
     nav       - feedback: which section you are currently in
     lightbox  - state transition between thumbnail and full view

   There are no scroll-triggered entrance animations: content is
   present from first paint. Everything here uses
   IntersectionObserver or element-level scroll. There is no window
   scroll listener anywhere.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------
     1. Theme toggle
     --------------------------------------------------------- */
  (function theme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var icon = btn.querySelector("[data-theme-icon]");
    var system = window.matchMedia("(prefers-color-scheme: dark)");

    function current() {
      var set = document.documentElement.getAttribute("data-theme");
      if (set === "light" || set === "dark") return set;
      return system.matches ? "dark" : "light";
    }

    function paint() {
      var isDark = current() === "dark";
      icon.className = "ph " + (isDark ? "ph-sun" : "ph-moon");
      btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    }

    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("jp-theme", next); } catch (e) {}
      paint();
    });

    // Follow the OS while the visitor has not made an explicit choice.
    if (system.addEventListener) {
      system.addEventListener("change", function () {
        if (!document.documentElement.hasAttribute("data-theme")) paint();
      });
    }

    paint();
  })();

  /* ---------------------------------------------------------
     2. Nav: shadow on scroll, scrollspy, mobile menu
     --------------------------------------------------------- */
  (function nav() {
    var header = document.getElementById("nav");
    var sentinel = document.getElementById("top-sentinel");
    var links = document.getElementById("nav-links");
    var toggle = document.getElementById("nav-toggle");

    if (header && sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        header.classList.toggle("is-stuck", !entries[0].isIntersecting);
      }).observe(sentinel);
    }

    if (toggle && links) {
      var burger = toggle.querySelector("[data-burger-icon]");

      function setMenu(open) {
        links.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.classList.toggle("is-locked", open);
        if (burger) burger.className = "ph " + (open ? "ph-x" : "ph-list");
      }

      toggle.addEventListener("click", function () {
        setMenu(toggle.getAttribute("aria-expanded") !== "true");
      });

      links.addEventListener("click", function (e) {
        if (e.target.closest("a")) setMenu(false);
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
          setMenu(false);
          toggle.focus();
        }
      });
    }

    // Scrollspy. Sections are watched through a band across the upper third
    // of the viewport so the active link matches what is being read.
    if (links && "IntersectionObserver" in window) {
      var anchors = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
      var targets = anchors
        .map(function (a) { return document.querySelector(a.getAttribute("href")); })
        .filter(Boolean);

      var visible = new Set();
      var atEnd = false;

      function paint() {
        var activeId = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible.has(targets[i].id)) { activeId = targets[i].id; break; }
        }
        // The last section is shorter than a viewport, so the reading band can
        // never reach it. At the true bottom of the page, it is what you are on.
        if (atEnd && targets.length) activeId = targets[targets.length - 1].id;

        anchors.forEach(function (a) {
          a.classList.toggle("is-active", activeId !== null && a.getAttribute("href") === "#" + activeId);
        });
      }

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        paint();
      }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

      targets.forEach(function (t) { spy.observe(t); });

      var end = document.getElementById("end-sentinel");
      if (end) {
        new IntersectionObserver(function (entries) {
          atEnd = entries[0].isIntersecting;
          paint();
        }).observe(end);
      }
    }
  })();

  /* ---------------------------------------------------------
     3. Reels
        preload="none" keeps 34 MB of video off the initial load.
        Exactly one clip plays at a time: the one most in view.
        Everything else is paused and muted, so scrolling never
        stacks audio or burns battery on offscreen video.
     --------------------------------------------------------- */
  (function reels() {
    var vids = Array.prototype.slice.call(document.querySelectorAll("[data-reel]"));
    if (!vids.length) return;

    var ratios = new WeakMap();
    var current = null;

    function soundBtn(v) {
      var frame = v.closest(".reel__frame");
      return frame ? frame.querySelector("[data-reel-sound]") : null;
    }

    function paintSound(v) {
      var btn = soundBtn(v);
      if (!btn) return;
      var on = !v.muted;
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Mute this reel" : "Turn sound on for this reel");
      var icon = btn.querySelector("[data-reel-sound-icon]");
      if (icon) icon.className = "ph " + (on ? "ph-speaker-simple-high" : "ph-speaker-simple-x");
    }

    function quiet(except) {
      vids.forEach(function (v) {
        if (v === except) return;
        if (!v.paused) v.pause();
        if (!v.muted) { v.muted = true; paintSound(v); }
      });
    }

    function play(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused, poster stays */ });
    }

    function pick() {
      if (reduceMotion.matches) return;
      var best = null, bestRatio = 0;
      vids.forEach(function (v) {
        var r = ratios.get(v) || 0;
        if (r > bestRatio) { bestRatio = r; best = v; }
      });
      if (bestRatio < 0.55) best = null;
      if (best === current) return;
      current = best;
      quiet(best);
      if (best) play(best);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { ratios.set(e.target, e.intersectionRatio); });
        pick();
      }, { threshold: [0, 0.25, 0.5, 0.55, 0.75, 1] });
      vids.forEach(function (v) { io.observe(v); });
    }

    vids.forEach(function (v) {
      // Tap the video for sound. Unmuting one mutes the rest.
      v.addEventListener("click", function () { toggleSound(v); });
      var btn = soundBtn(v);
      if (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleSound(v);
        });
      }
      paintSound(v);
    });

    function toggleSound(v) {
      var turningOn = v.muted;
      if (turningOn) {
        vids.forEach(function (o) { if (o !== v && !o.muted) { o.muted = true; paintSound(o); } });
      }
      v.muted = !turningOn ? true : false;
      paintSound(v);
      if (v.paused) { current = v; quiet(v); play(v); }
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { quiet(null); current = null; }
      else pick();
    });
  })();

  /* ---------------------------------------------------------
     4. Carousels: a multi-slide piece stays one swipeable tile
     --------------------------------------------------------- */
  (function carousels() {
    var roots = Array.prototype.slice.call(document.querySelectorAll("[data-carousel]"));

    roots.forEach(function (root) {
      var track = root.querySelector(".carousel__track");
      if (!track) return;
      var prev = root.querySelector("[data-car-prev]");
      var next = root.querySelector("[data-car-next]");
      var counter = root.querySelector("[data-car-i]");
      var slides = Array.prototype.slice.call(track.children);

      if (slides.length < 2) {
        if (prev) prev.hidden = true;
        if (next) next.hidden = true;
        return;
      }

      var queued = false;
      function sync() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          var w = track.clientWidth || 1;
          var i = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
          if (counter) counter.textContent = String(i + 1);
          if (prev) prev.disabled = i <= 0;
          if (next) next.disabled = i >= slides.length - 1;
        });
      }

      function go(dir) {
        track.scrollBy({
          left: dir * track.clientWidth,
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      }

      if (prev) prev.addEventListener("click", function () { go(-1); });
      if (next) next.addEventListener("click", function () { go(1); });
      // Element-level scroll, not window scroll. Coalesced through rAF.
      track.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  })();

  /* ---------------------------------------------------------
     5. Lightbox
     --------------------------------------------------------- */
  (function lightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;

    var img = box.querySelector("[data-lb-img]");
    var cap = box.querySelector("[data-lb-cap]");
    var skeleton = box.querySelector("[data-lb-skeleton]");
    var errorEl = box.querySelector("[data-lb-error]");
    var closeBtn = box.querySelector("[data-lb-close]");
    var prevBtn = box.querySelector("[data-lb-prev]");
    var nextBtn = box.querySelector("[data-lb-next]");

    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    if (!triggers.length) return;

    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      var t = triggers[index];
      var thumb = t.querySelector("img");

      img.classList.remove("is-ready");
      img.removeAttribute("src");
      errorEl.hidden = true;
      skeleton.hidden = false;

      img.alt = thumb ? thumb.alt : "";
      cap.textContent = t.dataset.caption || "";

      img.onload = function () {
        skeleton.hidden = true;
        img.classList.add("is-ready");
      };
      img.onerror = function () {
        skeleton.hidden = true;
        errorEl.hidden = false;
      };
      img.src = t.dataset.full;

      var multiple = triggers.length > 1;
      prevBtn.hidden = !multiple;
      nextBtn.hidden = !multiple;
    }

    function open(i, source) {
      lastFocus = source || document.activeElement;
      box.hidden = false;
      document.body.classList.add("is-locked");
      show(i);
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      closeBtn.focus();
    }

    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      var done = function () {
        box.hidden = true;
        img.removeAttribute("src");
      };
      if (reduceMotion.matches) done();
      else setTimeout(done, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i, t); });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });

    // Backdrop click only. Clicks on the image or the controls are theirs.
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowLeft") { show(index - 1); return; }
      if (e.key === "ArrowRight") { show(index + 1); return; }

      // Keep focus inside the dialog while it is open.
      if (e.key === "Tab") {
        var focusables = [closeBtn, prevBtn, nextBtn].filter(function (el) { return !el.hidden; });
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();

  /* ---------------------------------------------------------
     6. In-page anchors: scroll and keep the URL honest, without
        pushing a history entry for every jump.
     --------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("skip-link")) return;
    var id = a.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
})();
