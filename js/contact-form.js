const CONTACT_EMAIL = 'bemesportivo@yahoo.com';

function mailtoUrl(data) {
  const subjectLabels = {
    duvida: 'Dúvida', solicitacao: 'Solicitação', pauta: 'Sugestão de pauta',
    correcao: 'Correção de conteúdo', parceria: 'Parceria ou proposta',
    privacidade: 'Privacidade e dados', outro: 'Contato pelo site'
  };
  const subject = subjectLabels[data.subject] || subjectLabels.outro;
  const body = [`Nome: ${data.name || 'Não informado'}`, `E-mail: ${data.email}`, '', data.message].join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[Bem Esportivo] ${subject}`)}&body=${encodeURIComponent(body)}`;
}

function setStatus(form, message, state) {
  const status = document.getElementById(form.getAttribute('aria-describedby'))
    || form.parentElement?.querySelector('[data-contact-status]');
  if (!status) return;
  status.hidden = false;
  status.dataset.state = state;
  status.textContent = message;
  status.focus({ preventScroll: true });
}

document.querySelectorAll('[data-contact-form]').forEach(form => {
  const startedAt = Date.now();
  const subjectFromUrl = new URLSearchParams(location.search).get('assunto');
  const subjectField = form.elements.subject;
  if (subjectFromUrl && subjectField && [...subjectField.options].some(option => option.value === subjectFromUrl)) {
    subjectField.value = subjectFromUrl;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const data = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || 'outro'),
      message: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || ''),
      source: form.dataset.contactSource || location.pathname,
      startedAt
    };
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando…';
    }
    setStatus(form, 'Enviando sua mensagem…', 'loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        if (payload.fallbackEmail || response.status === 404 || response.status === 503) {
          setStatus(form, `O envio automático não está disponível. Abrimos seu aplicativo de e-mail para enviar a ${CONTACT_EMAIL}.`, 'fallback');
          location.href = mailtoUrl(data);
          return;
        }
        throw new Error(payload.error || 'Não foi possível enviar sua mensagem.');
      }
      form.reset();
      setStatus(form, 'Mensagem enviada. Responderemos pelo e-mail informado.', 'success');
    } catch (error) {
      setStatus(form, error.message || 'Não foi possível enviar agora. Tente novamente.', 'error');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  });
});
