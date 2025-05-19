export const TOKEN_KEY = "store_rating_token";
export const ROLE_KEY = "store_rating_role";

export const saveAuthData = (token, role) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUserRole = () => localStorage.getItem(ROLE_KEY);

export const isLoggedIn = () => !!getToken();

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};
