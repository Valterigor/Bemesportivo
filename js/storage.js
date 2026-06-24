const KEY = 'kobemRunnerV2';

const defaults = {
  best:0,
  wallet:0,
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
  {id:'dist-5',name:'Primeiros 5 km',desc:'Corra 5 km no total.'},
  {id:'dist-50',name:'Primeiros 50 km',desc:'Some 50 km corridos.'},
  {id:'coins-100',name:'100 moedas',desc:'Guarde 100 moedas.'},
  {id:'coins-500',name:'500 moedas',desc:'Guarde 500 moedas.'},
  {id:'dribble-master',name:'Mestre do Drible',desc:'Chegue ao combo x10.'},
  {id:'legend',name:'Lenda Kobem',desc:'Desbloqueie o Kobem Lendário.'}
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
