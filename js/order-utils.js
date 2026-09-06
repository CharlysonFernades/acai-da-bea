// Regras compartilhadas pelo cardápio, carrinho e painel. Valores em centavos.
export const DEFAULT_IMAGE = 'assets/images/acai-330.webp';

export function formatCurrency(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100);
}

export function parseMoneyCents(value, { allowZero = false, optional = false } = {}) {
  const text = String(value ?? '').trim().replace(/^R\$\s*/, '');
  if (!text) return optional ? 0 : null;
  let normalized = text;
  if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(text)) normalized = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d+(?:[,.]\d{1,2})?$/.test(text)) normalized = text.replace(',', '.');
  else return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && (allowZero ? cents >= 0 : cents > 0) ? cents : null;
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function safeImageSource(value, fallback = DEFAULT_IMAGE) {
  const source = String(value || '').trim();
  if (safeExternalUrl(source)) return safeExternalUrl(source);
  if (/^(?:\.\/)?assets\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif|gif|svg)$/i.test(source) && !source.split('/').includes('..')) return source;
  return fallback;
}

export function normalizeWhatsApp(value) {
  const input = String(value || '').trim();
  if (!/^[+\d\s().-]+$/.test(input)) return '';
  let phone = input.replace(/\D/g, '');
  if (phone.length === 10 || phone.length === 11) phone = `55${phone}`;
  return /^55[1-9]\d\d{8,9}$/.test(phone) ? phone : '';
}

export function normalizeGroupId(value) {
  const key = String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_/g, '-');
  return ['acaicremes', 'acai-cremes', 'acai-e-cremes'].includes(key) ? 'acai-cremes' : key;
}

export function effectiveSelectionRules(product) {
  const name = `${product?.id || ''} ${product?.name || ''}`.toLowerCase();
  let inferred = {};
  if (name.includes('330')) inferred = { 'acai-cremes': 4, adicionais: 4, coberturas: 2 };
  else if (name.includes('750')) inferred = { 'acai-cremes': 6, adicionais: 6, coberturas: 2 };
  else if (/1\s?-?kg/.test(name)) inferred = { 'acai-cremes': 8, adicionais: 8, coberturas: 2 };
  const rules = {};
  for (const [id, maximum] of Object.entries(product?.selectionRules || {})) {
    const max = Number(maximum);
    if (Number.isInteger(max) && max > 0 && max <= 20) rules[normalizeGroupId(id)] = max;
  }
  if (!Object.keys(rules).length) return inferred;
  // Os tamanhos de açaí conhecidos continuam exigindo uma base, mesmo em cadastros antigos.
  if (inferred['acai-cremes'] && !rules['acai-cremes']) rules['acai-cremes'] = inferred['acai-cremes'];
  return rules;
}

export function findGroup(groups, id) {
  return groups.find(group => normalizeGroupId(group.id) === normalizeGroupId(id));
}

export function availableOptions(options, groupId) {
  return options.filter(option => normalizeGroupId(option.groupId) === normalizeGroupId(groupId) && option.available !== false &&
    Number.isSafeInteger(Number(option.extraPriceCents ?? 0)) && Number(option.extraPriceCents ?? 0) >= 0);
}

export function productUnavailableReason(product, groups, options) {
  if (!product || product.available === false) return 'Produto indisponível.';
  if (!Number.isSafeInteger(product.priceCents) || product.priceCents <= 0) return 'Preço em atualização.';
  const rules = effectiveSelectionRules(product);
  if (rules['acai-cremes']) {
    const group = findGroup(groups, 'acai-cremes');
    if (!group || group.available === false || !availableOptions(options, 'acai-cremes').length) return 'Sem opções de açaí ou creme disponíveis.';
  }
  return '';
}

function normalizeSelections(raw) {
  const selections = {};
  for (const [key, values] of Object.entries(raw || {})) {
    if (Array.isArray(values)) selections[normalizeGroupId(key)] = [...new Set(values.filter(value => typeof value === 'string'))];
  }
  return selections;
}

