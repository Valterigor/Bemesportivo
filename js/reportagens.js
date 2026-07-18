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

function initReportSharing() {
  document.querySelectorAll("[data-report-share]").forEach(section => {
    const reportId = section.dataset.reportId || "";
    const title = section.dataset.shareTitle || document.title;
    const coverPath = section.dataset.shareCover || "";
    const articleUrl = new URL("/reportagens", location.origin);
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

    const coverFilePromise = coverPath
      ? fetch(new URL(coverPath, location.href))
          .then(response => {
            if (!response.ok) throw new Error("Capa indisponível");
            return response.blob();
          })
          .then(blob => new File([blob], "treino-funcional-bem-esportivo.jpg", {
            type: blob.type || "image/jpeg"
          }))
          .catch(() => null)
      : Promise.resolve(null);

    coverButton?.addEventListener("click", async () => {
      if (status) status.textContent = "Preparando a capa...";
      const coverFile = await coverFilePromise;

      try {
        if (coverFile && navigator.share && navigator.canShare?.({ files: [coverFile] })) {
          await navigator.share({
            files: [coverFile],
            title,
            text: `${shareText}\n${shareUrl}`
          });
          if (status) status.textContent = "Capa compartilhada.";
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
  try {
    if (Array.isArray(reportCommentCache[reportId])) {
      return reportCommentCache[reportId].map(normalizeReportComment);
    }
    const comments = JSON.parse(localStorage.getItem(`bemEsportivoReportComments:${reportId}`) || "[]");
    return Array.isArray(comments) ? comments : [];
  } catch (error) {
    return [];
  }
}

function saveReportComments(reportId, comments) {
  localStorage.setItem(`bemEsportivoReportComments:${reportId}`, JSON.stringify(comments.slice(-50)));
}

async function loadReportComments(reportId) {
  try {
    const payload = await reportCommunityRequest(`/comments?scope=report&id=${encodeURIComponent(reportId)}`);
    reportCommentCache[reportId] = payload.comments || [];
  } catch (error) {}
}

async function renderReportComments(section, forceOnline = false) {
  const reportId = section.dataset.reportComments;
  const list = section.querySelector(".report-comments-list");
  if (forceOnline) await loadReportComments(reportId);
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
  renderReportComments(section, true);

  form?.addEventListener("submit", event => {
    event.preventDefault();
    const reportId = section.dataset.reportComments;
    const formData = new FormData(form);
    const texto = String(formData.get("texto") || "").trim();
    if (!texto) return;

    const comments = getReportComments(reportId);
    comments.push({
      nome: String(formData.get("nome") || "Visitante").trim().slice(0, 40) || "Visitante",
      texto: texto.slice(0, 500),
      data: new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    saveReportComments(reportId, comments);
    reportCommunityRequest("/comment", {
      method: "POST",
      body: JSON.stringify({
        scope: "report",
        id: reportId,
        name: String(formData.get("nome") || "Visitante").trim().slice(0, 40) || "Visitante",
        text: texto.slice(0, 500),
        clientId: getReportClientId()
      })
    }).then(payload => {
      reportCommentCache[reportId] = payload.comments || [];
      renderReportComments(section);
    }).catch(error => console.warn("Comentário salvo localmente:", error));
    form.reset();
    renderReportComments(section);
  });
});

window.setInterval(() => {
  document.querySelectorAll("[data-report-comments]").forEach(section => renderReportComments(section, true));
}, 15000);
