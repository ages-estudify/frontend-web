const TOKEN_KEY = 'estudify_token';
const ROLE_KEY = 'estudify_role';
const PLAN_KEY = 'estudify_plan_active';

export const storage = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  setRole: (role: string) => localStorage.setItem(ROLE_KEY, role),
  getRole: () => localStorage.getItem(ROLE_KEY),

  setPlanActive: (active: boolean) => localStorage.setItem(PLAN_KEY, String(active)),
  getPlanActive: () => localStorage.getItem(PLAN_KEY) === 'true',

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PLAN_KEY);
  },
};
