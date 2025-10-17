import Cookies from "js-cookie";

const TOKEN_KEY = "hobeom-portal-token";
const USER_KEY = "hobeom-portal-user";

export const cookieUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, {
      expires: 7,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  },

  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  setUser: (user: Record<string, unknown> | null) => {
    Cookies.set(USER_KEY, JSON.stringify(user), {
      expires: 7,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  },

  getUser: (): Record<string, unknown> | null => {
    const user = Cookies.get(USER_KEY);
    return user ? (JSON.parse(user) as Record<string, unknown>) : null;
  },

  removeUser: () => {
    Cookies.remove(USER_KEY);
  },

  clearAll: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
  },
};
