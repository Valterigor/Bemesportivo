// Botão voltar ao topo
window.addEventListener("scroll", () => {
  const botao = document.getElementById("voltar-topo");
  botao.style.display = window.scrollY > 200 ? "block" : "none";
});

// Clique no botão voltar ao topo
document.getElementById("voltar-topo").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Leia mais
document.addEventListener("click", e => {
  if (e.target.classList.contains("leia-mais")) {
    const completo = e.target.previousElementSibling;
    completo.classList.toggle("expandido");
    e.target.textContent = completo.classList.contains("expandido") ? "Leia menos" : "Leia mais";
  }
});

// Menu responsivo
const menuToggle = document.getElementById("menu-toggle");
const nav = document.querySelector("nav");
menuToggle.addEventListener("click", () => {
  nav.classList.toggle("show");
});

// Animações ao rolar
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});

document.querySelectorAll(".fade-slide").forEach(sec => observer.observe(sec));

const menuToggle = document.getElementById('menu-toggle');
const nav = document.querySelector('nav');

menuToggle.addEventListener('click', () => {
  nav.classList.toggle('active');
});

// Exibir todos os profissionais ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
  resultados.innerHTML = profissionais.map(p => `
    <li onclick="mostrarDetalhes('${p.nome.replace(/'/g, "\\'")}')">${p.nome}</li>
  `).join("");
});




const videoCards = document.querySelectorAll('.video-card');
const modal = document.getElementById('videoModal');
const fechar = modal.querySelector('.fechar');
const videoFrame = document.getElementById('videoFrame');

videoCards.forEach(card => {
  card.addEventListener('click', () => {
    const url = card.getAttribute('data-video');
    videoFrame.src = url + "?autoplay=1";
    modal.style.display = 'block';
  });
});

fechar.addEventListener('click', () => {
  videoFrame.src = "";
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    videoFrame.src = "";
    modal.style.display = 'none';
  }
});
