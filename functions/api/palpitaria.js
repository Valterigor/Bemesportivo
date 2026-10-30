import { apiJson, apiOptions } from '../../server/cloudflare-api.mjs';

const competitions = {
  brasileirao: 'bra.1',
  ingles: 'eng.1',
  espanhol: 'esp.1',
  champions: 'uefa.champions'
};

const confirmedFixtures = {
  20261030: [{
    id: 'corinthians-mirassol-20261030', competition: 'brasileirao',
    startsAt: '2026-10-30T20:00:00-03:00', state: 'pre', completed: false, detail: '20:00', clock: '',
    home: { id: 'corinthians', name: 'Corinthians', logo: '', score: null },
    away: { id: 'mirassol', name: 'Mirassol', logo: '', score: null }
  }]
};

function normalizeEvent(event, competition) {
  const contest = event?.competitions?.[0];
  const teams = Array.isArray(contest?.competitors) ? contest.competitors : [];
  const home = teams.find(team => team.homeAway === 'home');
  const away = teams.find(team => team.homeAway === 'away');
  if (!home?.team?.id || !away?.team?.id) return null;
  const status = event?.status || {};
  return {
    id: String(event.id || ''),
    competition,
    startsAt: event.date || contest.date || '',
    state: status.type?.state || 'pre',
    completed: Boolean(status.type?.completed),
    detail: status.type?.shortDetail || status.type?.detail || '',
    clock: status.displayClock || '',
    home: {
      id: String(home.team.id),
      name: home.team.displayName || home.team.shortDisplayName || '',
      logo: home.team.logo || '',
      score: home.score == null ? null : String(home.score)
    },
    away: {
      id: String(away.team.id),
      name: away.team.displayName || away.team.shortDisplayName || '',
      logo: away.team.logo || '',
      score: away.score == null ? null : String(away.score)
    }
  };
}

async function loadCompetition(competition, league, date) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'BemEsportivo/1.0 (+https://bemesportivo.com)' },
    signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error(`${competition}: HTTP ${response.status}`);
  const payload = await response.json();
  return (Array.isArray(payload.events) ? payload.events : [])
    .map(event => normalizeEvent(event, competition))
    .filter(Boolean);
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return apiOptions();
  if (request.method !== 'GET') return apiJson({ ok: false, error: 'Método não permitido.' }, 405);
  const requested = new URL(request.url).searchParams.get('date') || '';
  const date = /^\d{8}$/.test(requested) ? requested : new Date().toISOString().slice(0, 10).replaceAll('-', '');

  const results = await Promise.allSettled(Object.entries(competitions)
    .map(([competition, league]) => loadCompetition(competition, league, date)));
  let matches = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  if (!matches.length && confirmedFixtures[date]) matches = confirmedFixtures[date];
  if (!matches.length && results.every(result => result.status === 'rejected')) {
    return apiJson({ ok: false, error: 'Placares indisponíveis no momento.' }, 502);
  }
  return apiJson({ ok: true, date, updatedAt: new Date().toISOString(), matches }, 200, 15);
}
