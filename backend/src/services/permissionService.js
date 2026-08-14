export const PERMISSIONS = {
  // User Permissions
  CREATE_PROFILE: 'create_profile',
  MANAGE_OWN_PROFILE: 'manage_own_profile',
  EXCHANGE_SKILLS: 'exchange_skills',
  CREATE_GIGS: 'create_gigs',
  MESSAGING: 'messaging',
  JOIN_SESSIONS: 'join_sessions',
  CREATE_REVIEWS: 'create_reviews',
  VIEW_ANALYTICS: 'view_analytics',

  // Admin Permissions
  MANAGE_USERS: 'manage_users',
  MODERATE_GIGS: 'moderate_gigs',
  VIEW_REPORTS: 'view_reports',
  SUSPEND_USERS: 'suspend_users',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  ACCESS_ADMIN_ROUTES: 'access_admin_routes',
};

export const USER_PERMISSIONS = [
  PERMISSIONS.CREATE_PROFILE,
  PERMISSIONS.MANAGE_OWN_PROFILE,
  PERMISSIONS.EXCHANGE_SKILLS,
  PERMISSIONS.CREATE_GIGS,
  PERMISSIONS.MESSAGING,
  PERMISSIONS.JOIN_SESSIONS,
  PERMISSIONS.CREATE_REVIEWS,
  PERMISSIONS.VIEW_ANALYTICS,
];

export const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.MODERATE_GIGS,
  PERMISSIONS.VIEW_REPORTS,
  PERMISSIONS.SUSPEND_USERS,
  PERMISSIONS.VIEW_PLATFORM_ANALYTICS,
  PERMISSIONS.ACCESS_ADMIN_ROUTES,
];

/**
 * Returns default permissions based on role
 * @param {String} role - 'user' or 'admin'
 * @returns {Array<String>} Array of permissions
 */
export const getDefaultPermissions = (role) => {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS;
  }
  return USER_PERMISSIONS;
};
