(function(){
  function showToast(message){
    const toast = document.querySelector('[data-kobem-toast]');
    if(!toast) return alert(message);
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function bindRegister(){
    const form = document.getElementById('kobemRegisterForm');
    if(!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try{
        if(String(data.password || '').length < 6) throw new Error('Use uma senha com pelo menos 6 caracteres.');
        KOBEM.registerUser(data);
        showToast('Cadastro criado. Bem-vindo ao KOBEM Performance.');
        setTimeout(() => location.href = 'dashboard.html', 500);
      }catch(error){
        showToast(error.message);
      }
    });
  }

  function bindLogin(){
    const form = document.getElementById('kobemLoginForm');
    if(!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try{
        KOBEM.login(data.email, data.password);
        showToast('Login realizado.');
        setTimeout(() => location.href = 'dashboard.html', 400);
      }catch(error){
        showToast(error.message);
      }
    });
  }

  function bindPremiumButtons(){
    document.querySelectorAll('[data-kobem-premium]').forEach(button => {
      button.addEventListener('click', () => {
        const user = KOBEM.getCurrentUser();
        if(!user){
          location.href = 'cadastro.html?premium=1';
          return;
        }
        KOBEM.updateUser(user.id, {plan:'premium'});
        showToast('Premium ativado no MVP. Futuramente entraremos com pagamento real.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindRegister();
    bindLogin();
    bindPremiumButtons();
  });
})();
