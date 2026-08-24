'use strict';

const professionals = [
  {
    nome: 'Válter Igor',
    categoria: 'fotografia',
    tipo: 'Fotógrafo Esportivo',
    especialidade: 'Cobertura esportiva e construção de imagem para atletas.',
    especialidades: ['Fotografia de jogos', 'Cobertura de atletas', 'Imagem esportiva'],
    servicos: 'Coberturas, ensaios esportivos e produção de imagem para registrar trajetórias dentro e fora das competições.',
    foto: 'img/profissionais/valter.jpg',
    modo: 'Presencial',
    whatsapp: '5511986366965',
    posicao: 'center 34%'
  },
  {
    nome: 'Bruno Rezende',
    categoria: 'personal',
    tipo: 'Personal Trainer',
    especialidade: 'Treinamento funcional, condicionamento e performance.',
    especialidades: ['Treinamento funcional', 'Condicionamento físico', 'Performance'],
    servicos: 'Treinos orientados para desenvolver condicionamento, movimento e evolução física de acordo com cada contexto.',
    foto: 'img/profissionais/bruno.jpg',
    modo: 'Online e presencial',
    whatsapp: '5511986366965',
    posicao: 'center 28%'
  },
  {
    nome: 'Luciano',
    categoria: 'personal',
    tipo: 'Personal Soccer',
    especialidade: 'Treinamento técnico e desenvolvimento no futebol.',
    especialidades: ['Técnica individual', 'Fundamentos do futebol', 'Desenvolvimento esportivo'],
    servicos: 'Sessões voltadas aos fundamentos, à técnica individual e ao desenvolvimento esportivo no futebol.',
    foto: 'img/profissionais/luciano.jpg',
    modo: 'Presencial',
    whatsapp: '5511986366965',
    posicao: 'center 22%'
  },
  {
    nome: 'Grasiele',
    categoria: 'psicologia',
    tipo: 'Psicóloga',
    especialidade: 'Psicologia esportiva, performance mental e psicoterapia.',
    especialidades: ['Psicologia esportiva', 'Performance mental', 'Psicoterapia'],
    servicos: 'Acompanhamento psicológico e cuidado dos aspectos emocionais relacionados ao esporte e à vida cotidiana.',
    foto: 'img/profissionais/grasiele.jpg',
    modo: 'Online',
    whatsapp: '5511986366965',
    posicao: 'center 35%'
  }
];

const list = document.getElementById('lista');
const search = document.getElementById('busca');
const resultCount = document.getElementById('result-count');
const chips = [...document.querySelectorAll('[data-category]')];
const guideButtons = [...document.querySelectorAll('[data-guide-category]')];
const modal = document.getElementById('modal');
const modalBox = document.getElementById('modalBox');
const topButton = document.getElementById('topBtn');

let activeCategory = 'todos';
let modalReturnFocus = null;

const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function professionalCard(professional, index) {
  const article = document.createElement('article');
  article.className = 'card';
  article.innerHTML = `
    <div class="card-cover" style="--photo-position:${professional.posicao}">
      <span class="verify">Perfil apresentado</span>
      <span class="mode-pill">${professional.modo}</span>
      <img src="${professional.foto}" alt="Foto de ${professional.nome}" loading="lazy" decoding="async">
    </div>
    <div class="card-body">
      <span class="category">${professional.tipo}</span>
      <h3>${professional.nome}</h3>
      <p class="spec">${professional.especialidade}</p>
      <div class="tags"><span>${professional.modo}</span><span>${professional.especialidades[0]}</span></div>
      <div class="actions">
        <button class="btn btn-primary" type="button" data-profile-index="${index}">Solicitar informações</button>
      </div>
    </div>`;
  return article;
}

function setActiveCategory(category) {
  activeCategory = category;
  chips.forEach(chip => {
    const active = chip.dataset.category === category;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-pressed', String(active));
  });
}

function filteredProfessionals() {
  const term = normalize(search?.value);
  return professionals
    .map((professional, index) => ({ professional, index }))
    .filter(({ professional }) => {
      const searchable = normalize([
        professional.nome,
        professional.tipo,
        professional.especialidade,
        professional.especialidades.join(' '),
        professional.modo
      ].join(' '));
      const matchesTerm = !term || searchable.includes(term);
      const matchesCategory = activeCategory === 'todos' || professional.categoria === activeCategory;
      return matchesTerm && matchesCategory;
    });
}

