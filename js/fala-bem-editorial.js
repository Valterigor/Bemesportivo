(() => {
  const cards = [...document.querySelectorAll('[data-news-category]')];
  const buttons = [...document.querySelectorAll('[data-news-filter]')];
  const search = document.getElementById('news-search');
  if (!search) return;
  let category = 'todos';
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filter() {
    const query = normalize(search.value.trim());
    let count = 0;
    cards.forEach(card => {
      const visible = (category === 'todos' || card.dataset.newsCategory.split(' ').includes(category)) && normalize(card.textContent).includes(query);
      card.hidden = !visible;
      if (visible) count++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.newsFilter === category)));
    document.getElementById('news-count').textContent = `${count} ${count === 1 ? 'leitura disponível' : 'leituras disponíveis'}`;
    document.getElementById('news-empty').hidden = count > 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.newsFilter; filter(); }));
  search.addEventListener('input', filter);
  document.getElementById('news-reset').addEventListener('click', () => { category = 'todos'; search.value = ''; filter(); search.focus(); });
})();
