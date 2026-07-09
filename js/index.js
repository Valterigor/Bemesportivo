function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char]));
    }

    function getSaoPauloDateKey(date = new Date()) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      return `${parts.year}${parts.month}${parts.day}`;
    }

    function getSaoPauloDateRange(daysAhead = 10) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + daysAhead);
      return `${getSaoPauloDateKey(start)}-${getSaoPauloDateKey(end)}`;
    }

    const FALLBACK_WORLD_CUP_MATCHES = [
      {
        id: 'fallback-qf-1',
        home: { name: 'França', code: 'FRA' },
        away: { name: 'Marrocos', code: 'MAR' },
        detail: 'Quartas de final',
        date: '2026-07-09T20:00:00Z'
      },
      {
        id: 'fallback-qf-2',
        home: { name: 'Espanha', code: 'ESP' },
        away: { name: 'Bélgica', code: 'BEL' },
        detail: 'Quartas de final',
        date: '2026-07-10T19:00:00Z'
      },
      {
        id: 'fallback-qf-3',
        home: { name: 'Noruega', code: 'NOR' },
        away: { name: 'Inglaterra', code: 'ING' },
        detail: 'Quartas de final',
        date: '2026-07-11T21:00:00Z'
      },
      {
        id: 'fallback-qf-4',
        home: { name: 'Argentina', code: 'ARG' },
        away: { name: 'Suíça', code: 'SUI' },
        detail: 'Quartas de final',
        date: '2026-07-12T01:00:00Z'
      }
    ];

    const TEAM_FLAG_CODES = {
      ARG: 'ar',
      ARGENTINA: 'ar',
      BEL: 'be',
      BELGICA: 'be',
      BELGIUM: 'be',
      BRA: 'br',
      BRASIL: 'br',
      BRAZIL: 'br',
      ENG: 'gb-eng',
      INGLATERRA: 'gb-eng',
      ENGLAND: 'gb-eng',
      ESP: 'es',
      ESPANHA: 'es',
      SPAIN: 'es',
      FRA: 'fr',
      FRANCA: 'fr',
      FRANCE: 'fr',
      ING: 'gb-eng',
      MAR: 'ma',
      MARROCOS: 'ma',
      MOROCCO: 'ma',
      NOR: 'no',
      NORUEGA: 'no',
      NORWAY: 'no',
      SCO: 'gb-sct',
      ESC: 'gb-sct',
      ESCOCIA: 'gb-sct',
      SCOTLAND: 'gb-sct',
      SUI: 'ch',
      SUICA: 'ch',
      SWITZERLAND: 'ch'
    };

    function normalizeFlagKey(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '')
        .toUpperCase();
    }

    function getFlagUrl(team) {
      const flagCode = TEAM_FLAG_CODES[normalizeFlagKey(team?.code)]
        || TEAM_FLAG_CODES[normalizeFlagKey(team?.abbreviation)]
        || TEAM_FLAG_CODES[normalizeFlagKey(team?.displayName)]
        || TEAM_FLAG_CODES[normalizeFlagKey(team?.shortDisplayName)]
        || TEAM_FLAG_CODES[normalizeFlagKey(team?.name)];
      return flagCode ? `https://flagcdn.com/${flagCode}.svg` : '';
    }

    function formatWorldCupDateTime(date) {
      const dateLabel = date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).replace('.', '');
      const time = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
      return { dateLabel, time };
    }

    function isSaoPauloToday(date) {
      return getSaoPauloDateKey(date) === getSaoPauloDateKey(new Date());
    }

    function getFallbackWorldCupMatches() {
      const now = Date.now();
      return FALLBACK_WORLD_CUP_MATCHES
        .map(match => {
          const date = new Date(match.date);
          const { dateLabel, time } = formatWorldCupDateTime(date);
          const isToday = isSaoPauloToday(date);
          return {
            ...match,
            score: '-- x --',
            primary: time,
            status: isToday ? 'Hoje' : 'Pre-jogo',
            isLive: false,
            isFinal: false,
            isPre: true,
            isToday,
            startsAt: date.getTime(),
            time: `${dateLabel} - ${time}`
          };
        })
        .filter(match => match.startsAt >= now - 3 * 60 * 60 * 1000)
        .slice(0, 8);
    }

    function getTeamLogo(team) {
      if (!team) return '';
      if (team.logo) return team.logo;
      if (Array.isArray(team.logos) && team.logos[0]?.href) return team.logos[0].href;
      return getFlagUrl(team);
    }

    function normalizeWorldCupEvent(event) {
      const competition = event?.competitions?.[0] || {};
      const competitors = Array.isArray(competition.competitors) ? competition.competitors : [];
      const home = competitors.find(item => item.homeAway === 'home') || competitors[0] || {};
      const away = competitors.find(item => item.homeAway === 'away') || competitors[1] || {};
      const homeTeam = home.team || {};
      const awayTeam = away.team || {};
      const statusType = event?.status?.type || {};
      const statusName = statusType.shortDetail || statusType.detail || statusType.description || 'Pre-jogo';
      const isLive = statusType.state === 'in' || statusType.name === 'STATUS_IN_PROGRESS';
      const isFinal = statusType.completed || statusType.state === 'post';
      const isPre = statusType.state === 'pre' || (!isLive && !isFinal);
      const date = event?.date ? new Date(event.date) : null;
      const dateInfo = date && !Number.isNaN(date.getTime()) ? formatWorldCupDateTime(date) : null;
      const time = dateInfo ? dateInfo.time : '--:--';
      const dateLabel = dateInfo ? dateInfo.dateLabel : 'Data a confirmar';
      const score = home.score != null && away.score != null ? `${home.score} x ${away.score}` : '-- x --';
      const isToday = date ? isSaoPauloToday(date) : false;

      return {
        id: event?.id || '',
        home: {
          name: homeTeam.displayName || homeTeam.shortDisplayName || homeTeam.name || 'Mandante',
          code: homeTeam.abbreviation || '---',
          flag: getTeamLogo(homeTeam)
        },
        away: {
          name: awayTeam.displayName || awayTeam.shortDisplayName || awayTeam.name || 'Visitante',
          code: awayTeam.abbreviation || '---',
          flag: getTeamLogo(awayTeam)
        },
        score,
        primary: isPre ? time : score,
        status: isLive ? 'Ao Vivo' : isFinal ? 'Encerrado' : isToday ? 'Hoje' : statusName,
        isLive,
        isFinal,
        isPre,
        isToday,
        startsAt: date ? date.getTime() : 0,
        detail: competition.notes?.[0]?.headline || competition.venue?.fullName || 'Copa do Mundo 2026',
        time: isLive ? (event?.status?.displayClock || statusName) : `${dateLabel} - ${time}`
      };
    }

    function renderTeam(team, side = 'home') {
      const flagUrl = team.flag || getFlagUrl(team);
      const flagFallback = escapeHtml(team.code || '---');
      const flag = flagUrl
        ? `<img src="${escapeHtml(flagUrl)}" alt="Bandeira de ${escapeHtml(team.name)}" loading="lazy" onerror="this.parentElement.textContent='${flagFallback}'">`
        : flagFallback;
      const flagHtml = `<span class="crest">${flag}</span>`;
      const nameHtml = `<span class="team-name">${escapeHtml(team.name)}</span>`;
      return side === 'away'
        ? `<div class="team away">${nameHtml}${flagHtml}</div>`
        : `<div class="team">${flagHtml}${nameHtml}</div>`;
    }

    function renderWorldCupMatches(matches, sourceLabel = 'Atualizando em tempo real') {
      const container = document.getElementById('worldCupMatches');
      const updated = document.getElementById('worldCupUpdated');
      const mode = document.getElementById('worldCupMode');
      if (!container || !updated) return;

      if (!matches.length) {
        container.innerHTML = '<div class="match-empty">Nenhum jogo da Copa encontrado no calendário consultado.</div>';
        updated.textContent = sourceLabel;
        if (mode) mode.textContent = 'Próximos confrontos';
        return;
      }

      const hasLive = matches.some(match => match.isLive);
      const hasToday = matches.some(match => match.isToday);
      if (mode) {
        mode.textContent = hasLive ? 'Tempo real' : hasToday ? 'Dia de jogo' : 'Próximos confrontos';
      }

      container.innerHTML = matches.map(match => `
        <article class="match-card">
          ${renderTeam(match.home, 'home')}
          <div class="match-center">
            <span class="time">${escapeHtml(match.primary || match.score || match.time)}</span>
            <span class="competition">${escapeHtml(match.detail || 'Copa do Mundo')}</span>
            <span class="status${match.isLive ? ' live' : match.isToday ? ' today' : ''}">${escapeHtml(match.status)}</span>
            <span class="match-detail">${escapeHtml(match.time)}</span>
          </div>
          ${renderTeam(match.away, 'away')}
        </article>
      `).join('');

      updated.textContent = sourceLabel;
    }

    function sortWorldCupMatches(matches) {
      const now = Date.now();
      return [...matches].sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        const aUpcoming = !a.isFinal && a.startsAt >= now;
        const bUpcoming = !b.isFinal && b.startsAt >= now;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return (a.startsAt || 0) - (b.startsAt || 0);
      });
    }

    async function loadWorldCupMatches() {
      const dates = getSaoPauloDateRange(10);
      try {
        const response = await fetch(`/api/worldcup/scoreboard?dates=${dates}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const events = payload?.data?.events || payload?.events || [];
        const apiMatches = sortWorldCupMatches(events.map(normalizeWorldCupEvent)).slice(0, 8);
        const matches = apiMatches.length ? apiMatches : getFallbackWorldCupMatches();
        const label = matches.some(match => match.isLive)
          ? `Ao vivo - atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : `Confrontos com data e horário - atualizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        renderWorldCupMatches(matches, label);
      } catch (error) {
        renderWorldCupMatches(getFallbackWorldCupMatches(), 'Agenda reserva enquanto o tempo real carrega');
      }
    }

    renderWorldCupMatches([], 'Carregando tempo real...');
    loadWorldCupMatches();
    window.setInterval(() => {
      if (!document.hidden) loadWorldCupMatches();
    }, 30000);
