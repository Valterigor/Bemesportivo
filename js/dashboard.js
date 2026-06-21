(function(){
  let currentUser = null;

  function moneyPlan(user){
    return user?.plan === 'premium' ? 'Premium' : 'Gratuito';
  }

  function fmt(value, digits = 1){
    return Number(value || 0).toLocaleString('pt-BR', {maximumFractionDigits:digits});
  }

  function toast(message){
    const node = document.querySelector('[data-kobem-toast]');
    if(!node) return;
    node.textContent = message;
    node.classList.add('show');
    setTimeout(() => node.classList.remove('show'), 2600);
  }

  function setText(selector, text){
    const node = document.querySelector(selector);
    if(node) node.textContent = text;
  }

  function renderKpis(stats){
    setText('[data-user-name]', stats.user.name);
    setText('[data-user-plan]', moneyPlan(stats.user));
    setText('[data-coach-message]', KOBEM.coachMessage(stats.user.id));
    setText('[data-main-goal]', stats.user.mainGoal || 'Evoluir com consistência');
    setText('[data-week-progress]', `${stats.report.weekScore}/100`);
    setText('[data-current-weight]', stats.report.currentWeight ? `${fmt(stats.report.currentWeight)} kg` : `${fmt(stats.user.initialWeight)} kg`);
    setText('[data-total-activities]', stats.totalActivities);
    setText('[data-avg-water]', `${fmt(stats.avgWater)} L`);
    setText('[data-avg-sleep]', `${fmt(stats.avgSleep)} h`);
    setText('[data-streak]', `${stats.streak} dias`);
    setText('[data-xp]', `${stats.xp} XP`);
    setText('[data-level]', stats.level);
    const progress = document.querySelector('[data-week-progress-bar]');
    if(progress) progress.style.width = `${Math.min(100, stats.report.weekScore)}%`;
  }

  function renderCheckinTable(checkins){
    const body = document.querySelector('[data-checkin-table]');
    if(!body) return;
    const rows = [...checkins].reverse().slice(0, 30);
    body.innerHTML = rows.length ? rows.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${fmt(item.weight)} kg</td>
        <td>${fmt(item.water)} L</td>
        <td>${fmt(item.sleep)} h</td>
        <td>${item.activity || '-'}</td>
        <td>${fmt(item.duration,0)} min</td>
        <td>${fmt(item.distance)} km</td>
      </tr>
    `).join('') : '<tr><td colspan="7">Nenhum check-in registrado ainda.</td></tr>';
  }

  function renderGoals(goals, stats){
    const list = document.querySelector('[data-goal-list]');
    if(!list) return;
    list.innerHTML = goals.length ? goals.map(goal => {
      const progress = KOBEM.goalProgress(goal, stats.report, stats.checkins);
      return `
      <div class="kobem-goal">
        <strong>${goal.title}</strong>
        <small>${fmt(progress.current)} de ${fmt(progress.target)} ${progress.label} nesta semana</small>
        <span class="kobem-progress"><i style="width:${progress.percent}%"></i></span>
        <small>${progress.done ? 'Meta concluída. Excelente consistência.' : `${progress.percent}% concluído`}</small>
        <button class="kobem-btn ghost" type="button" data-remove-goal="${goal.id}">Remover</button>
      </div>
    `;
    }).join('') : '<div class="kobem-empty">Crie sua primeira meta para guiar a semana.</div>';
    list.querySelectorAll('[data-remove-goal]').forEach(button => {
      button.addEventListener('click', () => {
        KOBEM.removeGoal(button.dataset.removeGoal);
        renderAll();
      });
    });
  }

  function renderReport(report){
    setText('[data-report-weight]', `${report.weightChange > 0 ? '+' : ''}${fmt(report.weightChange)} kg`);
    setText('[data-report-workouts]', report.totalWorkouts);
    setText('[data-report-distance]', `${fmt(report.distance)} km`);
    setText('[data-report-water]', `${fmt(report.avgWater)} L`);
    setText('[data-report-sleep]', `${fmt(report.avgSleep)} h`);
    setText('[data-report-compare]', `${report.workoutDelta >= 0 ? '+' : ''}${report.workoutDelta} treinos`);
    setText('[data-report-score]', `${report.weekScore}/100`);
    setText('[data-report-message]', report.message);
  }

  function renderNotifications(userId){
    const list = document.querySelector('[data-alert-list]');
    if(!list) return;
    const notes = KOBEM.notifications(userId);
    list.innerHTML = notes.length ? notes.map(note => `
      <div class="kobem-alert">
        <strong>${note[0]}</strong>
        <small>${note[1]}</small>
      </div>
    `).join('') : '<div class="kobem-empty">Sem alertas agora. Siga registrando.</div>';
  }

  function renderBadges(badges){
    const list = document.querySelector('[data-badge-list]');
    if(!list) return;
    list.innerHTML = badges.length ? badges.map(badge => `
      <div class="kobem-badge">
        <strong>${badge[0]}</strong>
        <small>${badge[1]}</small>
      </div>
    `).join('') : '<div class="kobem-empty">As medalhas aparecem conforme sua consistência cresce.</div>';
  }

  function chartValues(checkins, key, selector, suffix = ''){
    const chart = document.querySelector(selector);
    if(!chart) return;
    const values = checkins.slice(-7).map(item => Number(item[key] || 0));
    const max = Math.max(...values, 1);
    chart.innerHTML = values.length ? values.map((value, index) => `
      <i class="kobem-bar" style="height:${Math.max(6,(value / max) * 100)}%" title="${fmt(value)}${suffix}">
        <span>${index + 1}</span>
      </i>
    `).join('') : '<div class="kobem-empty">Sem dados para este gráfico.</div>';
  }

  function renderCharts(checkins){
    chartValues(checkins, 'weight', '[data-chart-weight]', ' kg');
    chartValues(checkins, 'water', '[data-chart-water]', ' L');
    chartValues(checkins, 'sleep', '[data-chart-sleep]', ' h');
    chartValues(checkins, 'duration', '[data-chart-activity]', ' min');
    chartValues(checkins, 'distance', '[data-chart-distance]', ' km');
  }

  function renderPremium(user){
    document.querySelectorAll('[data-premium-state]').forEach(node => {
      node.hidden = user.plan === 'premium';
    });
    document.querySelectorAll('[data-premium-open]').forEach(node => {
      node.hidden = user.plan !== 'premium';
    });
  }

  function renderAll(){
    currentUser = KOBEM.requireAuth();
    if(!currentUser) return;
    const stats = KOBEM.dashboardStats(currentUser.id);
    renderKpis(stats);
    renderCheckinTable(stats.checkins);
    renderGoals(stats.goals, stats);
    renderReport(stats.report);
    renderNotifications(currentUser.id);
    renderBadges(stats.badges);
    renderCharts(stats.checkins);
    renderPremium(stats.user);
  }

  function bindTabs(){
    document.querySelectorAll('[data-kobem-tab]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-kobem-tab]').forEach(tab => tab.classList.remove('is-active'));
        document.querySelectorAll('[data-kobem-view]').forEach(view => view.classList.remove('is-active'));
        button.classList.add('is-active');
        document.querySelector(`[data-kobem-view="${button.dataset.kobemTab}"]`)?.classList.add('is-active');
      });
    });
  }

  function bindCheckin(){
    const form = document.getElementById('kobemCheckinForm');
    if(!form) return;
    form.querySelector('[name="date"]').value = KOBEM.todayKey();
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      KOBEM.saveCheckin(currentUser.id, data);
      toast('Check-in salvo. O KOBEM atualizou seu progresso da semana.');
      form.querySelector('[name="date"]').value = KOBEM.todayKey();
      renderAll();
    });
  }

  function bindGoals(){
    const form = document.getElementById('kobemGoalForm');
    if(!form) return;
    const defaults = {
      weight_loss: ['2', 'kg'],
      walk_more: ['10', 'km'],
      sleep_better: ['7', 'h/noite'],
      water_more: ['2', 'L/dia'],
      train_more: ['3', 'treinos'],
      conditioning: ['80', 'pts']
    };
    const type = form.querySelector('[name="type"]');
    const target = form.querySelector('[name="target"]');
    const unit = form.querySelector('[name="unit"]');
    function applyGoalDefault(){
      const preset = defaults[type.value];
      if(!preset) return;
      target.value = preset[0];
      unit.value = preset[1];
    }
    type?.addEventListener('change', applyGoalDefault);
    applyGoalDefault();
    form.addEventListener('submit', event => {
      event.preventDefault();
      try{
        const data = Object.fromEntries(new FormData(form).entries());
        KOBEM.saveGoal(currentUser.id, data);
        form.reset();
        toast('Meta criada.');
        renderAll();
      }catch(error){
        toast(error.message);
      }
    });
  }

  function bindPremium(){
    document.querySelectorAll('[data-upgrade-premium]').forEach(button => {
      button.addEventListener('click', () => {
        KOBEM.updateUser(currentUser.id, {plan:'premium'});
        toast('Premium ativado no MVP.');
        renderAll();
      });
    });
  }

  function bindLogout(){
    document.querySelectorAll('[data-kobem-logout]').forEach(button => {
      button.addEventListener('click', () => {
        KOBEM.clearSession();
        location.href = 'login.html';
      });
    });
  }

  function renderAdmin(){
    const adminRoot = document.querySelector('[data-admin-root]');
    if(!adminRoot) return;
    const stats = KOBEM.adminStats();
    setText('[data-admin-users]', stats.users);
    setText('[data-admin-active]', stats.activeUsers);
    setText('[data-admin-checkins]', stats.checkins);
    setText('[data-admin-premium]', stats.premium);
    const messages = document.querySelector('[data-admin-messages]');
    if(messages) messages.innerHTML = stats.messages.map(item => `<div class="kobem-alert"><small>${item}</small></div>`).join('');
    const challenges = document.querySelector('[data-admin-challenges]');
    if(challenges) challenges.innerHTML = stats.challenges.map(item => `<div class="kobem-goal"><strong>${item.title}</strong><small>${item.text}</small></div>`).join('');
  }

  function bindAdmin(){
    const messageForm = document.getElementById('kobemAdminMessageForm');
    if(messageForm){
      messageForm.addEventListener('submit', event => {
        event.preventDefault();
        KOBEM.addMessage(new FormData(messageForm).get('message'));
        messageForm.reset();
        renderAdmin();
      });
    }
    const challengeForm = document.getElementById('kobemAdminChallengeForm');
    if(challengeForm){
      challengeForm.addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(challengeForm).entries());
        KOBEM.addChallenge(data.title, data.text);
        challengeForm.reset();
        renderAdmin();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if(document.querySelector('[data-dashboard-root]')){
      renderAll();
      bindTabs();
      bindCheckin();
      bindGoals();
      bindPremium();
      bindLogout();
    }
    if(document.querySelector('[data-admin-root]')){
      renderAdmin();
      bindAdmin();
    }
  });
})();
