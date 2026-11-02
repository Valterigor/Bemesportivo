(() => {
  const region = document.querySelector('#region-filter');
  const interest = document.querySelector('#interest-filter');
  const list = document.querySelector('#radar-list');
  const count = document.querySelector('#radar-count');
  const heroTotal = document.querySelector('#radar-hero-total');
  const empty = document.querySelector('#no-results');
  const clearButton = document.querySelector('#clear-filters');
  const searchButton = document.querySelector('#search-opportunities');
  const mapElement = document.querySelector('#radar-map');
  const mapFallback = document.querySelector('#radar-map-fallback');
  const mapList = document.querySelector('#radar-map-list');
  const viewMapButton = document.querySelector('#radar-view-map');

  if (!region || !interest || !list) return;

  const officialCenters = [
    ['Casa Verde — Comandante Garcia D’Ávila', 'Rua Armando Coelho e Silva, 775 · Parque Peruche', -23.5077, -46.6621],
    ['Freguesia do Ó — Aurélio Campos', 'Rua Jacutiba, 167 · Freguesia do Ó', -23.4974, -46.7017],
    ['Jardim Cabuçu — Irmãos Paolillo', 'Rua General Jerônimo Furtado, 751 · Jaçanã', -23.4586, -46.5867],
    ['Jardim São Paulo — Alfredo Inácio Trindade', 'Rua Viri, 425 · Jardim São Paulo', -23.4921, -46.6119],
    ['Mandaqui — Gastão Moutinho', 'Rua Coronel João da Silva Feijó, 80 · Mandaqui', -23.4775, -46.6215],
    ['Vila Brasilândia — Oswaldo Brandão', 'Rua Michihisa Murata, 120 · Vila Brasilândia', -23.4622, -46.6891],
    ['Vila Guilherme — Ginásio Darcy Reis', 'Avenida Guilherme, 1819 · Vila Guilherme', -23.5122, -46.6037],
    ['Vila Maria — CEE Thomaz Mazzoni', 'Praça Jânio da Silva Quadros, 150 · Vila Maria', -23.5057, -46.5828]
  ];

  officialCenters.forEach(([name, address, lat, lng]) => {
    const card = document.createElement('article');
    card.className = 'opportunity';
    card.dataset.region = 'norte';
    card.dataset.interest = 'multiesporte quadra atividade familia';
    card.dataset.lat = String(lat);
    card.dataset.lng = String(lng);
    card.innerHTML = `<div class="card-top"><span class="tag free">Gratuito</span><span class="verified">Fonte oficial</span></div><p class="card-kicker">Zona Norte · Centro Esportivo Municipal</p><h3></h3><p>Consulte aulas, atividades e emissão de carteirinha diretamente com a unidade.</p><dl><div><dt>Endereço</dt><dd></dd></div><div><dt>Como participar</dt><dd>Confirme horários e vagas na unidade</dd></div></dl><a class="card-link" href="https://prefeitura.sp.gov.br/esportes/w/centros_esportivos/44152" target="_blank" rel="noopener">Ver informação oficial →</a>`;
    card.querySelector('h3').textContent = name;
    card.querySelector('dd').textContent = address;
    list.append(card);
  });

  const cards = [...list.querySelectorAll('.opportunity')];
  cards.forEach(card => {
    const title = card.querySelector('h3');
    const source = card.querySelector('.card-link');
    if (!title || !source || title.querySelector('a')) return;
    const link = document.createElement('a');
    link.href = source.href;
    link.target = source.target || '_blank';
    link.rel = source.rel || 'noopener';
    link.textContent = title.textContent;
    link.setAttribute('aria-label', `Abrir fonte oficial: ${title.textContent}`);
    title.replaceChildren(link);
    source.textContent = 'Abrir fonte oficial ↗';
  });
  if (heroTotal) heroTotal.textContent = String(cards.length);

  let map;
  let markerLayer;
  const markers = new Map();
  const cardTitle = card => card.querySelector('h3')?.textContent.trim() || 'Local esportivo';
  const cardAddress = card => card.querySelector('dd')?.textContent.trim() || '';
  const mappedCards = () => cards.filter(card => card.dataset.lat && card.dataset.lng);

  const focusCard = card => {
    document.querySelectorAll('.opportunity.is-map-active').forEach(item => item.classList.remove('is-map-active'));
    card.classList.add('is-map-active');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const focusMarker = card => {
    const marker = markers.get(card);
    if (!map || !marker) return;
    const latLng = marker.getLatLng();
    map.flyTo(latLng, Math.max(map.getZoom(), 14), { duration: 0.65 });
    marker.openPopup();
  };

  const addMapLinks = () => {
    mappedCards().forEach(card => {
      if (card.querySelector('.radar-map-link')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'radar-map-link';
      button.textContent = 'Ver no mapa ↗';
      button.addEventListener('click', () => {
        mapElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => focusMarker(card), 350);
      });
      card.append(button);
    });
  };

  const mapListButton = (card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'radar-map-item';
    button.innerHTML = `<b>${String(index + 1).padStart(2, '0')}</b><span><strong></strong><small></small></span>`;
    button.querySelector('strong').textContent = cardTitle(card);
    button.querySelector('small').textContent = cardAddress(card);
    button.addEventListener('click', () => { focusMarker(card); focusCard(card); });
    return button;
  };

  const renderMapList = visibleCards => {
    if (!mapList) return;
    mapList.replaceChildren(...visibleCards.slice(0, 5).map(mapListButton));
    if (visibleCards.length > 5) {
      const remainder = document.createElement('p');
      remainder.className = 'radar-map-more';
      remainder.textContent = `+ ${visibleCards.length - 5} locais no mapa`;
      mapList.append(remainder);
    }
  };

  const updateMap = visibleCards => {
    renderMapList(visibleCards);
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    const visibleMarkers = visibleCards.map(card => markers.get(card)).filter(Boolean);
    visibleMarkers.forEach(marker => markerLayer.addLayer(marker));
    if (visibleMarkers.length) {
      map.fitBounds(window.L.featureGroup(visibleMarkers).getBounds(), { padding: [42, 42], maxZoom: 13 });
    }
  };

  const initMap = () => {
    addMapLinks();
    const available = mappedCards();
    renderMapList(available);
    if (!mapElement || !window.L) {
      if (mapElement) mapElement.hidden = true;
      if (mapFallback) mapFallback.hidden = false;
      return;
    }
    map = window.L.map(mapElement, { scrollWheelZoom: false }).setView([-23.5505, -46.6333], 11);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    markerLayer = window.L.layerGroup().addTo(map);
    available.forEach((card, index) => {
      const icon = window.L.divIcon({ className: 'radar-marker-wrap', html: `<span class="radar-marker"><span>${index + 1}</span></span>`, iconSize: [38, 44], iconAnchor: [19, 42], popupAnchor: [0, -38] });
      const marker = window.L.marker([Number(card.dataset.lat), Number(card.dataset.lng)], { icon });
      marker.bindPopup(`<strong>${cardTitle(card)}</strong><br><span>${cardAddress(card)}</span>`);
      marker.on('click', () => focusCard(card));
      markers.set(card, marker);
    });
    updateMap(available);
    window.setTimeout(() => map.invalidateSize(), 50);
  };

  const update = () => {
    const visibleCards = [];
    cards.forEach(card => {
      const matchesRegion = region.value === 'todos' || (card.dataset.region || '').split(' ').includes(region.value);
      const matchesInterest = interest.value === 'todos' || (card.dataset.interest || '').split(' ').includes(interest.value);
      const visible = matchesRegion && matchesInterest;
      card.hidden = !visible;
      if (visible) visibleCards.push(card);
    });
    if (count) count.textContent = String(visibleCards.length);
    if (empty) empty.hidden = visibleCards.length !== 0;
    updateMap(visibleCards.filter(card => markers.has(card)));
  };

  region.addEventListener('change', update);
  interest.addEventListener('change', update);
  searchButton?.addEventListener('click', update);
  clearButton?.addEventListener('click', () => { region.value = 'todos'; interest.value = 'todos'; update(); });
  viewMapButton?.addEventListener('click', () => mapElement?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  initMap();
  update();
})();
