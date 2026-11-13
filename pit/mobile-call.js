(() => {
  const slot = document.querySelector('.closing-call');
  const hero = document.querySelector('.hero');
  const mobile = window.matchMedia('(width < 740px)');
  let dockInset = 0;
  let frame = 0;

  function update() {
    frame = 0;
    const docked = mobile.matches && hero.getBoundingClientRect().bottom <= 0 &&
      slot.getBoundingClientRect().bottom > window.innerHeight - dockInset;
    slot.classList.toggle('is-docked', docked);
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function refreshInset() {
    dockInset = parseFloat(getComputedStyle(slot).scrollMarginBottom) || 0;
    scheduleUpdate();
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', refreshInset);
  mobile.addEventListener('change', refreshInset);
  new ResizeObserver(scheduleUpdate).observe(document.querySelector('main'));
  refreshInset();
})();
