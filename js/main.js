/* Shared site behavior: nav, scroll reveals, stat count-ups, canvas lifecycle */
(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Nav: scrolled state ---------- */
    var nav = document.querySelector('.site-nav');
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 24);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Nav: mobile toggle ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                links.classList.remove('open');
                toggle.classList.remove('open');
            });
        });
    }

    /* ---------- Nav: active section highlighting ---------- */
    var sections = document.querySelectorAll('section[id]');
    var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navAnchors.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        sections.forEach(function (s) { sectionObserver.observe(s); });
    }

    /* ---------- Scroll reveals (staggered via --reveal-delay) ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window && !reducedMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- Stat count-up: <span data-count="71.2" data-suffix="%"> ---------- */
    var counters = document.querySelectorAll('[data-count]');
    function animateCount(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
        var suffix = el.getAttribute('data-suffix') || '';
        var prefix = el.getAttribute('data-prefix') || '';
        var duration = 1600;
        var start = null;
        function frame(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    if (counters.length) {
        if ('IntersectionObserver' in window && !reducedMotion) {
            var countObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCount(entry.target);
                        countObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.6 });
            counters.forEach(function (el) { countObserver.observe(el); });
        } else {
            counters.forEach(function (el) {
                el.textContent = (el.getAttribute('data-prefix') || '') +
                    el.getAttribute('data-count') +
                    (el.getAttribute('data-suffix') || '');
            });
        }
    }

    /* ---------- Canvas lifecycle: run render loops only while visible ----------
       Usage: SiteFX.register(canvas, drawFn) — drawFn(time_ms) called per frame. */
    window.SiteFX = {
        reducedMotion: reducedMotion,
        register: function (canvas, drawFn) {
            var running = false;
            var rafId = null;
            function loop(t) {
                drawFn(t);
                if (running) rafId = requestAnimationFrame(loop);
            }
            function start() {
                if (running) return;
                running = true;
                rafId = requestAnimationFrame(loop);
            }
            function stop() {
                running = false;
                if (rafId) cancelAnimationFrame(rafId);
            }
            if (reducedMotion) {
                // Render a single static frame for reduced-motion users.
                requestAnimationFrame(function (t) { drawFn(t); });
                return;
            }
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
                }, { threshold: 0.05 }).observe(canvas);
            } else {
                start();
            }
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stop();
                else {
                    var r = canvas.getBoundingClientRect();
                    if (r.bottom > 0 && r.top < window.innerHeight) start();
                }
            });
        },
        fitCanvas: function (canvas, maxDpr) {
            var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 1.75);
            var r = canvas.getBoundingClientRect();
            var w = Math.max(1, Math.round(r.width * dpr));
            var h = Math.max(1, Math.round(r.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            return dpr;
        }
    };

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
