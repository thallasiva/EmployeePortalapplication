'use strict';













const TAG_REGEX = /<[^>]*>/g;
const NULL_REGEX = /\0/g;






function cleanString(value) {
  return value.
  replace(NULL_REGEX, '').
  replace(TAG_REGEX, '');
}







function sanitizeNode(node) {
  if (node === null || node === undefined) return node;
  if (typeof node === 'string') return cleanString(node);
  if (Array.isArray(node)) return node.map(sanitizeNode);
  if (typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) {
      out[key] = sanitizeNode(node[key]);
    }
    return out;
  }

  return node;
}





function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeNode(req.body);
  }
  next();
}

module.exports = sanitizeBody;
