import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("slabby_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

export const fmtPct = (n) => `${(n >= 0 ? "+" : "")}${(n ?? 0).toFixed(2)}%`;
