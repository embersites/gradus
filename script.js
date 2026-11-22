/* ============================================================
   ГРАДУС — интерактив и моушн
   Чистый JS, без зависимостей. Работает при открытии файла напрямую.
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ДАННЫЕ КАТАЛОГА КОФЕЙНИ ---------- */
  const menuItems = [
    { id: 1, name: 'Еспресо «Градус»', oldPrice: 75, price: 60, icon: '☕' },
    { id: 2, name: 'Капучино класичне', oldPrice: 105, price: 85, icon: '☕' },
    { id: 3, name: 'Раф «Градус» з ваніллю', oldPrice: 140, price: 115, icon: '☕' },
    { id: 4, name: 'Флет вайт на подвійному шоті', price: 95, icon: '☕' },
    { id: 5, name: 'Пуровер V60, Кенія АА', price: 120, icon: '☕' },
    { id: 6, name: 'Матча лате на вівсяному молоці', price: 110, icon: '🍵' },
    { id: 7, name: 'Круасан з мигдалем', price: 80, icon: '🥐' },
    { id: 8, name: 'Чізкейк «Обсмажка»', price: 125, icon: '🍰' },
    { id: 9, name: 'Хот-тоді з медом і корицею', price: 100, icon: '☕' },
    { id: 10, name: 'Улун з жасмином', price: 90, available: false, icon: '🍵' }
  ];

  const reviews = [
    { initials: 'АК', name: 'Аня К.', stars: '★★★★★', text: 'Зайшла випадково, пішла з новим улюбленим місцем. Раф «Градус» — це щось нереальне. І хлопці дуже милі!' },
    { initials: 'МП', name: 'Максим П.', stars: '★★★★★', text: 'Щодня беру пуровер на роботу. Завжди свіжа обсмажка і чесна розмова про каву. Рекомендую.' },
    { initials: 'ДС', name: 'Даша С.', stars: '★★★★★', text: 'Атмосфера обіймає з першого ковтка. Круасан з мигдалем + капучино = ідеальний ранок.' },
    { initials: 'ІВ', name: 'Ілля В.', stars: '★★★★★', text: 'Замовив заздалегідь, забрав без черги. Усе гаряче, акуратно запаковано. Сервіс на висоті.' }
  ];

  const cart = new Map();

  /* ---------- УТИЛИТЫ ---------- */
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function syncScrollLock() {
    const locked = $('#drawer').classList.contains('is-open') ||
      $('#modal').classList.contains('is-open') ||
      $('#nav').classList.contains('is-open');
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  /* ---------- РАЗБИЕНИЕ ЗАГОЛОВКОВ НА СЛОВА ---------- */
  function splitText(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    }
    let index = 0;
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach((part, k) => {
        if (/^\s+$/.test(part)) {
          // пробіл уже всередині слова; тут лише місце для переносу рядка
          frag.appendChild(document.createElement('wbr'));
          if (k === 0) frag.appendChild(document.createTextNode(' '));
        } else if (part) {
          const wrap = document.createElement('span');
          wrap.className = 'word-wrap';
          const word = document.createElement('span');
          word.className = 'word';
          // пробіл після слова кладемо всередину, щоб виділення тексту не мало «зубців» між словами
          word.textContent = part + (k < parts.length - 1 ? ' ' : '');
          word.style.setProperty('--i', index++);
          wrap.appendChild(word);
          frag.appendChild(wrap);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  $$('[data-split]').forEach(splitText);

  /* ---------- ВСТУПИТЕЛЬНАЯ ЗАСТАВКА ---------- */
  const intro = $('#intro');
  let introFinished = false;
  let introSafety;

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    clearTimeout(introSafety);
    $('#introBar').style.width = '100%';
    $('#introCount').textContent = '100%';
    intro.classList.add('is-done');
    document.body.classList.remove('intro-active');
    document.body.classList.add('is-ready');
    setTimeout(() => intro.remove(), 1000);
  }

  if (reduced) {
    intro.remove();
    document.body.classList.remove('intro-active');
    document.body.classList.add('is-ready');
    introFinished = true;
  } else {
    const duration = 2400;
    const start = performance.now();
    const bar = $('#introBar');
    const count = $('#introCount');
    function tick(now) {
      if (introFinished) return;
      const p = Math.min((now - start) / duration, 1);
      // лёгкое ускорение в начале и плавная концовка
      const eased = 1 - Math.pow(1 - p, 2);
      bar.style.width = (eased * 100).toFixed(1) + '%';
      count.textContent = Math.round(eased * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
      else finishIntro();
    }
    requestAnimationFrame(tick);
    // Страховка: если вкладка открыта в фоне и rAF заторможен, заставка всё равно завершится
    introSafety = setTimeout(finishIntro, duration + 900);
    $('#introSkip').addEventListener('click', finishIntro);
  }

  /* ---------- КАТАЛОГ: КНОПКИ ТОВАРОВ ---------- */
  const grid = $('#menuGrid');

  function floatPlus(x, y) {
    if (reduced) return;
    const el = document.createElement('span');
    el.className = 'float-plus';
    el.textContent = '+1';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  grid.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const id = Number(addBtn.dataset.add);
      const item = menuItems.find(i => i.id === id);
      if (!item) return;
      cart.set(id, { item, qty: (cart.get(id)?.qty || 0) + 1 });
      const label = addBtn.querySelector('.pill__label');
      addBtn.classList.add('is-added');
      label.textContent = 'ДОДАНО ✓';
      floatPlus(e.clientX, e.clientY);
      renderCart();
      const badge = $('#cartCount');
      badge.classList.remove('pop');
      void badge.offsetWidth;
      badge.classList.add('pop');
      showToast(`Додали: ${item.name}`);
      clearTimeout(addBtn.timer);
      addBtn.timer = setTimeout(() => {
        addBtn.classList.remove('is-added');
        label.textContent = 'ДОДАТИ В КОШИК';
      }, 1600);
      return;
    }

    const notifyBtn = e.target.closest('[data-notify]');
    if (notifyBtn) {
      const item = menuItems.find(i => i.id === Number(notifyBtn.dataset.notify));
      notifyBtn.classList.add('is-notified');
      notifyBtn.querySelector('.pill__label').textContent = 'ДЯКУЄМО ✓';
      showToast(`Повідомимо, коли «${item ? item.name : 'цей напій'}» знову буде в наявності`);
    }
  });

  /* ---------- КОРЗИНА ---------- */
  function renderCart() {
    const items = Array.from(cart.values());
    const count = items.reduce((sum, entry) => sum + entry.qty, 0);
    const total = items.reduce((sum, entry) => sum + entry.qty * entry.item.price, 0);

    $('#cartCount').textContent = count;
    $('#cartTotal').textContent = total + ' грн';
    $('#checkoutBtn').disabled = count === 0;

    const body = $('#cartItems');
    if (!items.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty__icon" aria-hidden="true">☕</span>
          <strong>Поки порожньо</strong>
          <p>Зазирніть у меню й оберіть щось смачне.</p>
          <a class="btn btn--outline" href="#menu" data-scroll id="emptyMenuBtn">ДО МЕНЮ →</a>
        </div>`;
      return;
    }

    body.innerHTML = items.map(({ item, qty }) => `
      <div class="cart-item">
        <span class="cart-item__icon" aria-hidden="true">${item.icon}</span>
        <div>
          <h4>${item.name}</h4>
          <small>${item.price} грн / шт.</small>
          <div class="qty">
            <button type="button" data-qty="${item.id}" data-delta="-1" aria-label="Зменшити кількість">−</button>
            <span>${qty}</span>
            <button type="button" data-qty="${item.id}" data-delta="1" aria-label="Збільшити кількість">+</button>
          </div>
        </div>
        <div>
          <span class="cart-item__price">${item.price * qty} грн</span>
          <button class="cart-item__remove" type="button" data-remove="${item.id}">прибрати</button>
        </div>
      </div>`).join('');
  }

  $('#cartItems').addEventListener('click', e => {
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      const id = Number(qtyBtn.dataset.qty);
      const delta = Number(qtyBtn.dataset.delta);
      const entry = cart.get(id);
      if (!entry) return;
      entry.qty += delta;
      if (entry.qty <= 0) cart.delete(id);
      renderCart();
      return;
    }
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      cart.delete(Number(removeBtn.dataset.remove));
      renderCart();
      showToast('Прибрали із замовлення');
    }
  });

  renderCart();

  /* ---------- КОРЗИНА: ОТКРЫТИЕ / ЗАКРЫТИЕ ---------- */
  const drawer = $('#drawer');
  const overlay = $('#drawerOverlay');

  function openDrawer() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    syncScrollLock();
    setTimeout(() => $('#drawerClose').focus(), 250);
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    syncScrollLock();
  }
  $('#cartBtn').addEventListener('click', openDrawer);
  $('#footerCart').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  function orderAction() {
    if (cart.size === 0) {
      document.getElementById('menu').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      showToast('Спершу оберіть щось у меню ✦');
    } else {
      openDrawer();
    }
  }
  $('#heroOrder').addEventListener('click', orderAction);
  $('#menuOrder').addEventListener('click', orderAction);

  /* ---------- ОФОРМЛЕНИЕ ЗАКАЗА ---------- */
  const modal = $('#modal');
  const checkoutView = $('#checkoutView');
  const successView = $('#successView');

  function openModal() {
    checkoutView.hidden = false;
    successView.hidden = true;
    $('#checkoutForm').reset();
    $('#formError').textContent = '';
    closeDrawer();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    syncScrollLock();
    setTimeout(() => $('input[name="name"]', $('#checkoutForm')).focus(), 300);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    syncScrollLock();
    $('#cartBtn').focus();
  }

  $('#checkoutBtn').addEventListener('click', openModal);
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));

  $('#checkoutForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const error = $('#formError');

    if (name.length < 2) {
      error.textContent = 'Вкажіть ваше ім’я (щонайменше 2 символи).';
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      error.textContent = 'Перевірте номер телефону — потрібно щонайменше 10 цифр.';
      return;
    }
    error.textContent = '';
    const orderNumber = 'ГР-' + Math.floor(1000 + Math.random() * 9000);
    const time = data.get('time');
    $('#successText').textContent = `${name}, замовлення №${orderNumber} прийнято. Зберемо його: ${String(time).toLowerCase()}. Напишемо вам, коли все буде готово!`;
    cart.clear();
    renderCart();
    checkoutView.hidden = true;
    successView.hidden = false;
    $('.success .btn')?.focus();
  });

  /* ---------- ОТЗЫВЫ / СЛАЙДЕР ---------- */
  const sliderTrack = $('#sliderTrack');
  const sliderDots = $('#sliderDots');
  let slideIndex = 0;
  let autoplayTimer;

  sliderTrack.innerHTML = reviews.map(r => `
    <figure class="slide">
      <div class="slide__avatar" aria-hidden="true">${r.initials}</div>
      <figcaption>
        <div class="slide__stars" aria-label="5 зірок">${r.stars}</div>
        <blockquote>«${r.text}»</blockquote>
        <span>${r.name} — гість ГРАДУСА</span>
      </figcaption>
    </figure>`).join('');

  sliderDots.innerHTML = reviews.map((_, i) =>
    `<button type="button" data-slide="${i}" class="${i === 0 ? 'is-active' : ''}" aria-label="Відгук ${i + 1}" aria-current="${i === 0}"></button>`
  ).join('');

  function goToSlide(i) {
    slideIndex = (i + reviews.length) % reviews.length;
    sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
    $$('[data-slide]', sliderDots).forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === slideIndex);
      dot.setAttribute('aria-current', String(idx === slideIndex));
    });
  }
  function startAutoplay() {
    if (reduced) return;
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => goToSlide(slideIndex + 1), 5500);
  }
  function stopAutoplay() { clearInterval(autoplayTimer); }

  sliderDots.addEventListener('click', e => {
    const dot = e.target.closest('[data-slide]');
    if (!dot) return;
    goToSlide(Number(dot.dataset.slide));
    startAutoplay();
  });
  $('#slidePrev').addEventListener('click', () => { goToSlide(slideIndex - 1); startAutoplay(); });
  $('#slideNext').addEventListener('click', () => { goToSlide(slideIndex + 1); startAutoplay(); });
  const slider = $('#slider');
  slider.tabIndex = 0;
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { goToSlide(slideIndex - 1); startAutoplay(); }
    if (e.key === 'ArrowRight') { goToSlide(slideIndex + 1); startAutoplay(); }
  });
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  slider.addEventListener('focusin', stopAutoplay);
  slider.addEventListener('focusout', startAutoplay);
  startAutoplay();

  /* ---------- ПОЯВЛЕНИЕ БЛОКОВ И СЧЁТЧИКИ ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealObserver.observe(el));

    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const duration = 1300;
        const start = performance.now();
        function step(now) {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => countObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
    $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------- ПАРАЛЛАКС ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (!reduced && parallaxEls.length) {
    let ticking = false;
    function updateParallax() {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const delta = (center - vh / 2) / vh;
        const factor = Number(el.dataset.parallax) * 100;
        const shift = Math.max(-70, Math.min(70, -delta * factor));
        el.style.setProperty('--py', shift.toFixed(1) + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }

  /* ---------- НАВИГАЦИЯ И ПЛАВНЫЙ СКРОЛЛ ---------- */
  const header = $('#header');
  const nav = $('#nav');
  const burger = $('#burger');

  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    syncScrollLock();
  });

  function closeNav() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Відкрити меню');
    syncScrollLock();
  }

  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) closeNav();
  });

  $$('[data-scroll]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // Плавный скролл для ссылки в пустой корзине (создаётся динамически)
  document.addEventListener('click', e => {
    const link = e.target.closest('#emptyMenuBtn');
    if (!link) return;
    e.preventDefault();
    closeDrawer();
    $('#menu').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    // шапка завжди на місці — не ховається під час прокрутки
    lastY = y;
  }, { passive: true });

  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modal.classList.contains('is-open')) closeModal();
      else if (drawer.classList.contains('is-open')) closeDrawer();
      else if (nav.classList.contains('is-open')) closeNav();
    }
  });

  // Простая ловушка фокуса для модального окна
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = $$('button:not([hidden]), input, select', $('.modal__panel')).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- РАЗНЫЕ КНОПКИ И ФОРМЫ ---------- */
  $$('[data-toast]').forEach(btn => btn.addEventListener('click', () => showToast(btn.dataset.toast)));

  $('#subscribeForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#subscribeEmail');
    const msg = $('#subscribeMsg');
    const value = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    msg.classList.toggle('is-error', !valid);
    msg.textContent = valid ? 'Готово! Ви в списку — розповімо першими ✦' : 'Перевірте, будь ласка, адресу пошти.';
    if (valid) input.value = '';
  });

  /* ---------- КАСТОМНЫЙ КУРСОР ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !reduced) {
    document.body.classList.add('has-custom-cursor');
    const cursor = $('#cursor');
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursor.style.opacity = '1';
    }, { passive: true });

    function ringLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(ringLoop);
    }
    ringLoop();

    document.addEventListener('mouseover', e => {
      cursor.classList.toggle('is-active', !!e.target.closest('a, button, input, select, .product-card'));
    });
    document.addEventListener('mouseout', e => {
      if (!e.relatedTarget) cursor.style.opacity = '0';
    });
  }

})();
