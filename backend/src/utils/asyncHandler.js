/**
 * Wraps an async route/controller handler so rejected promises are
 * forwarded to Express's error-handling middleware instead of crashing
 * the process.
 *
 * Usage: router.get('/', asyncHandler(controller.list))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
