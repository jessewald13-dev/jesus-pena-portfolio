/* ============================================================
   Jesus Pena Jr. - portfolio behaviour
   Vanilla JS, no dependencies, no build step.

   Motion inventory (each one earns its place):
     reveal      - sequences content as it enters view, so the eye
                   lands on the headline before the supporting copy
     count-up    - draws attention to the four numbers that carry
                   the strongest part of the story
     nav state   - feedback: which section you are currently in
     lightbox    - state transition between thumbnail and full view

   Everything here uses IntersectionObserver or element-level
   scroll. There is no window scroll listener anywhere.
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
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.content = "#07182a";  // the masthead is navy in both themes
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
     2. Nav: condensed state, scrollspy, mobile menu
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

    // Mobile menu
    if (toggle && links) {
      var burger = toggle.querySelector("[data-burger-icon]");

      function setMenu(open) {
        links.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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

    // Scrollspy. Sections are watched through a band across the
    // upper third of the viewport so the active link matches what
    // the visitor is actually reading.
    if (links && "IntersectionObserver" in window) {
      var anchors = Array.prototype.slice.call(links.querySelectorAll("a"));
      var targets = anchors
        .map(function (a) { return document.querySelector(a.getAttribute("href")); })
        .filter(Boolean);

      var visible = new Set();

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });

        var activeId = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible.has(targets[i].id)) { activeId = targets[i].id; break; }
        }

        anchors.forEach(function (a) {
          a.classList.toggle("is-active", activeId !== null && a.getAttribute("href") === "#" + activeId);
        });
      }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

      targets.forEach(function (t) { spy.observe(t); });
    }
  })();

  /* ---------------------------------------------------------
     3. Scroll reveal
     --------------------------------------------------------- */
  (function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------
     4. Count-up on the numbers band
     --------------------------------------------------------- */
  (function counters() {
    var nums = document.querySelectorAll("[data-count-to]");
    if (!nums.length) return;

    function format(el, value) {
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var out = value.toFixed(decimals);
      if (el.dataset.commas) out = Number(out).toLocaleString("en-US");
      return (el.dataset.prefix || "") + out + (el.dataset.suffix || "");
    }

    if (reduceMotion.matches || !("IntersectionObserver" in window)) return; // markup already holds the final value

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        var target = parseFloat(el.dataset.countTo);
        var duration = 900;
        var start = null;

        function tick(now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = format(el, target * eased);
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = format(el, target);
        }

        el.textContent = format(el, 0);
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------
     5. Design rail: arrow controls with real disabled states
     --------------------------------------------------------- */
  (function rail() {
    var track = document.getElementById("design-rail");
    var prev = document.querySelector("[data-rail-prev]");
    var next = document.querySelector("[data-rail-next]");
    if (!track || !prev || !next) return;

    function step() {
      var card = track.querySelector(".sheet");
      if (!card) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      return card.getBoundingClientRect().width + gap;
    }

    var queued = false;
    function sync() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
      });
    }

    function scrollBy(dir) {
      track.scrollBy({
        left: dir * step(),
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    }

    prev.addEventListener("click", function () { scrollBy(-1); });
    next.addEventListener("click", function () { scrollBy(1); });
    // Element-level scroll, not window scroll. Coalesced through rAF.
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  })();

  /* ---------------------------------------------------------
     6. Lightbox
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
     7. In-page anchors: scroll and keep the URL honest, without
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
