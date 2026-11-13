(() => {
  const root = document.querySelector('.ton-map');
  if (!root) return;

  const canvas = root.querySelector('.ton-map-canvas');
  const fallback = root.querySelector('.ton-map-fallback');
  const info = root.querySelector('.ton-map-info');
  const credit = root.querySelector('.ton-map-credit');
  const libraryUrl = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/';
  const visibilityThreshold = 0.25;
  let map;
  let creditTimer;
  let visible = false;
  let ready = false;
  let manuallyToggled = false;
  let started = false;

  function setCreditOpen(open) {
    info.setAttribute('aria-expanded', String(open));
    credit.hidden = !open;
  }

  function scheduleCollapse() {
    clearTimeout(creditTimer);
    if (ready && visible && !document.hidden && !manuallyToggled && !credit.hidden) {
      creditTimer = setTimeout(() => setCreditOpen(false), 5_000);
    }
  }

  info.addEventListener('click', () => {
    manuallyToggled = true;
    clearTimeout(creditTimer);
    setCreditOpen(credit.hidden);
  });

  credit.addEventListener('focusin', () => {
    manuallyToggled = true;
    clearTimeout(creditTimer);
  });

  document.addEventListener('visibilitychange', scheduleCollapse);

  function loadDependency(element, integrity) {
    return new Promise((resolve, reject) => {
      element.crossOrigin = 'anonymous';
      element.integrity = integrity;
      element.onload = resolve;
      element.onerror = reject;
      document.head.append(element);
    });
  }

  function loadLibrary() {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${libraryUrl}maplibre-gl.css`;
    const script = document.createElement('script');
    script.src = `${libraryUrl}maplibre-gl.js`;

    return Promise.all([
      loadDependency(stylesheet, 'sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK'),
      loadDependency(script, 'sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp'),
    ]);
  }

  async function startMap() {
    root.dataset.mapState = 'loading';
    const longitude = Number(root.dataset.longitude);
    const latitude = Number(root.dataset.latitude);
    const center = [longitude, latitude];

    const status = document.createElement('span');
    status.textContent = 'Загружаем карту…';
    status.setAttribute('role', 'status');
    fallback.prepend(status);

    function showFallback() {
      if (root.dataset.mapState === 'fallback') return;
      root.dataset.mapState = 'fallback';
      ready = false;
      clearTimeout(creditTimer);
      info.hidden = true;
      setCreditOpen(false);
      map?.remove();
      status.remove();

      const embed = new URL('https://www.openstreetmap.org/export/embed.html');
      embed.searchParams.set('bbox', [longitude - .0075, latitude - .0035, longitude + .0075, latitude + .0035].join(','));
      embed.searchParams.set('layer', 'mapnik');
      embed.searchParams.set('marker', [latitude, longitude].join(','));

      const frame = document.createElement('iframe');
      frame.className = 'ton-map-embed';
      frame.title = root.dataset.mapTitle;
      frame.src = embed.href;
      fallback.before(frame);
      fallback.classList.add('ton-map-route');
      fallback.hidden = false;
    }

    const loadTimer = setTimeout(showFallback, 8_000);

    try {
      await loadLibrary();
      if (root.dataset.mapState === 'fallback') return;

      map = new window.maplibregl.Map({
        container: canvas,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center,
        zoom: 15.5,
        attributionControl: false,
        cooperativeGestures: true,
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Удерживайте Ctrl и прокрутите для масштабирования',
          'CooperativeGesturesHandler.MacHelpText': 'Удерживайте ⌘ и прокрутите для масштабирования',
          'CooperativeGesturesHandler.MobileHelpText': 'Перемещайте карту двумя пальцами',
          'NavigationControl.ZoomIn': 'Приблизить',
          'NavigationControl.ZoomOut': 'Отдалить',
        },
      });
      const mapCanvas = map.getCanvas();
      mapCanvas.setAttribute('aria-label', root.dataset.mapTitle);
      mapCanvas.tabIndex = -1;
      map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }));
      new window.maplibregl.Marker({ color: '#202626' }).setLngLat(center).addTo(map);
      function showMap() {
        const hasMapData = map.queryRenderedFeatures().some(feature => feature.source === 'openmaptiles');
        if (!hasMapData) return;

        map.off('idle', showMap);
        clearTimeout(loadTimer);
        mapCanvas.tabIndex = 0;
        fallback.hidden = true;
        info.hidden = false;
        root.dataset.mapState = 'ready';
        ready = true;
        setCreditOpen(true);
        scheduleCollapse();
      }

      map.on('idle', showMap);
    } catch {
      clearTimeout(loadTimer);
      showFallback();
    }
  }

  if (!('IntersectionObserver' in window)) {
    visible = true;
    startMap();
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= visibilityThreshold;
    if (visible && !started) {
      started = true;
      startMap();
    }
    scheduleCollapse();
  }, { threshold: visibilityThreshold });
  observer.observe(root);
})();
