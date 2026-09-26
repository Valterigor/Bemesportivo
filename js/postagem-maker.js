(() => {
  'use strict';

  const form = document.getElementById('post-maker-form');
  if (!form) return;
  const field = id => document.getElementById(id);
  const typeLabels = Object.freeze({ training: 'Treino concluído', achievement: 'Conquista', result: 'Resultado', competition: 'Jogo ou competição', return: 'Retorno ao esporte', goal: 'Meta alcançada', photo: 'Momento esportivo' });
  let photoDataUrl = '';
  let avatarDataUrl = '';
  let previewTimer;
  let previewVersion = 0;
  let previewUrl = '';

  function renderSocialPreview() {
    const version = ++previewVersion;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      try {
        const current = data();
        current.profile.name ||= 'Seu nome';
        current.post.title ||= 'Seu momento no esporte';
        current.post.text ||= 'Conte sua história, adicione uma foto e leve esse momento para as redes.';
        const file = await window.BeSocialCard.build({ ...current, format: field('post-maker-format').value });
        if (version !== previewVersion) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
        field('post-maker-social-preview').src = previewUrl;
        field('post-maker-preview-status').textContent = '';
      } catch (error) {
        if (version === previewVersion) field('post-maker-preview-status').textContent = error.message;
      }
    }, 180);
  }

  function safe(value) { return String(value || '').trim(); }

  function resizePhoto(file) {
    if (file?.size > 15 * 1024 * 1024) return Promise.reject(new Error('Escolha uma imagem de até 15 MB.'));
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
        photoDataUrl: avatarDataUrl,
        handle: safe(field('post-maker-handle').value),
        name: safe(field('post-maker-name').value),
        displayName: safe(field('post-maker-name').value),
        favoriteSport: safe(field('post-maker-sport').value)
      }
    };
  }

  function updatePreview() {
    renderSocialPreview();
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
    renderSocialPreview();
    const photoPreview = field('post-maker-photo-preview');
    const cardPreview = field('post-maker-preview-media');
    photoPreview.hidden = !photoDataUrl;
    cardPreview.hidden = !photoDataUrl;
    field('post-maker-photo-remove').hidden = !photoDataUrl;
    if (photoDataUrl) {
      const photoBackdrop = `linear-gradient(rgba(30,18,13,.38),rgba(83,31,12,.28)),url("${photoDataUrl}")`;
      photoPreview.style.backgroundImage = photoBackdrop;
      cardPreview.style.backgroundImage = photoBackdrop;
      field('post-maker-photo-image').src = photoDataUrl;
      field('post-maker-preview-image').src = photoDataUrl;
    } else {
      photoPreview.style.removeProperty('background-image');
      cardPreview.style.removeProperty('background-image');
      field('post-maker-photo-image').removeAttribute('src');
      field('post-maker-preview-image').removeAttribute('src');
    }
  }

  form.addEventListener('input', updatePreview);
  field('post-maker-format').addEventListener('change', () => {
    document.querySelector('.be-maker-preview-column > header > small').textContent = field('post-maker-format').value === 'story' ? 'Formato 9:16' : 'Formato 4:5';
  });
  field('post-maker-avatar').addEventListener('change', async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      avatarDataUrl = await resizePhoto(file);
      field('post-maker-avatar-remove').hidden = false;
      field('post-maker-avatar-feedback').textContent = 'Foto de perfil pronta.';
      renderSocialPreview();
    } catch (error) { field('post-maker-avatar-feedback').textContent = error.message; }
    finally { input.value = ''; }
  });
  field('post-maker-avatar-remove').addEventListener('click', () => {
    avatarDataUrl = '';
    field('post-maker-avatar-remove').hidden = true;
    field('post-maker-avatar-feedback').textContent = '';
    renderSocialPreview();
  });
  form.addEventListener('change', updatePreview);
  field('post-maker-photo').addEventListener('change', async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
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
    } finally { input.value = ''; }
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
    window.BeShareCard.open({ ...data(), variant: 'social', onStatus: message => { feedback.textContent = message; } });
  });
  updatePreview();
})();
