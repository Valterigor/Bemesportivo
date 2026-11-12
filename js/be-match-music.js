(() => {
  const toggle = document.querySelector('#sound-toggle');
  let audio = null;
  let master = null;
  let timer = null;
  let duckTimer = null;
  let playing = false;
  const normalVolume = .018;
  const enabled = () => localStorage.getItem('be-match-sound') !== 'off';

  const start = () => {
    if (!enabled() || playing) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio = audio || new AudioContext();
    if (audio.state === 'suspended') audio.resume();
    master = master || audio.createGain();
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(normalVolume, audio.currentTime, .06);
    if (!master.__connected) { master.connect(audio.destination); master.__connected = true; }
    playing = true;
    const notes = [220, 261.63, 329.63, 392, 329.63, 261.63, 293.66, 349.23];
    let step = 0;
    const beat = () => {
      if (!playing) return;
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = notes[step++ % notes.length];
      gain.gain.setValueAtTime(.001, now);
      gain.gain.linearRampToValueAtTime(.18, now + .04);
      gain.gain.exponentialRampToValueAtTime(.001, now + .42);
      oscillator.connect(gain).connect(master);
      oscillator.start(now);
      oscillator.stop(now + .45);
      if (step % 4 === 1) {
        const bass = audio.createOscillator();
        const bassGain = audio.createGain();
        bass.type = 'triangle';
        bass.frequency.value = notes[(step + 3) % notes.length] / 2;
        bassGain.gain.setValueAtTime(.001, now);
        bassGain.gain.linearRampToValueAtTime(.08, now + .04);
        bassGain.gain.exponentialRampToValueAtTime(.001, now + .6);
        bass.connect(bassGain).connect(master);
        bass.start(now);
        bass.stop(now + .65);
      }
      timer = setTimeout(beat, 520);
    };
    beat();
  };

  const stop = () => {
    playing = false;
    clearTimeout(timer);
    clearTimeout(duckTimer);
    if (master && audio) master.gain.setTargetAtTime(.001, audio.currentTime, .08);
  };

  const duck = ({ detail }) => {
    if (!playing || !master || !audio) return;
    clearTimeout(duckTimer);
    const level = Math.max(.08, Math.min(.55, Number(detail?.intensity) || .3));
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(normalVolume * level, audio.currentTime, .025);
    duckTimer = setTimeout(() => {
      if (playing && enabled()) master.gain.setTargetAtTime(normalVolume, audio.currentTime, .12);
    }, Number(detail?.duration) || 420);
  };

  const sync = () => { if (enabled()) start(); else stop(); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(eventName => window.addEventListener(eventName, sync, { once: true, passive: true }));
  toggle?.addEventListener('click', () => setTimeout(sync, 20));
  window.addEventListener('be-match:audio-focus', duck);
})();
