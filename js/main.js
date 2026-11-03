/* =========================================================
   OSMA — landing page motion
   GSAP + ScrollTrigger. Graceful fallback if CDN fails.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;

  /* ---------- osmanthus petal trail (follows cursor) ---------- */
  function initPetalTrail() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var field = document.createElement('div');
    field.className = 'petal-field';
    field.setAttribute('aria-hidden', 'true');
    document.body.appendChild(field);

    var SVG =
      '<svg viewBox="0 0 48 48" aria-hidden="true">' +
        '<g fill="currentColor">' +
          '<circle cx="24" cy="10.6" r="7.2"/>' +
          '<circle cx="36.5" cy="19.7" r="7.2"/>' +
          '<circle cx="31.7" cy="34.4" r="7.2"/>' +
          '<circle cx="16.3" cy="34.4" r="7.2"/>' +
          '<circle cx="11.5" cy="19.7" r="7.2"/>' +
        '</g>' +
        '<circle cx="24" cy="24" r="4.4" fill="#FBF6EC" fill-opacity=".92"/>' +
      '</svg>';

    var colors = ['#F0891B', '#F6A94B', '#E07C10', '#F0891B', '#EF9B33'];
    var last = null;
    var alive = 0;
    var MAX = 52;

    function spawn(x, y) {
      if (alive >= MAX) return;
      var el = document.createElement('span');
      el.className = 'petal-drop';
      var size = 13 + Math.random() * 17;
      el.style.cssText =
        'left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;' +
        'color:' + colors[(Math.random() * colors.length) | 0];
      el.innerHTML = SVG;
      field.appendChild(el);
      alive++;

      var driftX = (Math.random() - 0.5) * 104;
      var driftY = 34 + Math.random() * 86;
      var rot = (Math.random() - 0.5) * 240;
      var scale = 0.85 + Math.random() * 0.55;
      var dur = 1050 + Math.random() * 800;

      var anim = el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 0 },
          { opacity: 1, offset: 0.13 },
          { opacity: 0.95, offset: 0.5 },
          {
            transform: 'translate(-50%,-50%) translate(' + driftX + 'px,' + driftY + 'px) scale(' + scale + ') rotate(' + rot + 'deg)',
            opacity: 0
          }
        ],
        { duration: dur, easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'forwards' }
      );
      anim.onfinish = function () { el.remove(); alive--; };
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
      var dx = e.clientX - last.x;
      var dy = e.clientY - last.y;
      if (dx * dx + dy * dy < 430) return;
      last.x = e.clientX;
      last.y = e.clientY;
      spawn(e.clientX + (Math.random() - 0.5) * 18, e.clientY + (Math.random() - 0.5) * 18);
      if (Math.random() > 0.55) {
        spawn(e.clientX + (Math.random() - 0.5) * 46, e.clientY + (Math.random() - 0.5) * 46);
      }
    }, { passive: true });

    window.addEventListener('pointerleave', function () { last = null; });
  }

  /* ---------- flat mode: static full-page render (?flat) ---------- */
  var isFlat = /(\?|&)flat/.test(location.search);
  if (isFlat) {
    html.classList.add('flat');
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var n = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      el.textContent = dec
        ? n.toFixed(dec).replace('.', ',')
        : Math.round(n).toLocaleString('id-ID');
    });
    return;
  }

  function revealAllStatic() {
    html.classList.add('no-gsap');
    document.querySelectorAll('[data-reveal], [data-split] .ln > span, .hero-title .ln > span').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  if (!window.gsap || !window.ScrollTrigger) {
    revealAllStatic();
    initPetalTrail();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 1 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  var isStatic = /(\?|&)static/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress + nav ---------- */
  var bar = document.querySelector('.scroll-progress i');
  if (bar) {
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });
  }

  var nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -60',
    end: 99999,
    onToggle: function (self) { nav.classList.toggle('scrolled', self.isActive); }
  });

  /* ---------- headline lines ---------- */
  function splitIn(el, delay) {
    var inner = el.querySelectorAll('.ln > span');
    gsap.set(inner, { yPercent: 135, y: 0 });
    return gsap.to(inner, {
      yPercent: 0,
      duration: 1.25,
      delay: delay || 0,
      stagger: 0.085,
      ease: 'expo.out',
      scrollTrigger: el.closest('.hero') || isStatic ? null : { trigger: el, start: 'top 84%', once: true }
    });
  }

  /* ---------- hero intro ---------- */
  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    gsap.set(heroTitle.querySelectorAll('.ln > span'), { yPercent: 135, y: 0 });
    gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-actions', '.hero-stats'], { opacity: 0, y: 26 });
    gsap.set('.halo', { opacity: 0, scale: 0.9 });
    gsap.set('.cup-hero', { opacity: 0, y: 54, scale: 0.96 });
    gsap.set('.ring-badge', { opacity: 0, scale: 0.84, rotate: -24 });
    gsap.set('.hero-seal', { opacity: 0, x: 26 });

    var intro = gsap.timeline({ delay: 0.18, defaults: { ease: 'expo.out' } });
    intro
      .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 1 }, 0)
      .to('.halo', { opacity: 1, scale: 1, duration: 1.6 }, 0.05)
      .to(heroTitle.querySelectorAll('.ln > span'), { yPercent: 0, duration: 1.45, stagger: 0.09 }, 0.12)
      .to('.cup-hero', { opacity: 1, y: 0, scale: 1, duration: 1.7 }, 0.3)
      .to('.ring-badge', { opacity: 1, scale: 1, rotate: 0, duration: 1.5 }, 0.55)
      .to('.hero-seal', { opacity: 1, x: 0, duration: 1.1 }, 0.8)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 1.1 }, 0.5)
      .to('.hero-actions', { opacity: 1, y: 0, duration: 1.1 }, 0.62)
      .to('.hero-stats', { opacity: 1, y: 0, duration: 1.1 }, 0.74);

    /* hero parallax */
    gsap.to('.cup-hero', {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.ring-badge', {
      y: -56, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-seal', {
      y: -32, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-copy', {
      y: 70, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.halo', {
      scale: 1.12, rotation: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- generic reveals ---------- */
  gsap.set('[data-reveal]', { y: 34 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.15,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  /* ---------- section headlines ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.closest('.hero')) return;
    splitIn(el);
  });

  /* ---------- history: line draw + active step ---------- */
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var line = timeline.querySelector('.timeline-line b');
    if (line) {
      gsap.to(line, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 }
      });
    }

    document.querySelectorAll('.tl-step').forEach(function (step) {
      gsap.from(step, {
        opacity: 0, y: 36, duration: 1.1,
        scrollTrigger: { trigger: step, start: 'top 88%', once: true }
      });
      ScrollTrigger.create({
        trigger: step,
        start: 'top 62%',
        end: 'bottom 58%',
        toggleClass: { targets: step, className: 'is-active' }
      });
    });

    gsap.to('.history-visual .frame', {
      y: -30, ease: 'none',
      scrollTrigger: { trigger: '.history-body', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.seal-spin', {
      rotate: 120, ease: 'none',
      scrollTrigger: { trigger: '.history', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- benefits ---------- */
  if (document.querySelector('.benefits')) {
    gsap.to('.benefit-flower', {
      rotate: 70, y: -40, ease: 'none',
      scrollTrigger: { trigger: '.benefits', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.from('.bcard', {
      opacity: 0, y: 46, duration: 1.1, stagger: 0.09,
      scrollTrigger: { trigger: '.benefit-grid', start: 'top 84%', once: true }
    });
  }

  /* ---------- gallery ---------- */
  if (document.querySelector('.gal-grid')) {
    document.querySelectorAll('.gal-item').forEach(function (item, i) {
      gsap.from(item, {
        opacity: 0, y: 46, duration: 1.15, delay: (i % 3) * 0.07,
        scrollTrigger: { trigger: item, start: 'top 88%', once: true }
      });
      var img = item.querySelector('img');
      if (img) {
        gsap.fromTo(img,
          { yPercent: -4, scale: 1.16 },
          {
            yPercent: 4, scale: 1.16, ease: 'none',
            scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
          });
      }
    });
  }

  /* ---------- menu horizontal pin ---------- */
  var track = document.querySelector('.menu-track');
  if (track) {
    var getTravel = function () {
      return Math.max(0, track.scrollWidth - window.innerWidth + 48);
    };
    gsap.to(track, {
      x: function () { return -getTravel(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.menu',
        start: 'top top',
        end: function () { return '+=' + getTravel(); },
        pin: '.menu-pin',
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var b = document.querySelector('.menu-progress b');
          if (b) b.style.transform = 'scaleX(' + self.progress + ')';
        }
      }
    });
  }

  /* ---------- counters ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () {
        el.textContent = dec
          ? obj.v.toFixed(dec).replace('.', ',')
          : Math.round(obj.v).toLocaleString('id-ID');
      }
    });
  });

  /* ---------- static / reduced motion ---------- */
  if (isStatic || reduce) {
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    if (reduce) {
      revealAllStatic();
    }
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  initPetalTrail();
})();
