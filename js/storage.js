const KEY = 'kobemRunnerV3';

const defaults = {
  best:0,
  wallet:0,
  gems:0,
  bestDistance:0,
  selected:'classic',
  sound:true,
  vibration:true,
  unlocked:['classic'],
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
    return {...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}')};
  }catch(error){
    return {...defaults};
  }
}

export function saveStore(store){
  localStorage.setItem(KEY, JSON.stringify({...defaults, ...store}));
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