export function buildCartItem(product, raw, groups, options) {
  const unavailable = productUnavailableReason(product, groups, options);
  if (unavailable) return { error: unavailable };
  const rules = effectiveSelectionRules(product);
  const byId = Boolean(raw.selectionIds);
  const requested = normalizeSelections(byId ? raw.selectionIds : raw.selections);
  const labels = normalizeSelections(raw.selections);
  const selectionIds = {}, selections = {};
  let extraPriceCents = 0;
  for (const [groupId, values] of Object.entries(requested)) {
    if (values.length && !rules[groupId]) return { error: 'A personalização mudou. Escolha o produto novamente.' };
  }
  for (const [groupId, max] of Object.entries(rules)) {
    const values = requested[groupId] || [];
    const group = findGroup(groups, groupId);
    if (values.length > max) return { error: `Você pode escolher até ${max} opções nesse grupo.` };
    if (groupId === 'acai-cremes' && !values.length) return { error: 'Selecione no mínimo 1 opção.' };
    if (values.length && (!group || group.available === false)) return { error: 'Uma personalização ficou indisponível. Monte o item novamente.' };
    const allowed = availableOptions(options, groupId);
    const selected = [];
    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      let option = allowed.find(entry => byId ? entry.id === value : entry.name === value);
      // Migra carrinhos do catálogo provisório quando a loja cadastra a mesma opção oficial.
      if (!option && byId && value.startsWith('fallback-')) option = allowed.find(entry => entry.name === labels[groupId]?.[index]);
      if (!option) return { error: 'Uma opção ficou indisponível. Monte o item novamente.' };
      if (!selected.some(entry => entry.id === option.id)) selected.push(option);
    }
    selected.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    selectionIds[groupId] = selected.map(option => option.id);
    selections[groupId] = selected.map(option => option.name);
    extraPriceCents += selected.reduce((total, option) => total + Number(option.extraPriceCents || 0), 0);
  }
  const quantity = Math.min(99, Math.max(1, Number.isInteger(raw.quantity) ? raw.quantity : 1));
  const priceCents = product.priceCents + extraPriceCents;
  if (!Number.isSafeInteger(priceCents * quantity)) return { error: 'Preço em atualização.' };
  const itemNote = String(raw.itemNote ?? raw.note ?? '').trim().slice(0, 200);
  const fingerprint = JSON.stringify({ id: product.id, selectionIds: Object.fromEntries(Object.entries(selectionIds).sort()), itemNote });
  return { item: { id: product.id, fingerprint, name: product.name, basePriceCents: product.priceCents, extraPriceCents, priceCents, quantity, selectionIds, selections, itemNote } };
}

export function reconcileCart(cart, products, groups, options) {
  const items = [], messages = [];
  for (const previous of Array.isArray(cart) ? cart : []) {
    if (!previous || typeof previous !== 'object') continue;
    const product = products.find(entry => entry.id === (previous.id || previous.productId));
    const { item, error } = buildCartItem(product, previous, groups, options);
    if (error) { messages.push(`${previous.name || 'Item'}: ${error}`); continue; }
    const previousPrice = previous.priceCents ?? previous.unitPriceCents;
    if (previousPrice !== item.priceCents) messages.push(`${item.name}: preço atualizado para ${formatCurrency(item.priceCents)}.`);
    else if (previous.name !== item.name || JSON.stringify(normalizeSelections(previous.selections)) !== JSON.stringify(normalizeSelections(item.selections))) messages.push(`${item.name}: personalização atualizada.`);
    const found = items.find(entry => entry.fingerprint === item.fingerprint);
    if (found) found.quantity = Math.min(99, found.quantity + item.quantity);
    else items.push(item);
  }
  return { items, messages: [...new Set(messages)], changed: JSON.stringify(items) !== JSON.stringify(cart) };
}

export function summarizeSelections(selections, groups) {
  return Object.entries(selections || {}).filter(([, values]) => Array.isArray(values) && values.length)
    .map(([key, values]) => `${findGroup(groups, key)?.name || key}: ${values.join(', ')}`);
}

export function buildWhatsAppMessage(store, payload, groups) {
  const lines = [`Olá! Acabei de fazer meu pedido no ${store.name || 'Açaí da Bea'}!`, 'Segue os detalhes:', '', '────────────', '', '🛍️ *Itens do pedido*', ''];
  payload.items.forEach((item, index) => {
    lines.push(`${index + 1}. *${item.quantity}x ${item.name}* — ${formatCurrency(item.priceCents * item.quantity)}`);
    summarizeSelections(item.selections, groups).forEach(line => lines.push(`• ${line}`));
    if (item.extraPriceCents) lines.push(`• Adicionais pagos por unidade: ${formatCurrency(item.extraPriceCents)} (inclusos no valor)`);
    if (item.itemNote) lines.push(`• Observação do item: ${item.itemNote}`);
    lines.push('');
  });
  lines.push('────────────', '', `💰 *Total dos produtos:* ${formatCurrency(payload.total)}`, '', '*Cliente*', payload.name, '', '*Forma de atendimento*', payload.serviceLabel);
  if (payload.serviceType === 'delivery') {
    lines.push('', '*Endereço de entrega*', `${payload.address.street}, ${payload.address.number} - ${payload.address.neighborhood}`);
    if (payload.address.reference) lines.push(`Referência: ${payload.address.reference}`);
  }
  lines.push('', '*Observações*', payload.notes || '-', '', 'Por favor, podem confirmar a disponibilidade do pedido?', '', 'Obrigado!');
  return lines.join('\n');
}
