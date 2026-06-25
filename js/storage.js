const KEY = 'kobemRunnerV3';

const defaults = {
  best:0,
  wallet:0,
  gems:0,
  bestDistance:0,
  selected:'classic',
  sound:true,
  vibration:true,
  xp:0,
  level:1,
  stats:{runs:0,totalDistance:0,bestCombo:0,bestGems:0},
  missions:{daily:{date:'',bottles:0,rewarded:false},weekly:{week:'',distance:0,rewarded:false}},
  unlocked:['classic','mascot2'],
  ranking:[],
  achievements:[]
};

export const ACHIEVEMENTS = [
  {id:'first-run',name:'Primeira partida',desc:'Jogue uma vez.'},
  {id:'score-1000',name:'Primeiros 1000 pontos',desc:'Alcance 1.000 pontos.'},
  {id:'score-5000',name:'Primeiros 5000 pontos',desc:'Alcance 5.000 pontos.'},
  {id:'dist-5',name:'Meta 5 km',desc:'Ganhe uma joia em uma corrida.'},
  {id:'dist-50',name:'Maratonista BE',desc:'Some 50 km corridos.'},
  {id:'bottles-100',name:'Hidratado',desc:'Guarde 100 garrafas.'},
  {id:'bottles-500',name:'Estoque campeao',desc:'Guarde 500 garrafas.'},
  {id:'hydration-hero',name:'Sem sede',desc:'Termine uma corrida com 80% de hidratacao.'},
  {id:'dribble-master',name:'Mestre do combo',desc:'Chegue ao combo x10.'},
  {id:'legend',name:'Lenda Kobem',desc:'Desbloqueie o Kobem Lendario.'}
];

export function loadStore(){
  try{
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return normalizeStore({...defaults, ...saved});
  }catch(error){
    return normalizeStore({...defaults});
  }
}

export function saveStore(store){
  localStorage.setItem(KEY, JSON.stringify(normalizeStore({...defaults, ...store})));
}

export function addRanking(store, entry){
  store.ranking = [...(store.ranking || []), entry]
    .sort((a,b) => b.score - a.score)
    .slice(0, 10);
  return store.ranking;
}

export function unlockAchievement(store, id){
  if(!store.achievements.includes(id)){
    store.achievements.push(id);
    return true;
  }
  return false;
}

export function addXp(store, amount){
  store.xp = Math.max(0, Number(store.xp || 0) + Math.max(0, Math.floor(amount)));
  store.level = Math.max(1, Math.floor(store.xp / 500) + 1);
  return store.level;
}

export function updateMissionProgress(store, run){
  const today = new Date().toISOString().slice(0,10);
  const week = getWeekKey(new Date());
  if(store.missions.daily.date !== today){
    store.missions.daily = {date:today,bottles:0,rewarded:false};
  }
  if(store.missions.weekly.week !== week){
    store.missions.weekly = {week,distance:0,rewarded:false};
  }

  store.missions.daily.bottles += Math.max(0, run.coins || 0);
  store.missions.weekly.distance += Math.max(0, run.distance || 0);
  if(store.missions.daily.bottles >= 50 && !store.missions.daily.rewarded){
    store.wallet += 75;
    store.missions.daily.rewarded = true;
  }
  if(store.missions.weekly.distance >= 25 && !store.missions.weekly.rewarded){
    store.gems = (store.gems || 0) + 3;
    store.missions.weekly.rewarded = true;
  }
}

function normalizeStore(store){
  const normalized = {...defaults, ...store};
  normalized.stats = {...defaults.stats, ...(store.stats || {})};
  normalized.missions = {
    daily:{...defaults.missions.daily, ...(store.missions?.daily || {})},
    weekly:{...defaults.missions.weekly, ...(store.missions?.weekly || {})}
  };
  normalized.unlocked = [...new Set([...(defaults.unlocked || []), ...(store.unlocked || [])])];
  normalized.achievements = Array.isArray(store.achievements) ? store.achievements : [];
  normalized.ranking = Array.isArray(store.ranking) ? store.ranking : [];
  normalized.level = Math.max(1, Number(normalized.level || 1));
  normalized.xp = Math.max(0, Number(normalized.xp || 0));
  return normalized;
}

function getWeekKey(date){
  const firstDay = new Date(date.getFullYear(),0,1);
  const days = Math.floor((date - firstDay) / 86400000);
  return `${date.getFullYear()}-${Math.ceil((days + firstDay.getDay() + 1) / 7)}`;
}
