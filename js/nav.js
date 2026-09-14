(function () {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');

  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click', function () {
    setOpen(!panel.classList.contains('is-open'));
  });

  const desktop = window.matchMedia('(min-width: 48rem)');
  desktop.addEventListener('change', function (event) {
    if (event.matches) setOpen(false);
  });

  panel.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setOpen(false);
    });
  });

  setOpen(false);
  document.body.classList.add('nav-ready');
})();
