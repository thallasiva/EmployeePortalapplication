export function groupFieldOptions(rows = []) {
  return rows.reduce((grouped, row) => {
    const options = grouped[row.field_key] || [];
    options.push({ value: row.value, label: row.label });
    grouped[row.field_key] = options;
    return grouped;
  }, {});
}

export function fieldOptionsFor(options, key, currentValue) {
  const configured = options[key] || [];
  if (!currentValue || configured.some((option) => option.value === currentValue)) {
    return configured;
  }
  return [...configured, { value: currentValue, label: currentValue }];
}
