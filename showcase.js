/* ============================================================
   ГРАДУС — 3D-вітрина меню (карусель «по дузі», як у промо енергетиків)
   Бере товари з каталогу на сторінці. Працює з anime.js, без нього — теж.
   ============================================================ */
(() => {
  'use strict';
  const root = document.getElementById('showcase');
  if (!root) return;
  const hasAnime = typeof anime !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TONES = { 1: '#c76a2e', 2: '#c99a6b', 3: '#b98a5a', 4: '#d6b48c', 5: '#8f5a35', 6: '#7fae5a', 7: '#e0a54d', 8: '#c0505c', 9: '#d98a3a' };
  const items = Array.from(document.querySelectorAll('.product-card'))
    .filter(c => !c.classList.contains('product-card--out'))
    .map(c => {
      const id = c.dataset.id;
      const img = c.querySelector('.product-media--photo img');
      const price = c.querySelector('.pill__price strong');
      return {
        id,
        name: (c.querySelector('.product-name') || {}).textContent || '',
        img: img ? img.getAttribute('src') : '',
        price: price ? price.textContent.replace(/\s+/g, ' ').trim() : '',
        tone: TONES[id] || '#b98a5a'
      };
    })
    .filter(x => x.img);
  if (!items.length) return;
  const N = items.length;

  root.innerHTML = `
    <div class="showcase__glow" aria-hidden="true"></div>
    <div class="showcase__lamp" aria-hidden="true"><i></i></div>
    <div class="showcase__ring" role="listbox" aria-label="Вітрина меню"></div>
    <div class="showcase__pedestal" aria-hidden="true"><i></i></div>
    <div class="showcase__info" aria-live="polite">
      <span class="showcase__num"></span>
      <h3 class="showcase__name"></h3>
      <div class="showcase__row">
        <strong class="showcase__price"></strong>
        <button class="showcase__add" type="button">ДОДАТИ В КОШИК <span aria-hidden="true">+</span></button>
      </div>
    </div>
    <button class="showcase__arrow showcase__arrow--prev" type="button" aria-label="Попередній напій">←</button>
    <button class="showcase__arrow showcase__arrow--next" type="button" aria-label="Наступний напій">→</button>
    <div class="showcase__bar" aria-hidden="true"><span></span></div>`;

  const ring = root.querySelector('.showcase__ring');
  const els = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'showcase__item';
    b.setAttribute('role', 'option');
    b.setAttribute('aria-label', it.name);
    b.innerHTML = `<img src="${it.img}" alt="" draggable="false"><span class="showcase__shine"></span>`;
    b.addEventListener('click', () => { if (dragMoved) return; goTo(nearest(i)); restartAuto(); });
    ring.appendChild(b);
    return b;
  });

  const glow = root.querySelector('.showcase__glow');
  const nameEl = root.querySelector('.showcase__name');
  const numEl = root.querySelector('.showcase__num');
  const priceEl = root.querySelector('.showcase__price');
  const barEl = root.querySelector('.showcase__bar span');
  const info = root.querySelector('.showcase__info');

  const state = { pos: 0 };      // плаваюча позиція каруселі (0..N)
  let target = 0;                 // ціле, до якого крутимо
  let active = -1;

  const mod = (n, m) => ((n % m) + m) % m;
  function nearest(i) {           // найкоротший шлях до елемента i
    const cur = Math.round(state.pos);
    let d = mod(i - cur, N); if (d > N / 2) d -= N;
    return cur + d;
  }

  function layout() {
    const w = root.clientWidth;
    const mobile = w < 640;
    const R = mobile ? w * 0.62 : Math.min(w * 0.42, 520);      // радіус дуги
    const size = mobile ? Math.min(w * 0.46, 200) : 250;        // розмір центрального
    const step = (2 * Math.PI) / N;
    els.forEach((el, i) => {
      let rel = i - state.pos; rel = mod(rel + N / 2, N) - N / 2; // -N/2..N/2
      const a = rel * step;
      const x = Math.sin(a) * R;
      const z = (Math.cos(a) - 1) * R;                           // 0 у центрі, далі — глибше
      const depth = Math.cos(a);                                  // 1 центр .. -1 позаду
      const k = Math.max(0, (depth + 1) / 2);                     // 0..1
      const s = 0.42 + 0.58 * Math.pow(k, 1.6);
      const tilt = -rel * 9;                                      // нахил, як у банок
      const y = (1 - k) * (mobile ? -24 : -40);
      el.style.width = el.style.height = size + 'px';
      el.style.marginLeft = el.style.marginTop = (-size / 2) + 'px';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(a * 57.3 * -0.35).toFixed(1)}deg) rotateZ(${tilt.toFixed(1)}deg) scale(${s.toFixed(3)})`;
      el.style.zIndex = String(Math.round(k * 100));
      el.style.filter = `brightness(${(0.35 + 0.65 * Math.pow(k, 2)).toFixed(2)}) saturate(${(0.5 + 0.5 * k).toFixed(2)})`;
      el.style.opacity = depth < -0.55 ? '0' : '1';
      el.classList.toggle('is-active', Math.abs(rel) < 0.5);
      el.tabIndex = Math.abs(rel) < 0.5 ? 0 : -1;
    });
    const idx = mod(Math.round(state.pos), N);
    if (idx !== active) setActive(idx);
    barEl.style.transform = `scaleX(${((mod(state.pos, N) + 1) / N).toFixed(3)})`;
  }

  function setActive(idx) {
    active = idx;
    const it = items[idx];
    els.forEach((el, i) => el.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
    numEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    nameEl.textContent = it.name;
    priceEl.textContent = it.price;
    root.style.setProperty('--sc-tone', it.tone);
    if (hasAnime && !reduced) {
      anime.remove(info.children);
      anime({ targets: [numEl, nameEl, priceEl.parentNode], opacity: [0, 1], translateY: [14, 0], delay: anime.stagger(60), duration: 520, easing: 'easeOutCubic' });
      anime.remove(glow);
      anime({ targets: glow, opacity: [0.55, 1], scale: [0.92, 1], duration: 700, easing: 'easeOutQuad' });
    }
  }

  function goTo(t) {
    target = t;
    if (!hasAnime || reduced) { state.pos = t; layout(); return; }
    anime.remove(state);
    anime({ targets: state, pos: t, duration: 900, easing: 'easeOutQuart', update: layout });
  }
  const next = () => goTo(target + 1);
  const prev = () => goTo(target - 1);

  root.querySelector('.showcase__arrow--next').addEventListener('click', () => { next(); restartAuto(); });
  root.querySelector('.showcase__arrow--prev').addEventListener('click', () => { prev(); restartAuto(); });
  root.querySelector('.showcase__add').addEventListener('click', () => {
    const btn = document.querySelector(`[data-add="${items[active].id}"]`);
    if (btn) btn.click();
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { next(); restartAuto(); }
    if (e.key === 'ArrowLeft') { prev(); restartAuto(); }
  });

  // Свайп / перетягування
  let dragX = null, dragStartPos = 0, dragMoved = false;
  ring.addEventListener('pointerdown', e => {
    dragX = e.clientX; dragStartPos = state.pos; dragMoved = false;
    if (hasAnime) anime.remove(state);
    stopAuto();
  });
  window.addEventListener('pointermove', e => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    if (Math.abs(dx) > 6) dragMoved = true;
    state.pos = dragStartPos - dx / (root.clientWidth < 640 ? 140 : 220);
    layout();
  });
  window.addEventListener('pointerup', () => {
    if (dragX === null) return;
    dragX = null;
    goTo(Math.round(state.pos));
    setTimeout(() => { dragMoved = false; }, 0);
    restartAuto();
  });

  // Автопрокрутка, коли вітрина на екрані
  let timer = null, visible = false;
  function stopAuto() { clearInterval(timer); timer = null; }
  function restartAuto() {
    stopAuto();
    if (reduced || !visible) return;
    timer = setInterval(next, 3600);
  }
  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', restartAuto);
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; visible ? restartAuto() : stopAuto(); }), { threshold: 0.35 }).observe(root);

  window.addEventListener('resize', layout);
  layout();
})();
