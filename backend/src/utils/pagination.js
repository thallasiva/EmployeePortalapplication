


function getPagination(query, defaultLimit = 20, maxLimit = 100) {
  let page = Number(query.page) || 1;
  let limit = Number(query.limit) || defaultLimit;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0
  };
}

module.exports = { getPagination, buildMeta };
