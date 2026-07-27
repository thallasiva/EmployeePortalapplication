function emptyValues(fields)
{
  return fields.reduce((acc, field) =>
  {
    acc[field.name] = field.defaultValue || "";
    return acc;
  }, {});
}

export default emptyValues;
