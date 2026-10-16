(() => {
  'use strict';
  const form = document.querySelector('#store-interest-form');
  const status = document.querySelector('#store-status');
  const feedback = document.querySelector('#store-form-status');
  const productSelect = form.elements.productId;
  let products = [];
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function sizes() {
    const product = products.find(p => p.id === productSelect.value);
    form.elements.size.replaceChildren(new Option('Escolha sua preferência', ''));
    for (const size of product?.interestSizes || []) form.elements.size.add(new Option(size, size));
    feedback.textContent = '';
  }
  productSelect.addEventListener('change', sizes);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    feedback.textContent = 'Registrando seu interesse…';
    const payload = Object.fromEntries(new FormData(form));
    payload.consent = form.elements.consent.checked;
    try {
      const response = await fetch('/api/store-interest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      feedback.textContent = data.preview
        ? 'Teste local registrado. Este cadastro de demonstração não entra na lista real.'
        : 'Interesse registrado! Se você já se cadastrou neste produto, sua preferência foi atualizada sem duplicar a contagem.';
      form.elements.name.value = '';
      form.elements.phone.value = '';
      form.elements.consent.checked = false;
    } catch {
      feedback.textContent = 'Não conseguimos confirmar o registro. Confira o telefone com DDD e tente novamente. Reenviar não duplica sua contagem.';
    } finally { button.disabled = false; }
  });
  fetch('/js/store-catalog.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(config => {
      products = config.products;
      const grid = document.querySelector('#store-products');
      for (const product of products) {
        productSelect.add(new Option(product.name, product.id));
        const card = element('article', '', 'store-product');
        const imagePath = product.images?.[0];
        if (imagePath && imagePath.startsWith('/img/')) {
          const image = element('img'); image.src = imagePath; image.alt = product.name; image.loading = 'lazy'; card.append(image);
        } else card.append(element('div', product.name + ' · Foto em preparação', 'store-photo-pending'));
        const body = element('div', '', 'store-product-body');
        body.append(element('h3', product.name), element('p', product.description),
          element('strong', 'Preço previsto: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.priceCents / 100)));
        const button = element('button', 'Tenho interesse', 'store-primary'); button.type = 'button';
        button.addEventListener('click', () => {
          form.hidden = false; productSelect.value = product.id; sizes();
          document.querySelector('#store-form-title').focus();
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        body.append(button); card.append(body); grid.append(card);
      }
      status.textContent = 'Escolha um produto para indicar seu tamanho e registrar interesse.';
      sizes();
    }).catch(() => { status.textContent = 'Não foi possível carregar a coleção. Atualize a página para tentar novamente.'; });
})();
