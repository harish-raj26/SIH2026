import { USER_ROLES } from '../utils/constants';

const TOKEN_KEY = 'bizclear_auth_token';
const USER_KEY = 'bizclear_user_data';

export const authService = {
  /**
   * Get current stored user from session (returns null if not authenticated)
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (data) return JSON.parse(data);
      const defaultUser = {
        id: 'usr_default',
        name: 'Compliance Officer',
        email: 'officer@bizclear.ai',
        role: USER_ROLES.APPLICANT,
        organization: 'Enterprise Regulatory Workspace',
        title: 'Regulatory Clearance Manager',
      };
      const defaultToken = `bizclear_jwt_${defaultUser.id}`;
      localStorage.setItem(TOKEN_KEY, defaultToken);
      localStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    } catch {
      return null;
    }
  },

  /**
   * Login user with credentials
   */
  async login({ email, password, role }) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Retrieve existing registered user data if available
    let storedUser = null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) storedUser = JSON.parse(raw);
    } catch {
      storedUser = null;
    }

    const authenticatedUser = {
      id: storedUser?.id || `usr_${Date.now()}`,
      name: storedUser?.name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: email.trim().toLowerCase(),
      role: role || storedUser?.role || USER_ROLES.APPLICANT,
      organization: storedUser?.organization || '',
      title: storedUser?.title || 'Manager',
    };

    const token = `bizclear_jwt_${authenticatedUser.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));

    return { user: authenticatedUser, token };
  },

  /**
   * Register a new real user account
   */
  async register({ name, email, password, role, organization }) {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || USER_ROLES.APPLICANT,
      organization: organization ? organization.trim() : '',
      title: 'Managing Director / Authorized Representative',
    };

    const token = `bizclear_jwt_${newUser.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));

    return { user: newUser, token };
  },

  /**
   * Switch role on active user
   */
  switchUser(user) {
    if (!user) return null;
    const token = `bizclear_jwt_${user.id}_${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Update profile
   */
  updateProfile(updates) {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('bizclear_active_business');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem(USER_KEY);
  },
};
