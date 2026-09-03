(() => {
  'use strict';

  const form = document.getElementById('post-maker-form');
  if (!form) return;
  const field = id => document.getElementById(id);
  const typeLabels = Object.freeze({ training: 'Treino concluído', achievement: 'Conquista', result: 'Resultado', competition: 'Jogo ou competição', return: 'Retorno ao esporte', goal: 'Meta alcançada', photo: 'Momento esportivo' });
  let photoDataUrl = '';

  function safe(value) { return String(value || '').trim(); }

  function resizePhoto(file) {
    if (!/^image\/(?:jpeg|png|webp)$/i.test(file?.type || '')) return Promise.reject(new Error('Escolha uma foto JPG, PNG ou WebP.'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler esta foto.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Esta imagem não pôde ser aberta.'));
        image.onload = () => {
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .86));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function numberLabel(value, suffix) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return '';
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(number)} ${suffix}`;
  }

  function data() {
    return {
      post: {
        id: 'postagem',
        kind: photoDataUrl ? 'photo' : 'text',
        imageDataUrl: photoDataUrl,
        postType: field('post-maker-type').value,
        title: safe(field('post-maker-title').value),
        text: safe(field('post-maker-text').value),
        activity: safe(field('post-maker-sport').value),
        duration: Number(field('post-maker-duration').value) || null,
        distance: Number(field('post-maker-distance').value) || null,
        result: safe(field('post-maker-result').value),
        personalBest: field('post-maker-record').checked
      },
      profile: {
        name: safe(field('post-maker-name').value),
        displayName: safe(field('post-maker-name').value),
        favoriteSport: safe(field('post-maker-sport').value)
      }
    };
  }

  function updatePreview() {
    const current = data();
    const name = current.profile.name || 'Seu nome';
    field('post-maker-preview-name').textContent = name;
    field('post-maker-preview-avatar').textContent = name.charAt(0).toLocaleUpperCase('pt-BR') || 'B';
    field('post-maker-preview-sport').textContent = current.profile.favoriteSport || 'Sua modalidade';
    field('post-maker-preview-type').textContent = (typeLabels[current.post.postType] || 'Momento esportivo').toLocaleUpperCase('pt-BR');
    field('post-maker-preview-heading').textContent = current.post.title || 'Seu título aparece aqui';
    field('post-maker-preview-text').textContent = current.post.text || 'Conte seu momento para visualizar a postagem antes de gerar.';
    field('post-maker-count').textContent = String(field('post-maker-text').value.length);
    const metrics = [numberLabel(current.post.duration, 'min'), numberLabel(current.post.distance, 'km'), current.post.result].filter(Boolean);
    const metricMount = field('post-maker-preview-metrics');
    metricMount.replaceChildren(...metrics.map(value => {
      const item = document.createElement('span');
      item.textContent = value;
      return item;
    }));
    metricMount.hidden = metrics.length === 0;
    field('post-maker-preview-record').hidden = !current.post.personalBest;
  }

  function renderPhoto() {
    field('post-maker-photo-preview').hidden = !photoDataUrl;
    field('post-maker-preview-media').hidden = !photoDataUrl;
    field('post-maker-photo-remove').hidden = !photoDataUrl;
    if (photoDataUrl) {
      field('post-maker-photo-image').src = photoDataUrl;
      field('post-maker-preview-image').src = photoDataUrl;
    } else {
      field('post-maker-photo-image').removeAttribute('src');
      field('post-maker-preview-image').removeAttribute('src');
    }
  }

  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);
  field('post-maker-photo').addEventListener('change', async event => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const feedback = field('post-maker-photo-feedback');
    feedback.textContent = 'Preparando sua foto…';
    try {
      photoDataUrl = await resizePhoto(file);
      renderPhoto();
      feedback.textContent = 'Foto pronta. Ela não foi enviada para nenhum servidor.';
    } catch (error) {
      photoDataUrl = '';
      renderPhoto();
      feedback.textContent = error.message;
    } finally { event.currentTarget.value = ''; }
  });
  field('post-maker-photo-remove').addEventListener('click', () => {
    photoDataUrl = '';
    renderPhoto();
    field('post-maker-photo-feedback').textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const feedback = field('post-maker-feedback');
    if (!form.reportValidity()) return;
    if (!window.BeShareCard) {
      feedback.textContent = 'O gerador ainda está carregando. Tente novamente.';
      return;
    }
    feedback.textContent = '';
    window.BeShareCard.open({ ...data(), onStatus: message => { feedback.textContent = message; } });
  });
  updatePreview();
})();
