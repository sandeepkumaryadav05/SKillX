// asyncHandler.js — Eliminates manual try/catch in async route handlers.
// Wrap any async (req, res, next) handler with asyncHandler() and any
// thrown error or rejected promise is automatically forwarded to next(err),
// which feeds into the global 4-argument error middleware in index.js.
//
// Usage:
//   router.get('/path', asyncHandler(async (req, res) => {
//     const data = await someDbCall();
//     res.json(data);
//   }));

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
