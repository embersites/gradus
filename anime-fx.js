/* ============================================================
   ГРАДУС — анімації на anime.js (v3)
   Підключається після anime.min.js і script.js
   ============================================================ */
(() => {
  'use strict';
  if (typeof anime === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Запуск, коли блок з'являється на екрані (один раз)
  function onView(el, fn, threshold = 0.18) {
    if (!el) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { obs.unobserve(e.target); fn(e.target); } });
    }, { threshold });
    io.observe(el);
  }
  // Після анімації повертаємо CSS-ховери (прибираємо інлайн-трансформ)
  const clean = els => () => els.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });

  /* ---------- 1. Кавові зерна, що літають у hero ---------- */
  const hero = $('.hero');
  if (hero) {
    const layer = document.createElement('div');
    layer.className = 'beans';
    layer.setAttribute('aria-hidden', 'true');
    const spots = [[8, 18], [46, 12], [88, 22], [14, 78], [58, 86], [93, 70], [34, 48], [72, 40]];
    spots.forEach(([x, y], i) => {
      const b = document.createElement('span');
      b.className = 'bean';
      b.style.left = x + '%'; b.style.top = y + '%';
      b.style.setProperty('--s', (0.6 + (i % 3) * 0.25).toFixed(2));
      layer.appendChild(b);
    });
    hero.insertBefore(layer, hero.firstChild.nextSibling);

    $$('.bean', layer).forEach((b, i) => {
      anime({
        targets: b,
        translateY: [anime.random(-10, 10), anime.random(-46, -24)],
        translateX: [0, anime.random(-24, 24)],
        rotate: [anime.random(-40, 40), anime.random(120, 260)],
        opacity: [{ value: 0.85, duration: 900 }, { value: 0.55, duration: 2600 }],
        duration: anime.random(4200, 6800),
        delay: i * 180,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
      });
    });
  }

  /* ---------- 2. Аватарки «800+ чашок» вистрибують по черзі ---------- */
  const avatars = $$('.avatars span');
  if (avatars.length) {
    const start = () => anime({
      targets: avatars,
      scale: [0, 1],
      rotate: [-90, 0],
      delay: anime.stagger(110, { start: 900 }),
      duration: 900,
      easing: 'easeOutElastic(1, .55)'
    });
    if (document.body.classList.contains('is-ready')) start();
    else new MutationObserver((m, obs) => {
      if (document.body.classList.contains('is-ready')) { obs.disconnect(); start(); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- 3. Цифри в «Про нас» підстрибують після підрахунку ---------- */
  onView($('.about__stats'), el => {
    anime({
      targets: $$('.stat strong', el),
      translateY: [26, 0],
      opacity: [0, 1],
      delay: anime.stagger(140),
      duration: 1100,
      easing: 'easeOutBack'
    });
    anime({
      targets: $$('.stat span', el),
      opacity: [0, 1],
      translateX: [-14, 0],
      delay: anime.stagger(140, { start: 300 }),
      duration: 700,
      easing: 'easeOutQuad'
    });
  }, 0.4);

  /* ---------- 4. Картки меню з'являються «хвилею» ---------- */
  const cards = $$('.product-card');
  if (cards.length) {
    cards.forEach(c => { c.style.opacity = '0'; });
    onView($('#menuGrid'), () => {
      anime({
        targets: cards,
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.92, 1],
        rotate: (el, i) => [i % 2 ? 3 : -3, 0],
        delay: anime.stagger(90, { grid: [3, Math.ceil(cards.length / 3)], from: 'first' }),
        duration: 1000,
        easing: 'easeOutExpo',
        complete: clean(cards)
      });
      // фото всередині карток трохи «наїжджають»
      anime({
        targets: $$('.product-media--photo img'),
        scale: [1.25, 1],
        delay: anime.stagger(90),
        duration: 1400,
        easing: 'easeOutCubic',
        complete: clean($$('.product-media--photo img'))
      });
    }, 0.08);
  }

  /* ---------- 5. Знижки злегка гойдаються ---------- */
  const sales = $$('.sale');
  if (sales.length) {
    anime({
      targets: sales,
      rotate: [-7, 7],
      scale: [1, 1.08],
      duration: 1100,
      delay: anime.stagger(160),
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });
  }

  /* ---------- 6. Додали в кошик: ціна «пульсує», лічильник стрибає ---------- */
  const grid = $('#menuGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const price = $('.pill__price', btn);
      anime.remove(price);
      anime({ targets: price, scale: [1, 1.22, 1], duration: 650, easing: 'easeOutElastic(1, .5)' });
      const card = btn.closest('.product-card');
      const img = card && $('.product-media--photo img', card);
      if (img) {
        anime.remove(img);
        anime({ targets: img, scale: [1, 1.08, 1], rotate: [0, -2, 0], duration: 700, easing: 'easeOutQuad', complete: clean([img]) });
      }
      const count = $('#cartCount');
      anime.remove(count);
      anime({ targets: count, scale: [1, 1.7, 1], rotate: [0, -20, 0], duration: 800, easing: 'easeOutElastic(1, .4)', complete: clean([count]) });
    });
  }

  /* ---------- 7. Кроки «Як це працює»: іконки обертаються і падають ---------- */
  onView($('.steps'), el => {
    const icons = $$('.step__icon', el);
    anime({
      targets: icons,
      translateY: [-60, 0],
      rotate: [-180, -7],
      scale: [0.4, 1],
      delay: anime.stagger(200, { start: 250 }),
      duration: 1300,
      easing: 'easeOutElastic(1, .6)',
      complete: clean(icons)
    });
    $$('.step__num', el).forEach((num, i) => {
      const target = parseInt(num.textContent, 10) || i + 1;
      const o = { v: 0 };
      anime({
        targets: o, v: target, round: 1, delay: 250 + i * 200, duration: 900, easing: 'easeOutQuad',
        update: () => { num.textContent = String(o.v).padStart(2, '0'); }
      });
    });
  }, 0.25);

  /* ---------- 8. Пін на карті падає з відскоком ---------- */
  onView($('.map-card'), el => {
    const pin = $('.map-pin', el);
    if (!pin) return;
    anime({
      targets: pin,
      translateY: [-260, 0],
      rotate: ['-45deg', '-45deg'],
      duration: 1400,
      easing: 'easeOutBounce'
    });
    anime({
      targets: $('.map-card__label', el),
      opacity: [0, 1],
      translateX: [-30, 0],
      delay: 900,
      duration: 700,
      easing: 'easeOutBack'
    });
  }, 0.35);

  /* ---------- 9. Аватарки у відгуках «дихають» ---------- */
  anime({
    targets: '.slide__avatar',
    scale: [1, 1.06],
    rotate: [-6, 4],
    duration: 2200,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine'
  });

  /* ---------- 10. Кнопки: «магніт» за курсором ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    $$('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        anime.remove(btn);
        anime({ targets: btn, translateX: x, translateY: y, duration: 300, easing: 'easeOutQuad' });
      });
      btn.addEventListener('mouseleave', () => {
        anime.remove(btn);
        anime({ targets: btn, translateX: 0, translateY: 0, duration: 700, easing: 'easeOutElastic(1, .4)', complete: clean([btn]) });
      });
    });
  }

  /* ---------- 11. Підписи розділів друкуються по літері ---------- */
  $$('.section-num').forEach(lbl => {
    if (lbl.closest('.drawer, .modal')) return;
    const text = lbl.textContent;
    lbl.textContent = '';
    const chars = [...text].map(ch => {
      const s = document.createElement('span');
      s.textContent = ch; s.style.display = 'inline-block'; s.style.opacity = '0';
      if (ch === ' ') s.style.width = '.35em';
      lbl.appendChild(s); return s;
    });
    onView(lbl, () => anime({
      targets: chars, opacity: [0, 1], translateY: [12, 0], rotate: [12, 0],
      delay: anime.stagger(28), duration: 500, easing: 'easeOutQuad'
    }), 0.6);
  });

  /* ---------- 12. Контакти виїжджають рядками ---------- */
  onView($('.contacts__list'), el => {
    const rows = $$('.contact-row', el);
    anime({
      targets: rows, opacity: [0, 1], translateX: [-50, 0],
      delay: anime.stagger(130, { start: 200 }), duration: 900, easing: 'easeOutExpo', complete: clean(rows)
    });
  }, 0.3);

  /* ---------- 13. Відгуки: текст з'являється при кожній зміні слайда ---------- */
  const track = $('#sliderTrack');
  if (track) {
    let last = -1;
    const animateSlide = () => {
      const m = /-(\d+)%/.exec(track.style.transform || '');
      const idx = m ? Math.round(+m[1] / 100) : 0;
      if (idx === last) return; last = idx;
      const slide = track.children[idx]; if (!slide) return;
      anime.remove($$('blockquote, .slide__stars, figcaption > span', slide));
      anime({ targets: $('blockquote', slide), opacity: [0, 1], translateY: [24, 0], duration: 800, delay: 200, easing: 'easeOutCubic' });
      anime({ targets: $('.slide__stars', slide), opacity: [0, 1], letterSpacing: ['.9em', '.25em'], duration: 900, delay: 100, easing: 'easeOutQuad' });
      anime({ targets: $('figcaption > span', slide), opacity: [0, 1], translateX: [-20, 0], duration: 700, delay: 450, easing: 'easeOutQuad' });
    };
    new MutationObserver(animateSlide).observe(track, { attributes: true, attributeFilter: ['style'] });
    onView($('#slider'), animateSlide, 0.3);
  }

  /* ---------- 14. «КАТАЛОГ ГРАДУС» пливе під час прокрутки ---------- */
  const mark = $('.watermark');
  if (mark) {
    let ticking = false;
    const drift = () => {
      const r = mark.getBoundingClientRect();
      const k = (r.top - innerHeight / 2) / innerHeight;
      anime.set(mark, { translateX: (k * -120).toFixed(1) + 'px' });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* ---------- 15. Хвиля по клику на кнопки ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn, .pill, .cart-btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    const size = Math.max(r.width, r.height) * 2.2;
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - r.left - size / 2) + 'px';
    dot.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(dot);
    anime({ targets: dot, scale: [0, 1], opacity: [0.35, 0], duration: 750, easing: 'easeOutQuad', complete: () => dot.remove() });
  });

  /* ---------- 16. Логотип: літери «хвилею» при наведенні ---------- */
  $$('.logo__word').forEach(word => {
    const sup = $('sup', word);
    const letters = [...word.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    word.innerHTML = '';
    const spans = [...letters].map(ch => { const s = document.createElement('span'); s.textContent = ch; s.style.display = 'inline-block'; word.appendChild(s); return s; });
    if (sup) word.appendChild(sup);
    const logo = word.closest('.logo');
    logo.addEventListener('mouseenter', () => {
      anime.remove(spans);
      anime({ targets: spans, translateY: [0, -8, 0], delay: anime.stagger(45), duration: 600, easing: 'easeInOutSine' });
      if (sup) anime({ targets: sup, rotate: [0, 360], duration: 800, easing: 'easeOutBack' });
    });
  });

  /* ---------- 17. Наліпки в hero легенько «дихають» ---------- */
  $$('.float-card strong').forEach((el, i) => {
    anime({
      targets: el, scale: [1, i % 2 ? 1.08 : 1.12], duration: 1600 + i * 300,
      direction: 'alternate', loop: true, easing: 'easeInOutSine', delay: i * 250
    });
  });

  /* ---------- 18. Прогрес прокрутки зверху ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const prog = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    anime.set(bar, { scaleX: max > 0 ? scrollY / max : 0 });
  };
  addEventListener('scroll', prog, { passive: true }); prog();

  /* ---------- 19. Фото у відгуках повільно зсувається під час прокрутки ---------- */
  const rev = $('.reviews');
  if (rev) {
    let tick = false;
    const shift = () => {
      const r = rev.getBoundingClientRect();
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      rev.style.setProperty('--rv-shift', (k * -40).toFixed(1) + 'px');
      tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(shift); } }, { passive: true });
    shift();
  }
})();
