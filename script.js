script.js
// Exibe alerta ao clicar nos links de navegação (efeito de demonstração)
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("mouseover", () => {
    link.style.color = "#ff6600"; // muda a cor ao passar o mouse
  });

  link.addEventListener("mouseout", () => {
    link.style.color = "orange"; // volta à cor original
  });
});

// Exemplo de carregamento de destaque interativo
window.addEventListener("DOMContentLoaded", () => {
  const destaques = document.querySelectorAll(".destaque article");
  destaques.forEach((artigo, index) => {
    artigo.style.opacity = 0;
    setTimeout(() => {
      artigo.style.transition = "opacity 1s";
      artigo.style.opacity = 1;
    }, index * 500);
  });
});

// Placeholder para futura integração de anúncios dinâmicos
function carregarAnuncios() {
  const anuncio = document.querySelector(".anuncio");
  anuncio.innerHTML += `<p><em>Anúncio patrocinado: Clínica Sport Vida</em></p>`;
}

// Simula o carregamento de anúncios após 2 segundos
setTimeout(carregarAnuncios, 2000);
