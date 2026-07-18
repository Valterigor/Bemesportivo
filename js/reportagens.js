function escapeReportHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

const REPORT_COMMUNITY_API = location.protocol === "file:" ? "" : "/api/community";
const REPORT_CLIENT_KEY = "bemEsportivoCommunityClientId";
const reportCommentCache = {};

function drawCoverImage(context, image, x, y, width, height) {
  const imageWidth = image.width || image.naturalWidth;
  const imageHeight = image.height || image.naturalHeight;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (imageWidth - sourceWidth) / 2;
  const sourceY = (imageHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  return lines;
}

async function imageFromBlob(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function createStoryCover(blob, title) {
  const image = await imageFromBlob(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");

  context.fillStyle = "#090909";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.filter = "blur(28px) brightness(.42)";
  drawCoverImage(context, image, -45, -45, 1170, 2010);
  context.restore();
  context.fillStyle = "rgba(0, 0, 0, .34)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#fa8a01";
  context.font = "900 42px Rubik, Arial, sans-serif";
  context.fillText("BEM ESPORTIVO", 64, 106);
  context.fillStyle = "#ffffff";
  context.font = "700 25px Inter, Arial, sans-serif";
  context.fillText("REPORTAGEM · MOVIMENTO E SAÚDE", 64, 151);

  context.save();
  context.beginPath();
  context.roundRect(64, 205, 952, 536, 28);
  context.clip();
  drawCoverImage(context, image, 64, 205, 952, 536);
  context.restore();

  context.fillStyle = "#ffffff";
  context.font = "900 70px Rubik, Arial, sans-serif";
  const titleLines = wrapCanvasText(context, title, 920).slice(0, 5);
  titleLines.forEach((line, index) => context.fillText(line, 64, 855 + (index * 82)));

  context.fillStyle = "rgba(255, 255, 255, .82)";
  context.font = "500 31px Inter, Arial, sans-serif";
  context.fillText("Bruno e Rafael Resende comandam uma manhã", 64, 1320);
  context.fillText("de treino, orientação e energia coletiva.", 64, 1364);

  context.fillStyle = "#fa8a01";
  context.beginPath();
  context.roundRect(64, 1490, 952, 154, 25);
  context.fill();
  context.fillStyle = "#111111";
  context.font = "900 38px Rubik, Arial, sans-serif";
  context.fillText("ACESSE A REPORTAGEM", 108, 1554);
  context.font = "800 29px Inter, Arial, sans-serif";
  context.fillText("bemesportivo.com/reportagens", 108, 1603);

  context.fillStyle = "rgba(255, 255, 255, .78)";
  context.font = "600 26px Inter, Arial, sans-serif";
  context.fillText("No Instagram, cole o link na figurinha “Link”.", 64, 1756);

  const storyBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .92));
  if (!storyBlob) throw new Error("Não foi possível gerar a capa.");
  return new File([storyBlob], "story-treino-funcional-bem-esportivo.jpg", { type: "image/jpeg" });
}

function initReportSharing() {
  document.querySelectorAll("[data-report-share]").forEach(section => {
    const reportId = section.dataset.reportId || "";
    const title = section.dataset.shareTitle || document.title;
    const coverPath = section.dataset.shareCover || "";
    const articleUrl = new URL("/reportagens?ref=compartilhar-treino-funcional", location.origin);
    articleUrl.hash = reportId;
    const shareUrl = articleUrl.href;
    const shareText = `${title} | Bem Esportivo`;
    const whatsapp = section.querySelector("[data-share-whatsapp]");
    const coverButton = section.querySelector("[data-share-cover-button]");
    const download = section.querySelector("[data-share-download]");
    const status = section.querySelector("[data-share-status]");

    if (whatsapp) {
      whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    }

    const coverBlobPromise = coverPath
      ? fetch(new URL(coverPath, location.href))
          .then(response => {
            if (!response.ok) throw new Error("Capa indisponível");
            return response.blob();
          })
          .catch(() => null)
      : Promise.resolve(null);

    const storyFilePromise = coverBlobPromise
      .then(blob => blob ? createStoryCover(blob, title) : null)
      .catch(() => null);

    storyFilePromise.then(file => {
      if (!file || !download) return;
      download.href = URL.createObjectURL(file);
      download.download = file.name;
    });

    coverButton?.addEventListener("click", async () => {
      if (status) status.textContent = "Preparando a capa...";

      try {
        navigator.clipboard?.writeText(shareUrl).catch(() => {});
        const coverFile = await storyFilePromise;

        if (coverFile && navigator.share && navigator.canShare?.({ files: [coverFile] })) {
          await navigator.share({
            files: [coverFile],
            title,
            text: `${shareText}\n${shareUrl}`
          });
          if (status) status.textContent = "Capa compartilhada e link copiado. No Instagram, adicione a figurinha Link e cole o endereço.";
          return;
        }

        if (navigator.share) {
          await navigator.share({ title, text: shareText, url: shareUrl });
          if (status) status.textContent = "Reportagem compartilhada. Para publicar a imagem no Stories, use Baixar capa.";
          return;
        }

        download?.click();
        if (status) status.textContent = "Capa baixada. Abra o Instagram e selecione a imagem no Stories.";
      } catch (error) {
        if (error?.name !== "AbortError" && status) {
          status.textContent = "Não foi possível abrir o compartilhamento. Use Baixar capa para publicar no Stories.";
        } else if (status) {
          status.textContent = "";
        }
      }
    });
  });
}

initReportSharing();

function getReportClientId() {
  try {
    let id = localStorage.getItem(REPORT_CLIENT_KEY);
    if (!id) {
      id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(REPORT_CLIENT_KEY, id);
    }
    return id;
  } catch (error) {
    return `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function reportCommunityRequest(path, options = {}) {
  if (!REPORT_COMMUNITY_API) throw new Error("API comunitária indisponível.");
  const response = await fetch(`${REPORT_COMMUNITY_API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
    ...options
  });
  const payload = await response.json();
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Falha na API comunitária.");
  return payload;
}

function formatReportCommentDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeReportComment(comment) {
  return {
    nome: comment.nome || comment.name || "Visitante",
    texto: comment.texto || comment.text || "",
    data: comment.data || formatReportCommentDate(comment.createdAt)
  };
}

function getReportComments(reportId) {
  return Array.isArray(reportCommentCache[reportId])
    ? reportCommentCache[reportId].map(normalizeReportComment)
    : [];
}

async function loadReportComments(reportId) {
  try {
    const payload = await reportCommunityRequest(`/comments?scope=report&id=${encodeURIComponent(reportId)}`);
    reportCommentCache[reportId] = payload.comments || [];
    return true;
  } catch (error) {
    return false;
  }
}

async function renderReportComments(section, forceOnline = false) {
  const reportId = section.dataset.reportComments;
  const list = section.querySelector(".report-comments-list");
  const loaded = forceOnline ? await loadReportComments(reportId) : true;
  if (!loaded && !Array.isArray(reportCommentCache[reportId])) {
    list.innerHTML = '<span class="report-comments-empty">Não foi possível carregar os comentários globais agora.</span>';
    return;
  }
  const comments = getReportComments(reportId);
  if (!list) return;

  list.innerHTML = comments.length
    ? comments.map(comment => `
      <article class="report-comment">
        <strong>${escapeReportHtml(comment.nome || "Visitante")}</strong>
        <p>${escapeReportHtml(comment.texto)}</p>
        <time>${escapeReportHtml(comment.data)}</time>
      </article>
    `).join("")
    : '<span class="report-comments-empty">Seja o primeiro a comentar esta reportagem.</span>';
}

document.querySelectorAll("[data-report-comments]").forEach(section => {
  const form = section.querySelector(".report-comment-form");
  const feedback = document.createElement("p");
  feedback.className = "report-comment-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  form?.insertAdjacentElement("afterend", feedback);
  renderReportComments(section, true);

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    const reportId = section.dataset.reportComments;
    const formData = new FormData(form);
    const texto = String(formData.get("texto") || "").trim();
    const button = form.querySelector('button[type="submit"]');
    if (!texto) return;
    button.disabled = true;
    button.textContent = "Publicando...";
    feedback.textContent = "";
    try {
      const payload = await reportCommunityRequest("/comment", {
        method: "POST",
        body: JSON.stringify({
          scope: "report",
          id: reportId,
          name: String(formData.get("nome") || "Visitante").trim().slice(0, 40) || "Visitante",
          text: texto.slice(0, 500),
          clientId: getReportClientId()
        })
      });
      reportCommentCache[reportId] = payload.comments || [];
      renderReportComments(section);
      form.reset();
      feedback.textContent = "Comentário publicado para todos os visitantes.";
    } catch (error) {
      feedback.textContent = "Não foi possível salvar globalmente. Tente novamente em alguns instantes.";
    } finally {
      button.disabled = false;
      button.textContent = "Publicar comentário";
    }
  });
});

window.setInterval(() => {
  document.querySelectorAll("[data-report-comments]").forEach(section => renderReportComments(section, true));
}, 15000);
