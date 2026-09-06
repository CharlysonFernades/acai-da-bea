(() => {
  const form = document.getElementById('product-form');
  if (!form) return;

  const style = document.createElement('style');
  style.textContent = `
    .minimum-selection-error {
      margin: 10px 0 0;
      padding: 10px 12px;
      border-radius: 12px;
      background: #fff0f1;
      color: #9b2431;
      border: 1px solid rgba(155, 36, 49, .22);
      font-size: .92rem;
      font-weight: 800;
    }
    .option-group.minimum-selection-invalid {
      border-color: rgba(155, 36, 49, .55);
      box-shadow: 0 0 0 3px rgba(155, 36, 49, .08);
    }
  `;
  document.head.appendChild(style);

  function getRequiredCreamGroup() {
    return form.querySelector('[data-group="acaiCremes"], [data-group="acai-cremes"]');
  }

  function hideError(group) {
    if (!group) return;
    group.classList.remove('minimum-selection-invalid');
    const error = group.querySelector('.minimum-selection-error');
    if (error) error.hidden = true;
  }

  function showError(group) {
    let error = group.querySelector('.minimum-selection-error');
    if (!error) {
      error = document.createElement('div');
      error.className = 'minimum-selection-error';
      error.setAttribute('role', 'alert');
      error.textContent = 'Selecione no mínimo 1 opção.';
      const help = group.querySelector('.option-help');
      if (help) help.insertAdjacentElement('afterend', error);
      else group.prepend(error);
    }

    error.hidden = false;
    group.classList.add('minimum-selection-invalid');

    requestAnimationFrame(() => {
      group.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        group.querySelector('input[type="checkbox"]')?.focus({ preventScroll: true });
      }, 350);
    });
  }

  form.addEventListener('submit', (event) => {
    // Só valida quando a intenção é realmente adicionar o item ao pedido.
    // Fechar/cancelar o modal nunca deve exigir personalização.
    if (event.submitter && !event.submitter.matches('[data-add-product]')) return;

    const group = getRequiredCreamGroup();
    if (!group) return;

    const selected = group.querySelector('input[type="checkbox"]:checked');
    if (selected) {
      hideError(group);
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    showError(group);
  }, true);

  form.addEventListener('change', (event) => {
    const group = getRequiredCreamGroup();
    if (!group || !group.contains(event.target)) return;
    if (group.querySelector('input[type="checkbox"]:checked')) hideError(group);
  });
})();
