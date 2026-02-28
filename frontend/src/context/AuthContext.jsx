import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { connectWallet, getWalletBalance, formatAddress } from "../utils/web3";
import { authAPI } from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ address: null, balance: null, connected: false });
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    checkWalletConnection();
    setLoading(false);
  }, []);

  const checkWalletConnection = async () => {
    if (!window.ethereum) return;
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      const balance = await getWalletBalance(accounts[0]);
      setWallet({ address: accounts[0], balance, connected: true });
    }
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setWallet({ address: null, balance: null, connected: false });
    } else {
      const balance = await getWalletBalance(accounts[0]);
      setWallet({ address: accounts[0], balance, connected: true });
    }
  };

  const handleConnectWallet = useCallback(async () => {
    try {
      const address = await connectWallet();
      const balance = await getWalletBalance(address);
      setWallet({ address, balance, connected: true });
      toast.success(`Wallet connected: ${formatAddress(address)}`);
      return address;
    } catch (err) {
      toast.error(err.message || "Failed to connect wallet");
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));
    setUser(data.user);
    toast.success("Account created successfully!");
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
    toast("Logged out", { icon: "👋" });
  }, []);

  const isNGO   = user?.role === "ngo";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user, wallet, loading,
      isNGO, isAdmin,
      login, register, logout,
      connectWallet: handleConnectWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
