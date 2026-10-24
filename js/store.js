(() => {
  'use strict';
  const form = document.querySelector('#store-interest-form');
  const status = document.querySelector('#store-status');
  const feedback = document.querySelector('#store-form-status');
  const submit = form.querySelector('button[type="submit"]');
  const storageKey = 'beStoreWishlistV1';
  let products = [], items = [], sending = false;
  const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({ items, savedAt: Date.now() })); }
    catch { document.querySelector('#store-wishlist-note').textContent = 'Seu navegador não permite guardar a seleção. Cadastre sua lista antes de sair para receber o aviso.'; }
  }
  function renderWishlist() {
    const container = document.querySelector('#store-wishlist-items');
    container.replaceChildren();
    let total = 0;
    if (!items.length) container.append(element('p', 'Seu carrinho está esperando suas favoritas. Escolha as peças acima para começar.', 'store-empty'));
    for (const item of items) {
      const p = products.find(p => p.id === item.productId);
      total += p.priceCents;
      const row = element('div', '', 'store-wish-row');
      const img = element('img'); img.src = p.images[0]; img.alt = ''; img.width = 72; img.height = 72;
      const info = element('div');
      info.append(element('h3', p.name), element('p', 'Tamanho: ' + item.size), element('span', 'Preço previsto: ' + money(p.priceCents)));
      const remove = element('button', 'Remover');
      remove.type = 'button'; remove.disabled = sending;
      remove.setAttribute('aria-label', 'Remover ' + p.name);
      remove.addEventListener('click', () => {
        items = items.filter(i => i.productId !== item.productId);
        changed(); renderWishlist();
      });
      row.append(img, info, remove); container.append(row);
    }
    document.querySelector('#store-wishlist-count').textContent = items.length;
    document.querySelector('#store-wishlist-total').textContent = items.length ? 'Total previsto: ' + money(total) + ' · sem frete' : '';
    submit.disabled = !items.length || sending;
    for (const button of document.querySelectorAll('[data-add-product]')) {
      const selected = items.some(i => i.productId === button.dataset.addProduct);
      button.textContent = selected ? 'Atualizar tamanho na lista' : 'Adicionar aos desejos';
      button.disabled = sending;
    }
  }
  function changed() {
    persist();
    feedback.textContent = 'Seleção atualizada neste navegador. Salve a lista abaixo para cadastrar estas preferências.';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !items.length || !form.reportValidity()) return;
    sending = true; renderWishlist();
    feedback.textContent = 'Salvando sua lista…';
    const payload = { name: form.elements.name.value, phone: form.elements.phone.value, consent: form.elements.consent.checked, items: items.map(i => ({ ...i })) };
    try {
      const response = await fetch('/api/store-interest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      feedback.textContent = data.preview
        ? 'Teste local registrado. A lista de demonstração não recebe avisos reais.'
        : 'Lista cadastrada! A equipe BE avisará pelo WhatsApp quando as peças estiverem disponíveis. Isso não é uma compra nem uma reserva.';
      form.reset();
    } catch {
      feedback.textContent = 'Não conseguimos confirmar o cadastro. Sua seleção foi mantida. Confira o telefone com DDD e tente novamente.';
    } finally { sending = false; renderWishlist(); }
  });
  fetch('/js/store-catalog.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(config => {
      products = config.products;
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey));
        if (stored && Date.now() - stored.savedAt < 180 * 86400000 && Array.isArray(stored.items)) {
          const seen = new Set();
          items = stored.items.filter(i => i && !seen.has(i.productId) && products.some(p => p.id === i.productId && p.interestSizes.includes(i.size)) && seen.add(i.productId)).map(i => ({ productId: i.productId, size: i.size }));
        }
      } catch { /* The wishlist also works without storage. */ }
      const grid = document.querySelector('#store-products');
      for (const product of products) {
        const card = element('article', '', 'store-product');
        const image = element('img'); image.src = product.images[0]; image.alt = product.name; image.loading = 'lazy'; card.append(image);
        const body = element('div', '', 'store-product-body');
        body.append(element('h3', product.name), element('p', product.description), element('strong', 'Preço previsto: ' + money(product.priceCents)));
        const label = element('label', 'Tamanho desejado', 'store-size');
        const size = element('select');
        size.setAttribute('aria-label', 'Tamanho de ' + product.name);
        size.append(new Option('Escolha o tamanho', ''));
        for (const value of product.interestSizes) size.add(new Option(value, value));
        size.value = items.find(i => i.productId === product.id)?.size || '';
        label.append(size);
        const button = element('button', '', 'store-primary'); button.type = 'button'; button.dataset.addProduct = product.id;
        button.addEventListener('click', () => {
          if (!size.value) { size.setCustomValidity('Escolha o tamanho desejado.'); size.reportValidity(); return; }
          items = items.filter(i => i.productId !== product.id);
          items.push({ productId: product.id, size: size.value });
          changed(); renderWishlist();
          status.textContent = product.name + ' adicionada à sua lista. Continue escolhendo ou confira seu carrinho de desejos.';
        });
        size.addEventListener('change', () => size.setCustomValidity(''));
        body.append(label, button); card.append(body); grid.append(card);
      }
      status.textContent = 'Escolha suas favoritas. Você pode alterar tamanhos e remover peças antes de cadastrar a lista.';
      renderWishlist();
    }).catch(() => { status.textContent = 'Não foi possível carregar a coleção. Atualize a página para tentar novamente.'; });
})();
