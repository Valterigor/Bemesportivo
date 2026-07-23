function applyIntrinsicSize(image) {
  if (image.hasAttribute('width') && image.hasAttribute('height')) return;
  const assign = () => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    if (!image.hasAttribute('width')) image.setAttribute('width', String(image.naturalWidth));
    if (!image.hasAttribute('height')) image.setAttribute('height', String(image.naturalHeight));
  };
  if (image.complete) assign();
  else image.addEventListener('load', assign, { once: true });
}

export function initMediaQuality() {
  document.querySelectorAll('img').forEach(image => {
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
    if (image.hasAttribute('srcset') && !image.hasAttribute('sizes')) image.sizes = '100vw';

    const belowFold = image.getBoundingClientRect().top > window.innerHeight * 1.2;
    const secondaryMedia = Boolean(image.closest('footer, [hidden], .related-card, .story-card, .product, .expert-card'));
    if (!image.hasAttribute('loading') && (belowFold || secondaryMedia)) image.loading = 'lazy';

    applyIntrinsicSize(image);
  });
}
