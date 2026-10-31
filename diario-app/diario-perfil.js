(() => {
  'use strict';
  const KEY = 'meuCaminhoBeProfileV1';
  const $ = id => document.getElementById(id);
  let photo = '';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const renderPhoto = () => {
    const image = $('profile-photo-preview');
    image.hidden = !photo;
    $('profile-photo-fallback').hidden = Boolean(photo);
    $('profile-photo-remove').hidden = !photo;
    if (photo) image.src = photo; else image.removeAttribute('src');
  };
  const load = () => {
    const profile = read();
    $('profile-name').value = String(profile.name || '');
    $('profile-story').value = String(profile.story || '');
    photo = /^data:image\/(jpeg|png|webp);base64,/i.test(profile.photoDataUrl || '') ? profile.photoDataUrl : '';
    renderPhoto();
  };
  const imageFrom = file => new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/') || file.size > 8 * 1024 * 1024) return reject(new Error('Escolha uma foto de até 8 MB.'));
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir esta foto.')); };
    image.src = url;
  });
  $('profile-photo').addEventListener('change', async event => {
    try {
      const { image, url } = await imageFrom(event.target.files[0]);
      const size = Math.min(image.naturalWidth, image.naturalHeight), x = (image.naturalWidth - size) / 2, y = (image.naturalHeight - size) / 2;
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 480;
      canvas.getContext('2d').drawImage(image, x, y, size, size, 0, 0, 480, 480);
      URL.revokeObjectURL(url); photo = canvas.toDataURL('image/jpeg', .86); renderPhoto();
    } catch (error) { event.target.value = ''; alert(error.message); }
  });
  $('profile-photo-remove').addEventListener('click', () => { photo = ''; $('profile-photo').value = ''; renderPhoto(); });
  $('profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('profile-name').value.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!name) { $('profile-name').reportValidity(); return; }
    const previous = read(), now = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify({ ...previous, name, story: $('profile-story').value.trim().slice(0, 1000), photoDataUrl: photo, createdAt: previous.createdAt || now, identityCreatedAt: previous.identityCreatedAt || now, updatedAt: now }));
    window.dispatchEvent(new CustomEvent('diary:profile-updated'));
    const status = document.getElementById('status'); status.textContent = 'Seu perfil foi salvo neste aparelho.'; setTimeout(() => { if (status.textContent.includes('perfil')) status.textContent = ''; }, 5000);
  });
  load();
})();
