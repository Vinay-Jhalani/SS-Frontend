import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiService.setAuthToken(token);
      // Verify token by getting profile
      apiService
        .getProfile()
        .then((response) => {
          setUser(response.data.user);
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            apiService.setAuthToken(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      apiService.setAuthToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || { message: "Login failed" },
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await apiService.register(name, email, password);
      const { user, token } = response.data;

      localStorage.setItem("token", token);
      apiService.setAuthToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: "Registration failed",
        },
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    apiService.setAuthToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
