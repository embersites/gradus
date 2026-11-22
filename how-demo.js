/* ============================================================
   ГРАДУС — «Як це працює»: кроки перемикають екрани телефона
   ============================================================ */
(() => {
  'use strict';
  const demo = document.querySelector('.how__demo');
  if (!demo) return;
  const steps = Array.from(demo.querySelectorAll('.step[data-step]'));
  const screens = Array.from(demo.querySelectorAll('.ph-scr'));
  const A = typeof anime !== 'undefined' ? anime : null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUR = 4800;
  const $ = s => demo.querySelector(s);
  let cur = 0, timer = null, visible = false, hover = false, tl = null;

  function play(i) {
    if (tl) { tl.pause(); tl = null; }
    if (!A || reduced) { finalState(i); return; }
    if (i === 0) {
      const n = $('.ph-cart__n'); n.textContent = '0';
      const target = $('.ph-item--target'); const finger = $('.ph-finger'); const toast = $('.ph-toast');
      A.set(finger, { opacity: 0, scale: 1, translateY: 40 }); A.set(toast, { opacity: 0, translateY: 20 }); A.set(target, { scale: 1 });
      tl = A.timeline({ easing: 'easeOutQuad' })
        .add({ targets: demo.querySelectorAll('.ph-menu, .ph-scr--menu .ph-item'), opacity: [0, 1], translateY: [16, 0], delay: A.stagger(120), duration: 450 })
        .add({ targets: finger, opacity: [0, 1], translateY: [40, 0], duration: 500 }, '+=150')
        .add({ targets: finger, scale: [1, 0.8, 1], duration: 300 })
        .add({ targets: target, scale: [1, 0.97, 1], duration: 300, begin: () => { n.textContent = '1'; } }, '-=300')
        .add({ targets: $('.ph-cart__n'), scale: [1, 1.6, 1], duration: 500, easing: 'easeOutElastic(1,.5)' }, '-=200')
        .add({ targets: toast, opacity: [0, 1], translateY: [20, 0], duration: 400 }, '-=300')
        .add({ targets: finger, opacity: 0, duration: 400 }, '+=300');
    } else if (i === 1) {
      const fill = $('.ph-cup__fill'), bar = $('.ph-progress span'), t = $('.ph-timer__n');
      const o = { s: 300 };
      A.set(fill, { height: '0%' }); A.set(bar, { width: '8%' });
      tl = A.timeline({ easing: 'easeInOutSine' })
        .add({ targets: fill, height: ['0%', '82%'], duration: 3200 })
        .add({ targets: bar, width: ['8%', '72%'], duration: 3200 }, 0)
        .add({ targets: o, s: [300, 120], round: 1, duration: 3200, easing: 'linear',
               update: () => { t.textContent = Math.floor(o.s / 60) + ':' + String(o.s % 60).padStart(2, '0'); } }, 0)
        .add({ targets: demo.querySelectorAll('.ph-steam'), opacity: [0, .6, 0], translateY: [0, -16], delay: A.stagger(400), duration: 1400, loop: 2 }, 300);
    } else {
      const note = $('.ph-note');
      A.set(note, { opacity: 0, translateY: -40 });
      A.set(demo.querySelector('.ph-check circle'), { strokeDashoffset: 151 });
      A.set(demo.querySelector('.ph-check path'), { strokeDashoffset: 36 });
      tl = A.timeline({ easing: 'easeOutBack' })
        .add({ targets: note, opacity: [0, 1], translateY: [-40, 0], duration: 700 }, 500)
        .add({ targets: demo.querySelector('.ph-check circle'), strokeDashoffset: [151, 0], duration: 700, easing: 'easeInOutSine' }, '+=100')
        .add({ targets: demo.querySelector('.ph-check path'), strokeDashoffset: [36, 0], duration: 400, easing: 'easeOutQuad' });
    }
  }
  function finalState(i) {
    if (i === 0) { $('.ph-cart__n').textContent = '1'; $('.ph-toast').style.opacity = 1; $('.ph-toast').style.transform = 'none'; }
    if (i === 1) { $('.ph-cup__fill').style.height = '82%'; $('.ph-progress span').style.width = '72%'; $('.ph-timer__n').textContent = '2:00'; }
    if (i === 2) { $('.ph-note').style.opacity = 1; demo.querySelector('.ph-check circle').style.strokeDashoffset = 0; demo.querySelector('.ph-check path').style.strokeDashoffset = 0; }
  }

  function show(i) {
    cur = i;
    steps.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      s.setAttribute('aria-selected', k === i ? 'true' : 'false');
      const bar = s.querySelector('.step__bar'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    screens.forEach((sc, k) => sc.classList.toggle('is-on', k === i));
    play(i);
  }
  function schedule() {
    clearTimeout(timer);
    if (!visible || hover || reduced) return;
    timer = setTimeout(() => { show((cur + 1) % steps.length); schedule(); }, DUR);
  }
  demo.style.setProperty('--dur', DUR + 'ms');
  steps.forEach((s, k) => {
    s.addEventListener('click', () => { show(k); schedule(); });
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(k); schedule(); } });
  });
  demo.addEventListener('mouseenter', () => { hover = true; demo.classList.add('is-paused'); clearTimeout(timer); });
  demo.addEventListener('mouseleave', () => { hover = false; demo.classList.remove('is-paused'); show(cur); schedule(); });
  new IntersectionObserver(es => es.forEach(e => {
    const was = visible; visible = e.isIntersecting;
    if (visible && !was) { show(cur); schedule(); }
    if (!visible) clearTimeout(timer);
  }), { threshold: 0.3 }).observe(demo);
  show(0);
})();
