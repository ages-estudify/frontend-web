const TOKEN_KEY = 'estudify_token'
const ROLE_KEY = 'estudify_role'
const PLAN_KEY = 'estudify_plan_expiration'

export const storage = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  setRole: (role: string) => localStorage.setItem(ROLE_KEY, role),
  getRole: () => localStorage.getItem(ROLE_KEY),

  setPlanExpiration: (date: string) => localStorage.setItem(PLAN_KEY, date),
  getPlanExpiration: () => localStorage.getItem(PLAN_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(PLAN_KEY)
  },
}