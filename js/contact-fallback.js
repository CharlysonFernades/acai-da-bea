(() => {
  const instagramLink = document.getElementById('contact-instagram');
  if (!instagramLink) return;

  const fallbackInstagramUrl = 'https://www.instagram.com/acaibea/';

  function keepInstagramAvailable() {
    if (!instagramLink.getAttribute('href')) {
      instagramLink.setAttribute('href', fallbackInstagramUrl);
    }
    if (instagramLink.hidden) {
      instagramLink.hidden = false;
    }
  }

  keepInstagramAvailable();

  // O painel pode deixar instagramUrl vazio. Nesse caso, mantém o perfil oficial
  // disponível sem interferir caso uma URL válida seja cadastrada futuramente.
  new MutationObserver(keepInstagramAvailable).observe(instagramLink, {
    attributes: true,
    attributeFilter: ['href', 'hidden']
  });
})();
