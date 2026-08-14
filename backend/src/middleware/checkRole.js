// checkRole.js — Validates user role and suspension status.
// MUST be used AFTER the authenticate middleware, which sets req.user and req.userProfile.
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.userProfile;

      if (!user) {
        return res.status(404).json({ message: 'User profile not found. Please complete registration.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Server error during authorization.' });
    }
  };
};
