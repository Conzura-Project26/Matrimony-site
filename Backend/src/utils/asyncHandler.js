/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * Eliminates the need for try-catch in every async controller
 */

/**
 * Wraps an async function and catches any errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 * 
 * Usage:
 * export const getUsers = asyncHandler(async (req, res) => {
 *   const users = await User.findAll();
 *   res.json({ success: true, data: users });
 * });
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
