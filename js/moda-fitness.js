(() => {
  'use strict';
  const dialog = document.getElementById('fashion-lightbox');
  const image = document.getElementById('fashion-lightbox-image');
  const caption = document.getElementById('fashion-lightbox-caption');
  const position = document.getElementById('fashion-lightbox-position');
  const status = document.getElementById('fashion-gallery-status');
  const photos = [];
  let activePhotos = photos;
  let current = 0;
  let opener = null;

  function showPhoto(index) {
    if (!activePhotos.length) return;
    current = (index + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[current];
    image.src = photo.src;
    image.alt = photo.alt;
    caption.textContent = photo.caption;
    position.textContent = `${current + 1} / ${activePhotos.length}`;
  }

  document.getElementById('fashion-lightbox-close').addEventListener('click', () => dialog.close());
  document.getElementById('fashion-lightbox-previous').addEventListener('click', () => showPhoto(current - 1));
  document.getElementById('fashion-lightbox-next').addEventListener('click', () => showPhoto(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('fashion-lightbox-open');
    opener?.focus({ preventScroll: true });
    image.removeAttribute('src');
  });

  function loadEditorial() {
    try {
      const data = { photos: [...document.querySelectorAll('[data-fashion-slot]')].map(figure => {
        const photo = figure.querySelector('.fashion-static-photo');
        return photo ? { slot: figure.dataset.fashionSlot, src: photo.getAttribute('src'), alt: photo.alt, width: photo.width, height: photo.height, caption: figure.querySelector('figcaption').textContent } : null;
      }) };
      const usedSlots = new Set();
      for (const photo of Array.isArray(data.photos) ? data.photos : []) {
        if (!photo || typeof photo.slot !== 'string' || usedSlots.has(photo.slot)) continue;
        const figure = [...document.querySelectorAll('[data-fashion-slot]')].find(node => node.dataset.fashionSlot === photo.slot);
        if (!figure || !/^\/img\/[a-z0-9/_-]+\.(?:webp|avif|jpe?g|png)(?:\?v=[a-z0-9-]+)?$/i.test(photo.src) || !photo.alt) continue;
        const thumbnail = new Image();
        thumbnail.src = photo.src;
        thumbnail.alt = String(photo.alt);
        thumbnail.decoding = 'async';
        thumbnail.loading = photo.slot.startsWith('capa') ? 'eager' : 'lazy';
        if (photo.slot === 'capa-azul') thumbnail.fetchPriority = 'high';
        if (Number(photo.width) > 0 && Number(photo.height) > 0) {
          thumbnail.width = Number(photo.width);
          thumbnail.height = Number(photo.height);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fashion-photo-button';
        button.setAttribute('aria-label', `Ampliar fotografia: ${photo.alt}`);
        button.setAttribute('aria-haspopup', 'dialog');
        const expand = document.createElement('span');
        expand.className = 'fashion-photo-expand';
        expand.setAttribute('aria-hidden', 'true');
        expand.textContent = '↗';
        button.append(thumbnail, expand);
        const index = photos.length;
        photos.push({ src: photo.src, alt: String(photo.alt), caption: String(photo.caption || figure.querySelector('figcaption').textContent) });
        usedSlots.add(photo.slot);
        button.addEventListener('click', () => {
          opener = button;
          activePhotos = photos;
          showPhoto(index);
          dialog.showModal();
          document.body.classList.add('fashion-lightbox-open');
        });
        figure.querySelector('.fashion-static-photo, .fashion-placeholder').replaceWith(button);
      }
      if (photos.length) status.textContent = 'Clique nas fotografias para ver de perto.';
    } catch {
      status.textContent = 'O editorial está em preparação. Volte em breve para conhecer as fotografias.';
    }
  }
  loadEditorial();

  function loadCatalog() {
    const grid = document.getElementById('fashion-catalog-grid');
    const count = document.getElementById('fashion-catalog-count');
    const filters = [...document.querySelectorAll('[data-fashion-filter]')];
    const excludedCatalogPhotos = new Set(['azul-002.webp', 'azul-004.webp', 'azul-006.webp', 'azul-008.webp', 'azul-017.webp', 'azul-022.webp']);
    const catalog = Array.isArray(window.FASHION_CATALOG)
      ? window.FASHION_CATALOG.filter(photo => !excludedCatalogPhotos.has(photo.src.split('/').pop().split('?')[0]))
      : [];
    if (!grid || !catalog.length) return;
    const catalogPhotos = catalog.map((photo, index) => ({
      src: photo.src,
      alt: photo.alt,
      caption: `${photo.categoryLabel} · fotografia ${String(index + 1).padStart(2, '0')}`
    }));

    const fragment = document.createDocumentFragment();
    catalog.forEach((photo, index) => {
      const figure = document.createElement('figure');
      figure.className = 'fashion-catalog-card';
      figure.dataset.category = photo.category;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fashion-photo-button';
      button.setAttribute('aria-label', `Ampliar fotografia: ${photo.alt}`);
      button.setAttribute('aria-haspopup', 'dialog');
      const thumbnail = new Image();
      thumbnail.src = photo.src;
      thumbnail.alt = photo.alt;
      thumbnail.width = photo.width;
      thumbnail.height = photo.height;
      thumbnail.loading = 'lazy';
      thumbnail.decoding = 'async';
      const expand = document.createElement('span');
      expand.className = 'fashion-photo-expand';
      expand.setAttribute('aria-hidden', 'true');
      expand.textContent = '↗';
      const figureCaption = document.createElement('figcaption');
      figureCaption.textContent = `${photo.categoryLabel} / ${String(index + 1).padStart(2, '0')}`;
      button.append(thumbnail, expand);
      button.addEventListener('click', () => {
        opener = button;
        activePhotos = catalogPhotos.filter((_, photoIndex) => !grid.children[photoIndex].hidden);
        const visibleIndex = activePhotos.findIndex(item => item.src === photo.src);
        showPhoto(visibleIndex);
        dialog.showModal();
        document.body.classList.add('fashion-lightbox-open');
      });
      figure.append(button, figureCaption);
      fragment.append(figure);
    });
    grid.append(fragment);

    filters.forEach(filter => filter.addEventListener('click', () => {
      const category = filter.dataset.fashionFilter;
      filters.forEach(item => {
        const active = item === filter;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      let visible = 0;
      [...grid.children].forEach(card => {
        card.hidden = category !== 'all' && card.dataset.category !== category;
        if (!card.hidden) visible += 1;
      });
      count.textContent = `${visible} ${visible === 1 ? 'fotografia' : 'fotografias'}`;
    }));
  }
  loadCatalog();
})();
