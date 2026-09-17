(() => {
  const style = document.createElement('style');
  style.textContent = `
    #mobile-dpad{position:fixed;left:18px;bottom:calc(env(safe-area-inset-bottom) + 76px);z-index:9988;width:150px;height:150px;display:grid;grid-template-columns:50px 50px 50px;grid-template-rows:50px 50px 50px;touch-action:none;user-select:none;-webkit-user-select:none}
    #mobile-dpad button{width:48px;height:48px;border:1px solid rgba(65,86,74,.25);border-radius:50%;background:rgba(255,253,247,.90);color:#41564a;font-size:25px;font-weight:700;box-shadow:0 5px 14px rgba(40,60,48,.14);touch-action:none;-webkit-tap-highlight-color:transparent}
    #mobile-dpad button:active,#mobile-dpad button.pressed{transform:scale(.94);background:#dfeade}
    #mobile-dpad .up{grid-column:2;grid-row:1}.left{grid-column:1;grid-row:2}.down{grid-column:2;grid-row:3}.right{grid-column:3;grid-row:2}
    @media (hover:hover) and (pointer:fine){#mobile-dpad{display:none}}
  `;
  document.head.appendChild(style);

  const dpad = document.createElement('div');
  dpad.id = 'mobile-dpad';
  dpad.setAttribute('aria-label', '移動操作');
  dpad.innerHTML = `
    <button class="up" data-code="ArrowUp" aria-label="上へ">↑</button>
    <button class="left" data-code="ArrowLeft" aria-label="左へ">←</button>
    <button class="right" data-code="ArrowRight" aria-label="右へ">→</button>
    <button class="down" data-code="ArrowDown" aria-label="下へ">↓</button>
  `;
  document.body.appendChild(dpad);

  const keyNumber = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };

  function send(type, code) {
    const event = new KeyboardEvent(type, {
      key: code,
      code,
      keyCode: keyNumber[code],
      which: keyNumber[code],
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  dpad.querySelectorAll('button').forEach(btn => {
    const code = btn.dataset.code;
    const start = e => {
      e.preventDefault();
      btn.classList.add('pressed');
      send('keydown', code);
    };
    const stop = e => {
      if (e) e.preventDefault();
      btn.classList.remove('pressed');
      send('keyup', code);
    };
    btn.addEventListener('pointerdown', start, { passive: false });
    btn.addEventListener('pointerup', stop, { passive: false });
    btn.addEventListener('pointercancel', stop, { passive: false });
    btn.addEventListener('pointerleave', stop, { passive: false });
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop, { passive: false });
  });

  window.addEventListener('blur', () => {
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].forEach(code => send('keyup', code));
  });
})();
