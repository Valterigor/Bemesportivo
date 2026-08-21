const FEATURE_LIMIT = 3;

function absoluteSitePath(value) {
  if (!value) return "";
  try {
    return new URL(value, `${location.origin}/`).href;
  } catch {
    return value;
  }
}

function reportIdFromPath(value) {
  try {
    return new URL(value, location.origin).pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}

function existingCardDetails(grid) {
  return new Map([...grid.querySelectorAll(".home-editorial-card")].map(card => [
    card.dataset.reportId || reportIdFromPath(card.getAttribute("href")),
    card.querySelector("small")?.childNodes[0]?.textContent?.trim() || ""
  ]));
}

function reportFromPreview(preview, sourceUrl, detailsById) {
  const titleLink = preview.querySelector(":is(h2, h3) a");
  const media = preview.querySelector(".report-preview-media img");
  if (!titleLink || !media) return null;

  const href = absoluteSitePath(titleLink.getAttribute("href"));
  const id = reportIdFromPath(href);
  const metaText = preview.querySelector(".report-preview-meta")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const readingTime = metaText.match(/\d+\s+min(?:uto)?s? de leitura/i)?.[0]
    || detailsById.get(id)
    || "Ler reportagem";
  const summary = [...preview.querySelectorAll(".report-preview-body > p")]
    .find(paragraph => !paragraph.classList.contains("report-preview-meta"))?.textContent?.trim() || "";

  return {
    id,
    href,
    title: titleLink.textContent.trim(),
    category: preview.querySelector(".report-category")?.textContent?.trim() || "Reportagem",
    summary,
    readingTime,
    image: {
      src: new URL(media.getAttribute("src"), sourceUrl).href,
      alt: media.getAttribute("alt") || "",
      width: media.getAttribute("width") || "640",
      height: media.getAttribute("height") || "400"
    }
  };
}

function createCard(report, index, total) {
  const card = document.createElement("a");
  card.className = `home-editorial-card${index === 0 ? " home-editorial-card-lead" : ""}`;
  card.href = report.href;
  card.dataset.reportId = report.id;
  card.dataset.inclusionOrder = String(total - index);

  const image = document.createElement("img");
  image.src = report.image.src;
  image.alt = report.image.alt;
  image.width = Number(report.image.width) || 640;
  image.height = Number(report.image.height) || 400;
  image.decoding = "async";
  if (index === 0) image.fetchPriority = "high";
  else image.loading = "lazy";

  const category = document.createElement("span");
  category.className = "home-editorial-category";
  category.textContent = report.category;

  const title = document.createElement("h3");
  title.textContent = report.title;

  const summary = document.createElement("p");
  summary.textContent = report.summary;

  const detail = document.createElement("small");
  detail.append(document.createTextNode(report.readingTime));
  const arrow = document.createElement("b");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  detail.append(arrow);

  card.append(image, category, title, summary, detail);
  return card;
}

async function syncLatestReports() {
  const grid = document.querySelector("[data-latest-reports-source]");
  if (!grid || location.protocol === "file:") return;

  const sourceUrl = new URL(grid.dataset.latestReportsSource || "/reportagens", location.origin);
  const detailsById = existingCardDetails(grid);
  grid.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(sourceUrl, {
      headers: { Accept: "text/html" },
      credentials: "same-origin",
      cache: "no-cache"
    });
    if (!response.ok) throw new Error(`Reportagens indisponíveis (${response.status})`);

    const documentSource = new DOMParser().parseFromString(await response.text(), "text/html");
    const previews = [...documentSource.querySelectorAll(".report-listing .report-preview")];
    const reports = previews
      .map(preview => reportFromPreview(preview, sourceUrl, detailsById))
      .filter(Boolean)
      .slice(0, FEATURE_LIMIT);
    if (reports.length !== FEATURE_LIMIT) throw new Error("Lista de reportagens incompleta");

    const cards = reports.map((report, index) => createCard(report, index, previews.length));
    grid.replaceChildren(...cards);
    grid.dataset.syncState = "ready";
  } catch {
    grid.dataset.syncState = "fallback";
  } finally {
    grid.removeAttribute("aria-busy");
  }
}

syncLatestReports();
