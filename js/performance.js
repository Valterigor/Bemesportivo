(function(){
  const STORAGE_KEY = 'kobemPerformanceStateV1';
  const SESSION_KEY = 'kobemPerformanceSessionV1';

  // MVP storage adapter: today this is localStorage; later, these methods can be
  // replaced by Firebase reads/writes without changing the page controllers.
  const defaultState = {
    schemaVersion: 1,
    users: [],
    checkins: [],
    goals: [],
    messages: [
      'Hoje não precisa ser perfeito. Precisa ser registrado.',
      'O KOBEM viu seu esforço: consistência vence intensidade isolada.',
      'Hidrate, respire e volte para o jogo amanhã.',
      'Seu corpo responde melhor quando você acompanha os sinais.'
    ],
    challenges: [
      {id:'water-week', title:'Hidratação em dia', text:'Beba pelo menos 2 litros de água em 5 dias da semana.'},
      {id:'move-week', title:'Semana em movimento', text:'Registre 4 atividades nesta semana.'}
    ]
  };

  const goalLabels = {
    weight_loss: 'Perder peso',
    walk_more: 'Caminhar mais',
    sleep_better: 'Melhorar sono',
    water_more: 'Beber mais água',
    train_more: 'Treinar mais vezes por semana',
    conditioning: 'Ganhar condicionamento'
  };

  const levelNames = ['Iniciante','Ativo','Atleta Bem Esportivo','Elite','Lenda Bem Esportivo'];

  function uid(prefix = 'kobem'){
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function todayKey(date = new Date()){
    return date.toISOString().slice(0,10);
  }

  function readState(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {...defaultState, ...parsed};
    }catch(error){
      return {...defaultState};
    }
  }

  function writeState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify({...state, updatedAt:new Date().toISOString()}));
  }

  function getSession(){
    try{
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    }catch(error){
      return null;
    }
  }

  function setSession(userId){
    localStorage.setItem(SESSION_KEY, JSON.stringify({userId, startedAt:new Date().toISOString()}));
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentUser(){
    const session = getSession();
    if(!session?.userId) return null;
    return readState().users.find(user => user.id === session.userId) || null;
  }

  function requireAuth(){
    const user = getCurrentUser();
    if(!user){
      location.href = 'login.html';
      return null;
    }
    return user;
  }

  function sanitize(value, limit = 160){
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0, limit);
  }

  function number(value, fallback = 0){
    const parsed = Number(String(value || '').replace(',','.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function positiveNumber(value, fallback = 0){
    return Math.max(0, number(value, fallback));
  }

  function registerUser(data){
    const state = readState();
    const email = sanitize(data.email, 120).toLowerCase();
    if(state.users.some(user => user.email === email)){
      throw new Error('Este e-mail já está cadastrado.');
    }
    const user = {
      id: uid('user'),
      name: sanitize(data.name, 80),
      email,
      password: String(data.password || ''),
      age: positiveNumber(data.age),
      initialWeight: positiveNumber(data.initialWeight),
      height: positiveNumber(data.height),
      mainGoal: sanitize(data.mainGoal, 80),
      plan: 'free',
      createdAt: new Date().toISOString()
    };
    state.users.push(user);
    state.goals.push({
      id: uid('goal'),
      userId: user.id,
      type: 'train_more',
      title: 'Treinar 3 vezes por semana',
      target: 3,
      unit: 'treinos',
      createdAt: new Date().toISOString()
    });
    writeState(state);
    setSession(user.id);
    return user;
  }

  function login(email, password){
    const state = readState();
    const user = state.users.find(item => item.email === sanitize(email,120).toLowerCase() && item.password === String(password || ''));
    if(!user) throw new Error('E-mail ou senha inválidos.');
    setSession(user.id);
    return user;
  }

  function updateUser(userId, patch){
    const state = readState();
    const user = state.users.find(item => item.id === userId);
    if(!user) return null;
    Object.assign(user, patch);
    writeState(state);
    return user;
  }

  function userCheckins(userId){
    return readState().checkins
      .filter(item => item.userId === userId)
      .sort((a,b) => a.date.localeCompare(b.date));
  }

  function userGoals(userId){
    return readState().goals.filter(item => item.userId === userId);
  }

  function saveCheckin(userId, data){
    const state = readState();
    const date = data.date || todayKey();
    const existing = state.checkins.find(item => item.userId === userId && item.date === date);
    const record = {
      id: existing?.id || uid('checkin'),
      userId,
      date,
      weight: positiveNumber(data.weight),
      water: positiveNumber(data.water),
      sleep: positiveNumber(data.sleep),
      activity: sanitize(data.activity, 40),
      duration: positiveNumber(data.duration),
      distance: positiveNumber(data.distance),
      mood: sanitize(data.mood, 40),
      notes: sanitize(data.notes, 500),
      updatedAt: new Date().toISOString()
    };
    if(existing){
      Object.assign(existing, record);
    }else{
      state.checkins.push(record);
    }
    writeState(state);
    return record;
  }

  function saveGoal(userId, data){
    const state = readState();
    const plan = state.users.find(user => user.id === userId)?.plan || 'free';
    const goals = state.goals.filter(goal => goal.userId === userId);
    if(plan !== 'premium' && goals.length >= 1){
      throw new Error('O plano gratuito permite 1 meta ativa. Faça upgrade para metas ilimitadas.');
    }
    const goal = {
      id: uid('goal'),
      userId,
      type: sanitize(data.type, 40),
      title: goalLabels[data.type] || sanitize(data.title, 90),
      target: positiveNumber(data.target, 1) || 1,
      unit: sanitize(data.unit, 30),
      createdAt: new Date().toISOString()
    };
    state.goals.push(goal);
    writeState(state);
    return goal;
  }

  function removeGoal(goalId){
    const state = readState();
    state.goals = state.goals.filter(goal => goal.id !== goalId);
    writeState(state);
  }

  function lastDays(days){
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    return {start:todayKey(start), end:todayKey(today)};
  }

  function inRange(checkin, range){
    return checkin.date >= range.start && checkin.date <= range.end;
  }

  function average(values){
    const valid = values.filter(value => Number.isFinite(value) && value > 0);
    if(!valid.length) return 0;
    return valid.reduce((sum,value)=>sum+value,0) / valid.length;
  }

  function activeStreak(checkins){
    const activeDates = new Set(checkins.filter(item => item.duration > 0 || item.distance > 0).map(item => item.date));
    let streak = 0;
    const cursor = new Date();
    while(activeDates.has(todayKey(cursor))){
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function calcXp(checkins, goals = []){
    const activityXp = checkins.reduce((sum,item)=>sum + (item.duration > 0 ? 18 : 0) + Math.round(item.distance * 3) + (item.water >= 2 ? 6 : 0) + (item.sleep >= 7 ? 6 : 0), 0);
    return activityXp + goals.length * 25;
  }

  function getLevel(xp){
    if(xp >= 1500) return levelNames[4];
    if(xp >= 900) return levelNames[3];
    if(xp >= 450) return levelNames[2];
    if(xp >= 150) return levelNames[1];
    return levelNames[0];
  }

  function getBadges(checkins, report){
    const badges = [];
    if(checkins.length) badges.push(['Primeiro check-in','Você começou a jornada com o KOBEM.']);
    if(activeStreak(checkins) >= 7) badges.push(['7 dias ativos','Sequência forte de presença diária.']);
    if(checkins.reduce((sum,item)=>sum + item.distance,0) >= 10) badges.push(['Primeiros 10 km','Distância acumulada entrando no jogo.']);
    if(report.weekScore >= 80) badges.push(['Meta semanal concluída','Sua semana ficou acima da meta.']);
    if(report.avgSleep >= 7) badges.push(['Sono em evolução','Recuperação em bom ritmo.']);
    if(report.avgWater >= 2) badges.push(['Hidratação em dia','Média de água saudável na semana.']);
    return badges;
  }

  function goalProgress(goal, report, checkins = []){
    const target = Math.max(positiveNumber(goal.target, 1), 1);
    let current = 0;
    let label = goal.unit || '';
    if(goal.type === 'train_more'){
      current = report.totalWorkouts;
      label = goal.unit || 'treinos';
    }else if(goal.type === 'walk_more'){
      current = report.distance;
      label = goal.unit || 'km';
    }else if(goal.type === 'water_more'){
      current = report.avgWater;
      label = goal.unit || 'L/dia';
    }else if(goal.type === 'sleep_better'){
      current = report.avgSleep;
      label = goal.unit || 'h/noite';
    }else if(goal.type === 'weight_loss'){
      const firstWeight = checkins.find(item => item.weight > 0)?.weight || 0;
      const lastWeight = [...checkins].reverse().find(item => item.weight > 0)?.weight || 0;
      current = firstWeight && lastWeight ? Math.max(0, firstWeight - lastWeight) : 0;
      label = goal.unit || 'kg';
    }else if(goal.type === 'conditioning'){
      current = Math.round((report.totalWorkouts * 12) + Math.min(report.distance * 2, 28) + (report.avgSleep >= 7 ? 20 : 0) + (report.avgWater >= 2 ? 20 : 0));
      label = goal.unit || 'pts';
    }
    return {
      current,
      target,
      label,
      percent: Math.min(100, Math.round((current / target) * 100)),
      done: current >= target
    };
  }

  function weeklyReport(userId){
    const checkins = userCheckins(userId);
    const range = lastDays(7);
    const previous = {start:range.start, end:range.end};
    const startDate = new Date(`${range.start}T00:00:00`);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(`${range.start}T00:00:00`);
    endDate.setDate(endDate.getDate() - 1);
    previous.start = todayKey(startDate);
    previous.end = todayKey(endDate);
    const week = checkins.filter(item => inRange(item, range));
    const prevWeek = checkins.filter(item => inRange(item, previous));
    const latest = checkins[checkins.length - 1];
    const first = week.find(item => item.weight > 0);
    const last = [...week].reverse().find(item => item.weight > 0);
    const totalWorkouts = week.filter(item => item.duration > 0).length;
    const prevWorkouts = prevWeek.filter(item => item.duration > 0).length;
    const distance = week.reduce((sum,item)=>sum + item.distance, 0);
    const avgWater = average(week.map(item => item.water));
    const avgSleep = average(week.map(item => item.sleep));
    const checkinScore = Math.min(20, week.length * 4);
    const workoutScore = Math.min(28, totalWorkouts * 7);
    const waterScore = Math.min(18, avgWater * 9);
    const sleepScore = Math.min(18, avgSleep * 2.6);
    const distanceScore = Math.min(16, distance * 1.8);
    const weekScore = Math.min(100, Math.round(checkinScore + workoutScore + waterScore + sleepScore + distanceScore));
    return {
      range,
      totalWorkouts,
      distance,
      avgWater,
      avgSleep,
      currentWeight: latest?.weight || 0,
      weightChange: first && last ? last.weight - first.weight : 0,
      previousWorkouts: prevWorkouts,
      workoutDelta: totalWorkouts - prevWorkouts,
      weekScore,
      message: weekScore >= 80 ? 'Semana forte. O KOBEM recomenda manter o ritmo, proteger o descanso e repetir o que funcionou.' : weekScore >= 50 ? 'Boa base. O próximo passo é aumentar a regularidade dos check-ins e ajustar hidratação ou sono.' : 'Semana de retomada. Comece pequeno hoje: registre o dia, caminhe alguns minutos e construa presença sem julgamento.'
    };
  }

  function dashboardStats(userId){
    const state = readState();
    const user = state.users.find(item => item.id === userId);
    const checkins = userCheckins(userId);
    const goals = userGoals(userId);
    const report = weeklyReport(userId);
    const xp = calcXp(checkins, goals);
    return {
      user,
      checkins,
      goals,
      report,
      xp,
      level:getLevel(xp),
      badges:getBadges(checkins, report),
      streak:activeStreak(checkins),
      totalActivities:checkins.filter(item => item.duration > 0).length,
      avgWater:average(checkins.slice(-7).map(item => item.water)),
      avgSleep:average(checkins.slice(-7).map(item => item.sleep))
    };
  }

  function notifications(userId){
    const stats = dashboardStats(userId);
    const notes = [];
    const today = todayKey();
    const checkedToday = stats.checkins.some(item => item.date === today);
    if(!checkedToday) notes.push(['Falta de check-in','Registre seu dia para manter a sequência ativa.']);
    if(stats.avgWater && stats.avgWater < 2) notes.push(['Baixa hidratação','Sua média de água está abaixo de 2 litros.']);
    if(stats.avgSleep && stats.avgSleep < 7) notes.push(['Sono baixo','Tente proteger mais uma janela de descanso.']);
    if(stats.streak >= 3) notes.push(['Sequência de dias ativos',`${stats.streak} dias seguidos em movimento.`]);
    if(stats.report.workoutDelta > 0) notes.push(['Evolução positiva','Você treinou mais que na semana anterior.']);
    stats.goals.forEach(goal => {
      const progress = goalProgress(goal, stats.report, stats.checkins);
      if(progress.done) notes.push(['Meta concluída', `${goal.title}: ${Math.round(progress.current)} de ${progress.target} ${progress.label}.`]);
      if(!progress.done && progress.percent < 40) notes.push(['Meta em risco', `${goal.title}: ${progress.percent}% concluído nesta semana.`]);
    });
    return notes;
  }

  function adminStats(){
    const state = readState();
    const today = todayKey();
    const activeUsers = new Set(state.checkins.filter(item => item.date >= lastDays(7).start).map(item => item.userId));
    return {
      users:state.users.length,
      activeUsers:activeUsers.size,
      checkins:state.checkins.length,
      premium:state.users.filter(user => user.plan === 'premium').length,
      todayCheckins:state.checkins.filter(item => item.date === today).length,
      messages:state.messages,
      challenges:state.challenges
    };
  }

  function addMessage(text){
    const state = readState();
    state.messages.unshift(sanitize(text, 220));
    writeState(state);
  }

  function addChallenge(title, text){
    const state = readState();
    state.challenges.unshift({id:uid('challenge'), title:sanitize(title,80), text:sanitize(text,240), createdAt:new Date().toISOString()});
    writeState(state);
  }

  function coachMessage(userId){
    const state = readState();
    const stats = dashboardStats(userId);
    if(stats.streak >= 7) return 'KOBEM: sequência de respeito. Agora transforme ritmo em identidade.';
    if(stats.report.avgWater < 2) return 'KOBEM: hoje sua missão é simples: água primeiro, treino depois.';
    if(stats.report.totalWorkouts === 0) return 'KOBEM: comece com 15 minutos. O placar muda quando você entra em campo.';
    return state.messages[Math.floor(Math.random() * state.messages.length)] || defaultState.messages[0];
  }

  window.KOBEM = {
    STORAGE_KEY,
    SESSION_KEY,
    goalLabels,
    levelNames,
    uid,
    todayKey,
    readState,
    writeState,
    getSession,
    setSession,
    clearSession,
    getCurrentUser,
    requireAuth,
    sanitize,
    number,
    positiveNumber,
    registerUser,
    login,
    updateUser,
    userCheckins,
    userGoals,
    saveCheckin,
    saveGoal,
    removeGoal,
    goalProgress,
    weeklyReport,
    dashboardStats,
    notifications,
    adminStats,
    addMessage,
    addChallenge,
    coachMessage
  };
})();
