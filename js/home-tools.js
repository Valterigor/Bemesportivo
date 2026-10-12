const toolsList = document.getElementById('home-tools-list');
if (toolsList) {
  let drag = null;
  let suppressClick = false;
  toolsList.addEventListener('dragstart', event => event.preventDefault());
  toolsList.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, left: toolsList.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 6) return;
    drag.moved = true;
    toolsList.classList.add('is-dragging');
    toolsList.setPointerCapture(event.pointerId);
    toolsList.scrollLeft = drag.left - delta;
    event.preventDefault();
  });
  const endDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    drag = null;
    toolsList.classList.remove('is-dragging');
    if (toolsList.hasPointerCapture(event.pointerId)) toolsList.releasePointerCapture(event.pointerId);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  toolsList.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);
}
// Keep static and dynamically generated search links on the home page.
document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (link.dataset.tool) {
    event.preventDefault();
    return;
  }
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.searchParams.get('tela') !== 'ferramentas' && url.pathname !== '/meu-caminho-be/ferramentas') return;
  event.preventDefault();
  const tool = url.searchParams.get('ferramenta');
  if (tool) window.BeTools.open(tool);
  else document.getElementById('ferramentas').scrollIntoView({ behavior: 'smooth' });
});
