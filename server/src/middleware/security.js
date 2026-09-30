/**
 * Middleware that rejects state-changing requests lacking the X-Requested-With header
 * as standard CSRF protection for cookie-authenticated sessions.
 */
export function csrfProtection(req, res, next) {
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (stateChangingMethods.includes(req.method)) {
    const customHeader = req.headers['x-requested-with'];
    if (!customHeader) {
      return res.status(403).json({
        error: 'Forbidden: Missing required security header (X-Requested-With)',
      });
    }
  }

  next();
}
