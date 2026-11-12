(() => {
  const board = document.querySelector('#board');
  const toggle = document.querySelector('#sound-toggle');
  const startSoundButton = document.querySelector('#start-sound');
  const playButton = document.querySelector('#continue-game');
  if (!board || !toggle) return;

  let audio = null;
  let master = null;
  let ambience = null;
  let enabled = localStorage.getItem('be-match-sound') !== 'off';
  const history = [];
  const record = name => { history.push(name); if (history.length > 24) history.shift(); };

  const context = () => {
    if (audio) return audio;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audio = new AudioContext();
    const compressor = audio.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 7;
    compressor.attack.value = .004;
    compressor.release.value = .16;
    master = audio.createGain();
    master.gain.value = .9;
    master.connect(compressor).connect(audio.destination);
    const reverb = audio.createConvolver();
    const reverbSeconds = .85;
    const impulse = audio.createBuffer(2, Math.ceil(audio.sampleRate * reverbSeconds), audio.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.2);
    }
    reverb.buffer = impulse;
    ambience = audio.createGain();
    ambience.gain.value = .13;
    reverb.connect(ambience).connect(compressor);
    ambience.input = reverb;
    return audio;
  };

  const resume = () => {
    const ac = context();
    if (enabled && ac?.state === 'suspended') ac.resume();
    return ac;
  };

  const tone = (frequency, duration = .1, options = {}) => {
    if (!enabled) return;
    const ac = resume();
    if (!ac || !master) return;
    const now = ac.currentTime + (options.delay || 0);
    const attack = options.attack ?? Math.min(.024, duration / 3);
    const release = options.release ?? (options.type === 'sine' ? .16 : .1);
    const peak = options.gain || .035;
    const oscillator = ac.createOscillator();
    const gain = ac.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.to) oscillator.frequency.exponentialRampToValueAtTime(options.to, now + duration);
    if (options.detune) oscillator.detune.value = options.detune;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, peak * .62), now + duration);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration + release);
    oscillator.connect(gain);
    gain.connect(master);
    if (ambience?.input) gain.connect(ambience.input);
    oscillator.start(now);
    oscillator.stop(now + duration + release + .03);
  };

  const noise = (duration = .12, options = {}) => {
    if (!enabled) return;
    const ac = resume();
    if (!ac || !master) return;
    const now = ac.currentTime + (options.delay || 0);
    const attack = options.attack ?? .008;
    const release = options.release ?? .11;
    const totalDuration = duration + release;
    const peak = options.gain || .018;
    const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * totalDuration), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.7);
    const source = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    source.buffer = buffer;
    filter.type = options.filter || 'bandpass';
    filter.frequency.value = options.frequency || 1100;
    filter.Q.value = options.q || .7;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, peak * .5), now + duration);
    gain.gain.exponentialRampToValueAtTime(.0001, now + totalDuration);
    source.connect(filter).connect(gain);
    gain.connect(master);
    if (ambience?.input) gain.connect(ambience.input);
    source.start(now);
    source.stop(now + totalDuration + .02);
  };

  const focus = (duration = 420, intensity = .35) => {
    window.dispatchEvent(new CustomEvent('be-match:audio-focus', { detail: { duration, intensity } }));
  };

  const impact = (delay = 0, strength = 1) => {
    tone(95, .1, { type: 'sine', gain: .035 * strength, to: 58, delay });
    noise(.055, { filter: 'highpass', frequency: 1250, gain: .024 * strength, delay });
  };

  const matchSound = (chain = 1, size = 3) => {
    record(`match-${chain}`);
    const scale = [392, 440, 523.25, 587.33, 659.25, 783.99];
    const root = scale[Math.min(scale.length - 1, Math.max(0, chain - 1))];
    impact(0, chain > 1 ? 1.15 : .8);
    tone(root, .085, { type: 'triangle', gain: .038 });
    tone(root * 1.5, .13, { type: 'sine', gain: .031, delay: .032 });
    if (chain >= 2) tone(root * 2, .18, { type: 'triangle', gain: .025, delay: .075 });
    if (chain >= 3) tone(root * 2.5, .22, { type: 'sine', gain: .022, delay: .13 });
    if (size >= 5) tone(root * 3, .2, { type: 'sine', gain: .022, delay: .095 });
    if (chain >= 2) focus(300 + chain * 70, .28);
  };

  const targetSound = count => {
    record('target');
    const repeats = Math.min(3, Math.max(1, count));
    for (let i = 0; i < repeats; i += 1) {
      tone(880 + i * 120, .17, { type: 'sine', gain: .036, delay: .07 + i * .06 });
      tone(1760 + i * 120, .11, { type: 'triangle', gain: .019, delay: .085 + i * .06 });
    }
  };

  const bonusSound = kind => {
    record(`bonus-${kind}`);
    if (kind === 'row' || kind === 'column') {
      focus(520, .25);
      impact(0, .9);
      tone(320, .3, { type: 'sawtooth', gain: .026, to: 1480 });
      tone(720, .26, { type: 'sine', gain: .034, to: 1760, delay: .025 });
    } else if (kind === 'burst') {
      focus(620, .2);
      impact(0, 1.4);
      tone(150, .34, { type: 'sine', gain: .07, to: 48 });
      noise(.26, { filter: 'lowpass', frequency: 950, gain: .045 });
      tone(740, .2, { type: 'triangle', gain: .038, delay: .09 });
    } else if (kind === 'cross') {
      focus(760, .16);
      impact(0, 1.2);
      [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => tone(note, .32, { type: 'sine', gain: .035, delay: index * .055 }));
    }
  };

  const powerSound = () => {
    record('power');
    focus(900, .12);
    impact(0, 1.7);
    noise(.38, { filter: 'bandpass', frequency: 720, gain: .052 });
    tone(110, .42, { type: 'sawtooth', gain: .052, to: 48 });
    [392, 523.25, 659.25, 987.77, 1318.5].forEach((note, index) => tone(note, .38, { type: index < 2 ? 'triangle' : 'sine', gain: .037, delay: .04 + index * .06 }));
  };

  const invalidSound = () => {
    record('invalid');
    tone(190, .11, { type: 'square', gain: .018, to: 145 });
    tone(145, .1, { type: 'triangle', gain: .016, delay: .08 });
  };

  const shuffleSound = () => {
    record('shuffle');
    noise(.26, { filter: 'highpass', frequency: 650, gain: .018 });
    [294, 370, 440].forEach((note, index) => tone(note, .11, { type: 'triangle', gain: .018, delay: index * .07 }));
  };

  const lowMovesSound = moves => {
    record(`low-${moves}`);
    const frequency = moves <= 2 ? 330 : 440;
    tone(frequency, .07, { type: 'square', gain: .015 });
    tone(frequency, .07, { type: 'square', gain: .012, delay: .1 });
  };

  const winSound = stars => {
    record('win');
    focus(1400, .08);
    const notes = stars === 3 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    notes.forEach((note, index) => tone(note, .28, { type: 'triangle', gain: .032, delay: index * .095 }));
    tone(261.63, .55, { type: 'sine', gain: .022, delay: .08 });
  };

  const milestoneSound = tier => {
    record('milestone');
    focus(950, .12);
    impact(0, 1.15);
    const notes = tier >= 3 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
    notes.forEach((note, index) => tone(note, .3, { type: index % 2 ? 'sine' : 'triangle', gain: .034, delay: .05 + index * .065 }));
  };

  const lossSound = () => {
    record('loss');
    [392, 330, 262].forEach((note, index) => tone(note, .24, { type: 'triangle', gain: .024, delay: index * .13 }));
  };

  const menuSound = () => {
    record('menu-open');
    [392, 523.25, 659.25].forEach((note, index) => tone(note, .34, { type: 'sine', gain: .024, delay: index * .075, release: .28 }));
    tone(196, .5, { type: 'triangle', gain: .016, delay: .04, release: .3 });
  };

  const playSound = () => {
    record('play');
    focus(680, .18);
    impact(0, .7);
    [440, 587.33, 739.99, 987.77].forEach((note, index) => tone(note, .25, { type: index < 2 ? 'triangle' : 'sine', gain: .032, delay: index * .065, release: .22 }));
  };

  board.addEventListener('be-match:points', ({ detail }) => {
    if (detail.power) powerSound();
    else matchSound(detail.chain, detail.indices?.length || 3);
    if (detail.bonus) setTimeout(() => bonusSound(detail.bonus), 65);
    if (detail.captured || detail.collected) setTimeout(() => targetSound((detail.captured || 0) + (detail.collected || 0)), 90);
  });
  board.addEventListener('be-match:invalid', invalidSound);
  board.addEventListener('be-match:shuffle', shuffleSound);
  board.addEventListener('be-match:low-moves', event => lowMovesSound(event.detail.moves));
  board.addEventListener('be-match:milestone', event => milestoneSound(event.detail?.tier || 3));
  window.addEventListener('be-match-win', event => winSound(event.detail.stars));
  window.addEventListener('be-match-loss', lossSound);

  const syncToggle = () => {
    toggle.textContent = enabled ? 'Som: ligado' : 'Som: desligado';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Desativar sons e música' : 'Ativar sons e música');
    if (!enabled && startSoundButton) {
      startSoundButton.textContent = '♪ Ativar trilha';
      startSoundButton.setAttribute('aria-pressed', 'false');
    }
  };
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    localStorage.setItem('be-match-sound', enabled ? 'on' : 'off');
    syncToggle();
    if (enabled) {
      resume();
      tone(660, .09, { type: 'triangle', gain: .02 });
      tone(880, .12, { type: 'sine', gain: .018, delay: .06 });
    }
  });
  startSoundButton?.addEventListener('click', () => {
    if (!enabled) {
      enabled = true;
      localStorage.setItem('be-match-sound', 'on');
      syncToggle();
    }
    resume();
    menuSound();
    startSoundButton.textContent = '♫ Trilha ativa';
    startSoundButton.setAttribute('aria-pressed', 'true');
  });
  playButton?.addEventListener('click', playSound);
  ['pointerdown', 'touchstart', 'keydown'].forEach(eventName => window.addEventListener(eventName, resume, { once: true, passive: true }));
  syncToggle();

  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    window.__beMatchSoundDebug = { history, isEnabled: () => enabled, profile: { smoothRelease: true, ambienceSeconds: .85, musicDucking: true } };
  }
})();
