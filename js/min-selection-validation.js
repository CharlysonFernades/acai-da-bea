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
    .cart-clear-link-ui {
      display: block;
      width: fit-content;
      margin: 10px auto 0;
      padding: 6px 8px;
      border: 0;
      background: transparent;
      color: var(--purple-dark, #5a0b52);
      font: inherit;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
      box-shadow: none;
    }
    #order-start-new {
      min-height: auto;
      padding: 8px 10px;
      border: 0;
      background: transparent;
      color: var(--purple-dark, #5a0b52);
      box-shadow: none;
      text-decoration: underline;
      text-underline-offset: 3px;
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

  // O X do cabeçalho do carrinho serve exclusivamente para fechar o carrinho.
  // Ele não compartilha nenhuma ação com os controles que removem itens.
  const cartDrawer = document.getElementById('cart-drawer');
  const closeCartButton = document.getElementById('close-cart');
  const backdrop = document.getElementById('backdrop');
  if (cartDrawer && closeCartButton) {
    closeCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      cartDrawer.classList.remove('open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.hidden = true;
    }, true);
  }

  function normalizeRemoveButtons() {
    document.querySelectorAll('#cart-items [data-remove]').forEach((button) => {
      button.type = 'button';
      button.textContent = 'Remover item';
      button.classList.remove('dialog-close');
      button.classList.add('cart-item-remove');
    });
  }

  const cartItems = document.getElementById('cart-items');
  if (cartItems) {
    normalizeRemoveButtons();
    new MutationObserver(normalizeRemoveButtons).observe(cartItems, { childList: true, subtree: true });
  }

  function clearCart() {
    // Usa os próprios controles do carrinho para manter o estado interno do site sincronizado.
    let safety = 0;
    while (safety < 100) {
      const removeButton = document.querySelector('#cart-items [data-remove]');
      if (!removeButton) break;
      removeButton.click();
      safety += 1;
    }
  }

  const drawerFoot = document.querySelector('#cart-drawer .drawer-foot');
  if (drawerFoot && !document.getElementById('cart-clear-link')) {
    const clearButton = document.createElement('button');
    clearButton.id = 'cart-clear-link';
    clearButton.type = 'button';
    clearButton.className = 'cart-clear-link-ui';
    clearButton.textContent = 'Limpar carrinho';
    clearButton.addEventListener('click', clearCart);

    const helperText = drawerFoot.querySelector('small');
    if (helperText) helperText.insertAdjacentElement('beforebegin', clearButton);
    else drawerFoot.appendChild(clearButton);
  }

  // Depois de voltar do WhatsApp, a ação principal fica discreta: apenas "Limpar carrinho".
  const returnTitle = document.getElementById('order-return-title');
  const returnDescription = document.getElementById('order-return-description');
  const startNewOrder = document.getElementById('order-start-new');
  const continueOrder = document.getElementById('order-continue');
  if (returnTitle) returnTitle.textContent = 'Carrinho';
  if (returnDescription) returnDescription.textContent = 'O carrinho continua salvo.';
  if (startNewOrder) startNewOrder.textContent = 'Limpar carrinho';
  if (continueOrder) continueOrder.textContent = 'Manter carrinho';
})();
