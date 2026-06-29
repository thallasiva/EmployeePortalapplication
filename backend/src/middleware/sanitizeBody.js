'use strict';

/**
 * sanitizeBody middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Recursively walks req.body and strips HTML/XSS payloads from every string
 * field before the request reaches any controller.
 *
 * Approach: whitelist-strip — removes every HTML tag and all event-handler
 * attributes (onclick, onerror, etc.) without a heavy library dependency.
 * This is defence-in-depth on top of Joi validation which already strips
 * unknown keys.
 */

const TAG_REGEX  = /<[^>]*>/g;
const NULL_REGEX = /\0/g;

/**
 * Strips HTML tags and null bytes from a string.
 * @param {string} value
 * @returns {string}
 */
function cleanString(value) {
  return value
    .replace(NULL_REGEX, '')   // null-byte injection
    .replace(TAG_REGEX, '');   // HTML/script tags
}

/**
 * Recursively sanitize an object's string values.
 * Arrays and nested objects are walked; non-strings pass through.
 * @param {*} node
 * @returns {*}
 */
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
  // numbers, booleans — pass through
  return node;
}

/**
 * Express middleware: mutates req.body in-place, replacing strings with their
 * sanitized equivalents.
 */
function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeNode(req.body);
  }
  next();
}

module.exports = sanitizeBody;
