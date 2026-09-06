function normalizeGroupId(value) {
  const key = String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_/g, '-');
  return ['acaicremes', 'acai-cremes', 'acai-e-cremes'].includes(key) ? 'acai-cremes' : key;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

export function buildCheckoutReadPlan(cart, cachedGroups = []) {
  const productIds = [];
  const groupKeys = [];
  const optionIds = [];
  let requiresFullCatalog = false;

  for (const item of Array.isArray(cart) ? cart : []) {
    if (!item || typeof item !== 'object') continue;
    const productId = String(item.id || item.productId || '').trim();
    if (productId) productIds.push(productId);

    const legacySelections = item.selections && typeof item.selections === 'object'
      ? Object.values(item.selections).some(values => Array.isArray(values) && values.length)
      : false;
    const selectionIds = item.selectionIds;
    if (!selectionIds || typeof selectionIds !== 'object' || Array.isArray(selectionIds)) {
      if (legacySelections) requiresFullCatalog = true;
      continue;
    }
    if (!Object.keys(selectionIds).length && legacySelections) requiresFullCatalog = true;

    for (const [groupId, values] of Object.entries(selectionIds)) {
      groupKeys.push(groupId);
      if (Array.isArray(values)) optionIds.push(...values);
    }
  }

  const normalizedGroups = Array.isArray(cachedGroups) ? cachedGroups : [];
  const groupIds = uniqueStrings(groupKeys).map(groupKey => {
    const cached = normalizedGroups.find(group => normalizeGroupId(group?.id) === normalizeGroupId(groupKey));
    return cached?.id || groupKey;
  });

  return {
    productIds: uniqueStrings(productIds),
    groupIds: uniqueStrings(groupIds),
    optionIds: uniqueStrings(optionIds),
    requiresFullCatalog
  };
}

export function mergeFreshDocuments(cached, fresh, requestedIds) {
  const requested = new Set(uniqueStrings(Array.isArray(requestedIds) ? requestedIds : []));
  const kept = (Array.isArray(cached) ? cached : []).filter(item => item?.id && !requested.has(item.id));
  const replacements = (Array.isArray(fresh) ? fresh : []).filter(item => item?.id);
  const byId = new Map([...kept, ...replacements].map(item => [item.id, item]));
  return [...byId.values()];
}
