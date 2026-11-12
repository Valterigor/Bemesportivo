(() => {
  const toggle = document.querySelector('#sound-toggle');
  const startSoundButton = document.querySelector('#start-sound');
  const playButton = document.querySelector('#continue-game');
  let audio = null;
  let master = null;
  let timer = null;
  let duckTimer = null;
  let playing = false;
  let mode = 'menu';
  let step = 0;
  const enabled = () => localStorage.getItem('be-match-sound') !== 'off';
  const normalVolume = () => mode === 'game' ? .12 : mode === 'tactical' ? .105 : .09;
  const melodies = {
    menu: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23],
    tactical: [220, 293.66, 349.23, 440, 349.23, 293.66, 261.63, 329.63],
    game: [220, 261.63, 329.63, 392, 329.63, 261.63, 293.66, 349.23]
  };

  const playBeat = () => {
    if (!playing || !audio || !master) return;
    const notes = melodies[mode];
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = mode === 'game' ? 'triangle' : 'sine';
    oscillator.frequency.value = notes[step++ % notes.length];
    gain.gain.setValueAtTime(.001, now);
    gain.gain.linearRampToValueAtTime(mode === 'game' ? .16 : .12, now + .06);
    gain.gain.exponentialRampToValueAtTime(.001, now + (mode === 'game' ? .48 : .65));
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + (mode === 'game' ? .54 : .72));
    if (step % 4 === 1) {
      const bass = audio.createOscillator();
      const bassGain = audio.createGain();
      bass.type = 'sine';
      bass.frequency.value = notes[(step + 3) % notes.length] / 2;
      bassGain.gain.setValueAtTime(.001, now);
      bassGain.gain.linearRampToValueAtTime(mode === 'menu' ? .05 : .075, now + .08);
      bassGain.gain.exponentialRampToValueAtTime(.001, now + .76);
      bass.connect(bassGain).connect(master);
      bass.start(now);
      bass.stop(now + .82);
    }
    timer = setTimeout(playBeat, mode === 'game' ? 520 : mode === 'tactical' ? 620 : 720);
  };

  const start = async requestedMode => {
    if (!enabled()) return;
    if (requestedMode) mode = requestedMode;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio = audio || new AudioContext();
    if (audio.state === 'suspended') {
      try { await audio.resume(); } catch { return; }
    }
    master = master || audio.createGain();
    if (!master.__connected) { master.connect(audio.destination); master.__connected = true; }
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(normalVolume(), audio.currentTime, .12);
    if (playing) return;
    playing = true;
    step = 0;
    playBeat();
  };

  const stop = () => {
    playing = false;
    clearTimeout(timer);
    clearTimeout(duckTimer);
    if (master && audio) master.gain.setTargetAtTime(.001, audio.currentTime, .1);
  };

  const changeMode = nextMode => {
    mode = nextMode;
    step = 0;
    if (!playing || !master || !audio) { start(nextMode); return; }
    clearTimeout(timer);
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(.001, audio.currentTime, .07);
    setTimeout(() => {
      if (!playing || !enabled()) return;
      master.gain.setTargetAtTime(normalVolume(), audio.currentTime, .14);
      playBeat();
    }, 180);
  };

  const duck = ({ detail }) => {
    if (!playing || !master || !audio) return;
    clearTimeout(duckTimer);
    const level = Math.max(.08, Math.min(.55, Number(detail?.intensity) || .3));
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(normalVolume() * level, audio.currentTime, .035);
    duckTimer = setTimeout(() => {
      if (playing && enabled()) master.gain.setTargetAtTime(normalVolume(), audio.currentTime, .15);
    }, Number(detail?.duration) || 420);
  };

  const sync = () => { if (enabled()) start(mode); else stop(); };
  startSoundButton?.addEventListener('click', () => start('menu'));
  playButton?.addEventListener('click', () => changeMode('tactical'));
  toggle?.addEventListener('click', () => setTimeout(sync, 20));
  window.addEventListener('be-match:audio-focus', duck);
  window.addEventListener('be-match:tactical-open', () => changeMode('tactical'));
  window.addEventListener('be-match:enter-game', stop);
  window.addEventListener('be-match:return-menu', () => changeMode('menu'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && playing && enabled()) start(mode);
  });
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    window.__beMatchMusicDebug = { snapshot: () => ({ playing, mode, state: audio?.state || 'idle' }) };
  }
})();
