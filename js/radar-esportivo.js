(() => {
  const region = document.querySelector('#region-filter');
  const interest = document.querySelector('#interest-filter');
  const cards = [...document.querySelectorAll('.opportunity')];
  const count = document.querySelector('#radar-count');
  const empty = document.querySelector('#no-results');
  const officialCenters = [
    ['Casa Verde — Comandante Garcia D’Ávila', 'Rua Armando Coelho e Silva, 775 · Parque Peruche', 'norte'],
    ['Freguesia do Ó — Aurélio Campos', 'Rua Jacutiba, 167 · Freguesia do Ó', 'norte'],
    ['Jardim Cabuçu — Irmãos Paolillo', 'Rua General Jerônimo Furtado, 751 · Jaçanã', 'norte'],
    ['Jardim São Paulo — Alfredo Inácio Trindade', 'Rua Viri, 425 · Jardim São Paulo', 'norte'],
    ['Mandaqui — Gastão Moutinho', 'Rua Coronel João da Silva Feijó, 80 · Mandaqui', 'norte'],
    ['Vila Brasilândia — Oswaldo Brandão', 'Rua Michihisa Murata, 120 · Vila Brasilândia', 'norte'],
    ['Vila Guilherme — Ginásio Darcy Reis', 'Avenida Guilherme, 1819 · Vila Guilherme', 'norte'],
    ['Vila Maria — CEE Thomaz Mazzoni', 'Praça Jânio da Silva Quadros, 150 · Vila Maria', 'norte']
  ];
  const list = document.querySelector('#radar-list');
  officialCenters.forEach(([name, address, area]) => {
    const card = document.createElement('article');
    card.className = 'opportunity';
    card.dataset.region = area;
    card.dataset.interest = 'multiesporte quadra atividade familia';
    card.innerHTML = `<div class="card-top"><span class="tag free">Gratuito</span><span class="verified">Fonte oficial</span></div><p class="card-kicker">Zona Norte · Centro Esportivo Municipal</p><h3></h3><p>Consulte aulas, atividades e emissão de carteirinha diretamente com a unidade.</p><dl><div><dt>Endereço</dt><dd></dd></div><div><dt>Como participar</dt><dd>Confirme horários e vagas na unidade</dd></div></dl><a class="card-link" target="_blank" rel="noopener">Ver informação oficial →</a>`;
    card.querySelector('h3').textContent = name;
    card.querySelector('dd').textContent = address;
    card.querySelector('a').href = 'https://prefeitura.sp.gov.br/esportes/w/centros_esportivos/44152';
    list.append(card);
    cards.push(card);
  });
  const update = () => {
    const selectedRegion = region.value;
    const selectedInterest = interest.value;
    let visible = 0;
    cards.forEach(card => {
      const regions = card.dataset.region.split(' ');
      const interests = card.dataset.interest.split(' ');
      const regionMatch = selectedRegion === 'todos' || regions.includes('todos') || regions.includes(selectedRegion);
      const interestMatch = selectedInterest === 'todos' || interests.includes(selectedInterest);
      const show = regionMatch && interestMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}`;
    empty.hidden = visible !== 0;
  };
  document.querySelector('#search-opportunities').addEventListener('click', update);
  document.querySelector('#clear-filters').addEventListener('click', () => { region.value = 'todos'; interest.value = 'todos'; update(); });
  update();
})();
