export class AudioBus{
  constructor(store){
    this.store = store;
    this.ctx = null;
    this.files = {
      coin:new Audio('assets/audio/coin.wav'),
      hit:new Audio('assets/audio/hit.wav'),
      turbo:new Audio('assets/audio/turbo.wav'),
      button:new Audio('assets/audio/button.wav'),
      gameover:new Audio('assets/audio/gameover.wav'),
      powerup:new Audio('assets/audio/powerup.wav')
    };
  }

  ensure(){
    if(!this.ctx){
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(AudioContext) this.ctx = new AudioContext();
    }
    if(this.ctx?.state === 'suspended') this.ctx.resume();
  }

  play(type){
    if(!this.store.sound) return;
    const file = this.files[type];
    if(file){
      try{
        file.currentTime = 0;
        file.play().catch(() => this.playTone(type));
        return;
      }catch(error){
        this.playTone(type);
        return;
      }
    }
    this.playTone(type);
  }

  playTone(type){
    this.ensure();
    if(!this.ctx) return;
    const tones = {
      coin:[880,.06,'sine'],
      hit:[120,.16,'sawtooth'],
      turbo:[220,.12,'square'],
      button:[520,.05,'triangle'],
      gameover:[80,.5,'sawtooth'],
      powerup:[660,.18,'sine']
    };
    const [freq,duration,wave] = tones[type] || tones.button;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.18, this.ctx.currentTime + .01);
    gain.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + .02);
  }
}
