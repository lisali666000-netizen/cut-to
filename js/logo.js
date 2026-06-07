(function () {
  const logo = document.getElementById('logo-typewriter');
  const rest = document.querySelector('.hero__rest');

  if (!logo) return;

  const text = 'CUT TO';
  const speed = 140;
  let i = 0;

  const cursor = document.createElement('span');
  cursor.className = 'logo-type__cursor';
  cursor.setAttribute('aria-hidden', 'true');
  logo.appendChild(cursor);

  function type() {
    if (i < text.length) {
      const char = text[i] === ' ' ? '\u00A0' : text[i];
      logo.insertBefore(document.createTextNode(char), cursor);
      i++;
      setTimeout(type, speed);
    } else {
      setTimeout(() => {
        cursor.classList.add('is-hidden');
        if (rest) rest.classList.add('is-visible');
      }, 400);
    }
  }

  setTimeout(type, 300);
})();