function render() {
  const matches = filteredProfessionals();
  list.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-results';
    empty.innerHTML = '<strong>Nenhum perfil encontrado.</strong><p>Tente outro termo ou volte para a opção “Todos”.</p>';
    list.appendChild(empty);
  } else {
    matches.forEach(({ professional, index }) => list.appendChild(professionalCard(professional, index)));
  }

  if (resultCount) {
    resultCount.textContent = matches.length === 1
      ? '1 profissional encontrado'
      : `${matches.length} profissionais encontrados`;
  }
}

function contactMessage(professional, details = '') {
  return `Olá, conheci o perfil de ${professional.nome} no Bem Esportivo e gostaria de entender melhor o atendimento.${details}`;
}

function openWhatsApp(professional, details = '') {
  const url = `https://wa.me/${professional.whatsapp}?text=${encodeURIComponent(contactMessage(professional, details))}`;
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) opened.opener = null;
}

function closeProfile() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('professional-modal-open');
  if (modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus();
  modalReturnFocus = null;
}

function openProfile(professional) {
  modalReturnFocus = document.activeElement;
  modalBox.innerHTML = `
    <img src="${professional.foto}" alt="Foto de ${professional.nome}" style="--photo-position:${professional.posicao}">
    <span class="category">${professional.tipo}</span>
    <h3 id="professional-modal-title">${professional.nome}</h3>
    <p>${professional.especialidade}</p>
    <ul class="profile-specialties" aria-label="Áreas de atuação">${professional.especialidades.map(item => `<li>${item}</li>`).join('')}</ul>
    <p>${professional.servicos}</p>
    <p>Formato informado: <strong>${professional.modo}</strong>.</p>
    <p><small>Disponibilidade, valores, formação e condições do serviço devem ser confirmados diretamente no contato. O Bem Esportivo apresenta o perfil, mas não confirma contratação ou horário.</small></p>
    <div class="modal-actions"><button class="btn btn-primary" type="button" data-modal-contact>Pedir informações</button></div>
    <form class="profile-schedule">
      <strong>Enviar uma preferência de horário</strong>
      <label>Dia preferido<input type="date" name="date" required></label>
      <label>Período<select name="period" required><option value="">Selecione</option><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label>
      <button class="btn btn-dark" type="submit">Enviar preferência</button>
      <small>Este pedido inicia uma conversa e não confirma agendamento.</small>
    </form>
    <button class="close-modal" type="button" data-modal-close>Fechar perfil</button>`;

  const scheduleForm = modalBox.querySelector('.profile-schedule');
  const today = new Date();
  scheduleForm.elements.date.min = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  modalBox.querySelector('[data-modal-contact]').addEventListener('click', () => openWhatsApp(professional));
  modalBox.querySelector('[data-modal-close]').addEventListener('click', closeProfile);
  scheduleForm.addEventListener('submit', event => {
    event.preventDefault();
    const date = new Date(`${scheduleForm.elements.date.value}T12:00:00`);
    const day = Number.isNaN(date.getTime()) ? scheduleForm.elements.date.value : date.toLocaleDateString('pt-BR');
    openWhatsApp(professional, ` Minha preferência é ${day}, no período da ${scheduleForm.elements.period.value.toLowerCase()}.`);
  });

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('professional-modal-open');
  modalBox.querySelector('[data-modal-close]').focus();
}

chips.forEach(chip => chip.addEventListener('click', () => {
  setActiveCategory(chip.dataset.category);
  render();
}));

guideButtons.forEach(button => button.addEventListener('click', () => {
  setActiveCategory(button.dataset.guideCategory);
  if (search) search.value = '';
  render();
  document.getElementById('profissionais')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

search?.addEventListener('input', render);

list?.addEventListener('click', event => {
  const profileButton = event.target.closest('[data-profile-index]');
  if (profileButton) openProfile(professionals[Number(profileButton.dataset.profileIndex)]);
});

modal?.addEventListener('click', event => {
  if (event.target === modal) closeProfile();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modal?.classList.contains('show')) closeProfile();
  if (event.key !== 'Tab' || !modal?.classList.contains('show')) return;
  const focusable = [...modalBox.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('scroll', () => {
  if (topButton) topButton.style.display = window.scrollY > 700 ? 'grid' : 'none';
}, { passive: true });

topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

render();
