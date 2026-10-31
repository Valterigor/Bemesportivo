(() => {
  'use strict';
  const KEY = 'meuCaminhoBeProfileV1';
  const $ = id => document.getElementById(id);
  let photo = '';
  let selectedSports = [];
  const SPORTS = ['Acrobacia','Aeróbica','Aikido','Alpinismo','Arco e flecha','Artes marciais','Atletismo','Automobilismo','Badminton','Balé','Basquete','Basquete 3x3','Beisebol','Bicicross (BMX)','Bilhar','Bocha','Boliche','Boxe','Breakdance','Cabo de guerra','Caiaque','Caminhada','Canoagem','Capoeira','Ciclismo','Ciclismo de estrada','Ciclismo indoor','Corrida','Corrida de aventura','Corrida de montanha','Críquete','Crossfit','Curling','Dança','Dardos','Duathlon','Escalada','Esgrima','Esqui','Fisiculturismo','Frescobol','Futebol','Futebol americano','Futebol de areia','Futebol de cegos','Futevôlei','Futsal','Ginástica','Ginástica artística','Ginástica rítmica','Goalball','Golfe','Handebol','Hóquei','Hóquei no gelo','Jiu-jítsu','Judô','Karatê','Kart','Kendo','Kickboxing','Kitesurf','Levantamento de peso','Luta livre','Maratona aquática','Mergulho','Muay thai','Musculação','Nado artístico','Natação','Orientação','Padel','Parabadminton','Paracanoagem','Paraciclismo','Parataekwondo','Pentatlo moderno','Pesca esportiva','Peteca','Pilates','Polo aquático','Remo','Rúgbi','Rúgbi em cadeira de rodas','Skate','Slackline','Softbol','Stand up paddle','Surfe','Taekwondo','Tai chi chuan','Tênis','Tênis de mesa','Tiro esportivo','Trail running','Treinamento funcional','Triathlon','Vela','Vôlei','Vôlei de praia','Vôlei sentado','Wakeboard','Windsurf','Yoga','Outra modalidade'];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const renderPhoto = () => {
    const image = $('profile-photo-preview');
    image.hidden = !photo;
    $('profile-photo-fallback').hidden = Boolean(photo);
    $('profile-photo-remove').hidden = !photo;
    if (photo) image.src = photo; else image.removeAttribute('src');
  };
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const renderSports = (query = '') => {
    const selected = $('profile-sports-selected');
    selected.replaceChildren(...selectedSports.map(sport => {
      const chip = document.createElement('span'); chip.className = 'sports-chip'; chip.append(document.createTextNode(sport));
      const remove = document.createElement('button'); remove.type = 'button'; remove.setAttribute('aria-label', `Remover ${sport}`); remove.textContent = '×';
      remove.addEventListener('click', () => { selectedSports = selectedSports.filter(item => item !== sport); renderSports($('profile-sports-search').value); });
      chip.append(remove); return chip;
    }));
    const options = $('profile-sports-options'); options.replaceChildren();
    const filtered = SPORTS.filter(sport => normalize(sport).includes(normalize(query)));
    filtered.forEach(sport => {
      const label = document.createElement('label'); label.className = 'sports-option';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedSports.includes(sport);
      checkbox.disabled = selectedSports.length >= 5 && !checkbox.checked;
      if (checkbox.disabled) label.classList.add('is-disabled');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selectedSports.length < 5) selectedSports.push(sport);
        else selectedSports = selectedSports.filter(item => item !== sport);
        renderSports($('profile-sports-search').value);
      });
      label.append(checkbox, document.createTextNode(sport)); options.append(label);
    });
    if (!filtered.length) { const empty = document.createElement('p'); empty.textContent = 'Nenhuma modalidade encontrada. Selecione “Outra modalidade” para representar uma prática que não esteja na lista.'; options.append(empty); }
    $('profile-sports-count').textContent = `${selectedSports.length} de 5 selecionados`;
  };
  const load = () => {
    const profile = read();
    $('profile-name').value = String(profile.name || '');
    $('profile-story').value = String(profile.story || '');
    selectedSports = Array.isArray(profile.practicedSports) ? profile.practicedSports.filter(sport => SPORTS.includes(sport)).slice(0, 5) : [];
    photo = /^data:image\/(jpeg|png|webp);base64,/i.test(profile.photoDataUrl || '') ? profile.photoDataUrl : '';
    renderPhoto();
    renderSports();
  };
  const imageFrom = file => new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/') || file.size > 8 * 1024 * 1024) return reject(new Error('Escolha uma foto de até 8 MB.'));
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir esta foto.')); };
    image.src = url;
  });
  $('profile-photo').addEventListener('change', async event => {
    try {
      const { image, url } = await imageFrom(event.target.files[0]);
      const size = Math.min(image.naturalWidth, image.naturalHeight), x = (image.naturalWidth - size) / 2, y = (image.naturalHeight - size) / 2;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 480;
      canvas.getContext('2d').drawImage(image, x, y, size, size, 0, 0, 480, 480);
      URL.revokeObjectURL(url); photo = canvas.toDataURL('image/jpeg', .86); renderPhoto();
    } catch (error) { event.target.value = ''; alert(error.message); }
  });
  $('profile-photo-remove').addEventListener('click', () => { photo = ''; $('profile-photo').value = ''; renderPhoto(); });
  $('profile-sports-toggle').addEventListener('click', event => {
    const panel = $('profile-sports-panel'), opening = panel.hidden;
    panel.hidden = !opening; event.currentTarget.setAttribute('aria-expanded', String(opening));
    event.currentTarget.querySelector('span').textContent = opening ? '↑' : '↓';
    if (opening) $('profile-sports-search').focus();
  });
  $('profile-sports-search').addEventListener('input', event => renderSports(event.target.value));
  $('profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('profile-name').value.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!name) { $('profile-name').reportValidity(); return; }
    const previous = read(), now = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify({ ...previous, name, story: $('profile-story').value.trim().slice(0, 1000), photoDataUrl: photo, practicedSports: selectedSports.slice(0, 5), createdAt: previous.createdAt || now, identityCreatedAt: previous.identityCreatedAt || now, updatedAt: now }));
    window.dispatchEvent(new CustomEvent('diary:profile-updated'));
    const status = document.getElementById('status'); status.textContent = 'Seu perfil foi salvo neste aparelho.'; setTimeout(() => { if (status.textContent.includes('perfil')) status.textContent = ''; }, 5000);
  });
  load();
})();
