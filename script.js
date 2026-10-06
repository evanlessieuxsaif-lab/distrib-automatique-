/* =========================================================
   FRIANDEASY – Scripts (vanilla JS, aucune dépendance)
   Sommaire :
   0. Configuration (emplacements, formulaires)
   1. Navigation (sticky, burger)   2. Mode sombre
   3. Animations au scroll           4. Filtres produits
   5. Emplacements + carte Leaflet   6. FAQ accordéon
   7. Formulaires                    8. Cookies   9. Retour en haut
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 0. CONFIGURATION ---------- */

  /**
   * EMPLACEMENTS [À COMPLÉTER] : remplacer par vos vrais lieux.
   * status : "actif" ou "bientot"
   * pay    : liste parmi "CB", "Sans contact", "Espèces"
   * lat/lng : coordonnées GPS (clic droit sur openstreetmap.org > « Afficher l'adresse »)
   */
  const LOCATIONS = [
    { name: 'Résidence étudiante [À COMPLÉTER]', type: 'Résidence étudiante', address: 'Lyon 7e – adresse à compléter', lat: 45.7485, lng: 4.8420, status: 'actif', pay: ['CB', 'Sans contact', 'Espèces'] },
    { name: "Salle d'escalade [À COMPLÉTER]", type: 'Salle d’escalade', address: 'Lyon 9e – adresse à compléter', lat: 45.7740, lng: 4.8060, status: 'actif', pay: ['CB', 'Sans contact'] },
    { name: 'Coworking [À COMPLÉTER]', type: 'Coworking', address: 'Lyon 3e (Part-Dieu) – adresse à compléter', lat: 45.7605, lng: 4.8590, status: 'bientot', pay: ['CB', 'Sans contact'] },
    { name: 'Salle de sport [À COMPLÉTER]', type: 'Salle de sport', address: 'Villeurbanne – adresse à compléter', lat: 45.7710, lng: 4.8900, status: 'bientot', pay: ['CB', 'Sans contact'] },
    { name: 'Entreprise [À COMPLÉTER]', type: 'Entreprise', address: 'Lyon 7e (Gerland) – adresse à compléter', lat: 45.7290, lng: 4.8330, status: 'bientot', pay: ['CB', 'Sans contact'] }
  ];

  /**
   * FORMULAIRES : branchement Formspree (ou similaire).
   * 1. Créer 2 formulaires sur https://formspree.io
   * 2. Coller les URL ci-dessous, ex : 'https://formspree.io/f/abcdwxyz'
   * Tant que c'est vide, l'envoi est simulé (message de succès sans envoi réel).
   */
  const FORM_ENDPOINTS = {
    contact: '', // [À COMPLÉTER] ex : 'https://formspree.io/f/xxxxxxx'
    partner: ''  // [À COMPLÉTER] ex : 'https://formspree.io/f/yyyyyyy'
  };

  const LYON = [45.757, 4.845];
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stockage local protégé (navigation privée, stockage bloqué…)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  /* ---------- BANDEAU CHANTIER (à retirer au lancement) ---------- */
  const siteBanner = $('.site-banner');
  if (siteBanner) {
    // Le header sticky et le menu mobile se calent sous le bandeau via --banner-h
    const syncBanner = () => document.documentElement.style.setProperty('--banner-h', siteBanner.offsetHeight + 'px');
    if ('ResizeObserver' in window) new ResizeObserver(syncBanner).observe(siteBanner);
    window.addEventListener('resize', syncBanner);
    syncBanner();
    $('.site-banner__close', siteBanner).addEventListener('click', () => {
      siteBanner.hidden = true;
      try { sessionStorage.setItem('fz-banner', 'closed'); } catch (e) { /* ignoré */ }
      syncBanner();
    });
  }

  /* ---------- 1. NAVIGATION ---------- */
  const header = $('.header');
  const burger = $('.nav__burger');
  const menu = $('#nav-menu');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  // Fermer au clic sur un lien, avec Échap, ou au passage en desktop
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

  /* ---------- 2. MODE SOMBRE ---------- */
  const themeBtn = $('.theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : systemDark.matches;
  };
  function syncThemeBtn() {
    const dark = isDark();
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
  }
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('fz-theme', next);
    syncThemeBtn();
  });
  systemDark.addEventListener('change', syncThemeBtn);
  syncThemeBtn();

  /* ---------- 3. ANIMATIONS AU SCROLL ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // Petit décalage en cascade pour les éléments d'une même grille
    reveals.forEach(el => {
      const siblings = $$(':scope > .reveal', el.parentElement);
      const i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = (i * 90) + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // Ombre du header + bouton retour en haut (un seul écouteur, throttlé)
  const toTop = $('.to-top');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    toTop.classList.toggle('is-visible', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- 4. FILTRES PRODUITS ---------- */
  const chips = $$('.chip[data-filter]');
  const products = $$('.product');
  const empty = $('.products__empty');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    let shown = 0;
    products.forEach(p => {
      const match = f === 'all' || p.dataset.cat.split(' ').includes(f);
      p.classList.toggle('is-hidden', !match);
      p.classList.remove('is-in');
      if (match) { void p.offsetWidth; p.classList.add('is-in'); shown++; }
    });
    empty.hidden = shown > 0;
  }));

  /* ---------- 5. EMPLACEMENTS + CARTE ---------- */
  const list = $('#locations-list');
  const markers = [];
  let map = null;

  // Liste (fonctionne même sans la carte)
  LOCATIONS.forEach((loc, i) => {
    const soon = loc.status === 'bientot';
    const li = document.createElement('li');
    li.innerHTML = `
      <button type="button" class="loc ${soon ? 'loc--soon' : ''}" data-index="${i}">
        <span class="loc__pin"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg></span>
        <span>
          <strong class="loc__title">${loc.name}</strong>
          <span class="loc__addr">${loc.type} · ${loc.address}</span>
          <span class="loc__tags">
            <span class="loc__tag ${soon ? 'loc__tag--soon' : 'loc__tag--on'}">${soon ? 'Bientôt' : 'En service'}</span>
            ${loc.pay.map(p => `<span class="loc__tag">${p}</span>`).join('')}
          </span>
        </span>
      </button>`;
    list.appendChild(li);
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('.loc');
    if (!btn) return;
    $$('.loc', list).forEach(b => b.classList.toggle('is-active', b === btn));
    const m = markers[+btn.dataset.index];
    if (map && m) {
      map.flyTo(m.getLatLng(), 15, { duration: reduceMotion ? 0 : 0.8 });
      m.openPopup();
    }
  });

  // Chargement différé de Leaflet (uniquement quand la carte approche de l'écran)
  function loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (window.L) return resolve(window.L);
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.onload = () => resolve(window.L);
      js.onerror = reject;
      document.body.appendChild(js);
    });
  }

  function initMap(L) {
    const el = $('#map');
    el.innerHTML = '';
    map = L.map(el, { scrollWheelZoom: false }).setView(LYON, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    LOCATIONS.forEach(loc => {
      const soon = loc.status === 'bientot';
      const icon = L.divIcon({
        className: '',
        html: `<div class="fz-marker ${soon ? 'fz-marker--soon' : ''}"></div>`,
        iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30]
      });
      const m = L.marker([loc.lat, loc.lng], { icon, title: loc.name, alt: loc.name })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><br>${loc.address}<br><em>${soon ? 'Bientôt disponible' : 'En service'} · ${loc.pay.join(', ')}</em>`);
      markers.push(m);
    });
    if (markers.length) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
  }

  const mapEl = $('#map');
  const startMap = () => loadLeaflet().then(initMap).catch(() => {
    mapEl.innerHTML = '<p class="map__fallback">La carte n’a pas pu se charger. La liste des emplacements reste dispo à côté.</p>';
  });
  if ('IntersectionObserver' in window) {
    const mio = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { mio.disconnect(); startMap(); }
    }, { rootMargin: '300px' });
    mio.observe(mapEl);
  } else {
    startMap();
  }

  /* ---------- 6. FAQ ACCORDÉON ---------- */
  $$('.acc__btn').forEach(btn => btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    // Un seul panneau ouvert à la fois
    $$('.acc__btn').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      $('#' + b.getAttribute('aria-controls')).hidden = true;
    });
    if (!open) {
      btn.setAttribute('aria-expanded', 'true');
      $('#' + btn.getAttribute('aria-controls')).hidden = false;
    }
  }));

  /* ---------- 7. FORMULAIRES ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function errorFor(field) {
    const v = field.value.trim();
    if (field.type === 'checkbox') return field.required && !field.checked ? 'Merci de cocher cette case.' : '';
    if (field.required && !v) return 'Ce champ est obligatoire.';
    if (!v) return '';
    if (field.type === 'email' && !EMAIL_RE.test(v)) return 'Cet email ne semble pas valide.';
    if (field.type === 'tel' && field.pattern && !new RegExp(field.pattern).test(v)) return 'Ce numéro ne semble pas valide.';
    if (field.minLength > 0 && v.length < field.minLength) return `Au moins ${field.minLength} caractères, s’il te plaît.`;
    return '';
  }

  function showError(field, msg) {
    const wrap = field.closest('.field');
    const err = $('#' + field.id + '-err');
    wrap.classList.toggle('has-error', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) {
      err.textContent = msg;
      if (msg) field.setAttribute('aria-describedby', err.id);
      else field.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  $$('form[data-form]').forEach(form => {
    const fields = $$('input:not(.hp), select, textarea', form).filter(f => f.id);
    const status = $('.form__status', form);
    const submit = $('button[type="submit"]', form);

    // Validation à la sortie du champ, puis en direct une fois l'erreur affichée
    fields.forEach(f => {
      f.addEventListener('blur', () => showError(f, errorFor(f)));
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') showError(f, errorFor(f)); });
      f.addEventListener('change', () => { if (f.getAttribute('aria-invalid') === 'true') showError(f, errorFor(f)); });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status';
      status.textContent = '';

      let firstInvalid = null;
      fields.forEach(f => { if (!showError(f, errorFor(f)) && !firstInvalid) firstInvalid = f; });
      if (firstInvalid) { firstInvalid.focus(); return; }

      // Anti-spam : champ piège rempli = robot
      if ($('.hp', form).value) return;

      const endpoint = FORM_ENDPOINTS[form.dataset.form];
      submit.disabled = true;
      const label = submit.textContent;
      submit.textContent = 'Envoi…';

      try {
        if (endpoint) {
          // Envoi réel (Formspree accepte FormData + Accept: application/json)
          const res = await fetch(endpoint, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          // Aucun endpoint configuré : envoi simulé
          await new Promise(r => setTimeout(r, 600));
        }
        form.reset();
        fields.forEach(f => showError(f, ''));
        status.classList.add('is-success');
        status.textContent = form.dataset.form === 'partner'
          ? 'Merci ! On vous recontacte sous 48 h pour en parler. 🧡'
          : 'Message bien reçu, merci ! On te répond vite. 🧡';
      } catch (err) {
        status.classList.add('is-error');
        status.textContent = 'Oups, l’envoi a échoué. Réessaie ou écris-nous à contact@friandeasy.fr.';
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });

  /* ---------- 8. BANNIÈRE COOKIES ---------- */
  const banner = $('.cookies');
  if (!store.get('fz-cookies')) banner.hidden = false;
  $$('[data-cookies]', banner).forEach(b => b.addEventListener('click', () => {
    store.set('fz-cookies', b.dataset.cookies); // "accept" ou "refuse"
    banner.hidden = true;
    // [À COMPLÉTER] si vous ajoutez un outil de mesure d'audience,
    // ne le charger que si store.get('fz-cookies') === 'accept'.
  }));
  $$('[data-open-cookies]').forEach(b => b.addEventListener('click', () => {
    banner.hidden = false;
    $('[data-cookies="accept"]', banner).focus();
  }));

  /* ---------- 9. DIVERS ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
