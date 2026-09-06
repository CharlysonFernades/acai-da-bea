(() => {
  const input = document.getElementById('login-password');
  const button = document.getElementById('toggle-password');
  if (!input || !button) return;

  button.addEventListener('click', () => {
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Mostrar' : 'Ocultar';
    button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    button.setAttribute('aria-pressed', showing ? 'false' : 'true');
    input.focus({ preventScroll: true });
  });
})();
