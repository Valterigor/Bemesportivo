export class InputManager{
  constructor({canvas,leftBtn,rightBtn,jumpBtn,slideBtn,onMove,onJump,onSlide,onTurbo}){
    this.canvas = canvas;
    this.leftBtn = leftBtn;
    this.rightBtn = rightBtn;
    this.jumpBtn = jumpBtn;
    this.slideBtn = slideBtn;
    this.onMove = onMove;
    this.onJump = onJump;
    this.onSlide = onSlide;
    this.onTurbo = onTurbo;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
  }

  bind(){
    this.leftBtn?.addEventListener('click', () => this.onMove(-1));
    this.rightBtn?.addEventListener('click', () => this.onMove(1));
    this.jumpBtn?.addEventListener('click', () => this.onJump());
    this.slideBtn?.addEventListener('click', () => this.onSlide());

    window.addEventListener('keydown', event => {
      if(event.repeat) return;
      if(event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') this.onMove(-1);
      if(event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') this.onMove(1);
      if(event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') this.onJump();
      if(event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') this.onSlide();
      if(event.key === ' ') this.onTurbo(true);
    });

    window.addEventListener('keyup', event => {
      if(event.key === ' ') this.onTurbo(false);
    });

    this.canvas?.addEventListener('pointerdown', event => {
      this.pointerStartX = event.clientX;
      this.pointerStartY = event.clientY;
    });

    this.canvas?.addEventListener('pointerup', event => {
      const dx = event.clientX - this.pointerStartX;
      const dy = event.clientY - this.pointerStartY;
      if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 28){
        this.onMove(dx > 0 ? 1 : -1);
        return;
      }
      if(dy > 34 && Math.abs(dy) > Math.abs(dx)) this.onSlide();
      if(dy < -34 && Math.abs(dy) > Math.abs(dx)) this.onJump();
    });
  }
}
