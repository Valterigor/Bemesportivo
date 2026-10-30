(() => {
  let state = {comments:[]};
  try { state = {...state, ...JSON.parse(localStorage.getItem('bemEsportivoFalaBemSelecaoV1') || '{}')}; } catch {}
  if (!Array.isArray(state.comments)) state.comments = [];
  const renderComments = () => {
    const history = document.querySelector('#legacy-opinion-comments');
    if (!history || !state.comments.length) return;
    history.hidden = false;
    const list = history.querySelector('div'); list.replaceChildren();
    state.comments.forEach(comment => { const item = document.createElement('p'); const name = document.createElement('strong'); name.textContent = comment.name + ': '; item.append(name, document.createTextNode(comment.text)); list.append(item); });
  };
  renderComments();
})();
