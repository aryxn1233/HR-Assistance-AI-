import axios from 'axios';
import { getFreshToken } from '@/lib/tokenManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3003';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to manually set the auth token (kept for legacy support)
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Request interceptor: always get a fresh Clerk token before every request
api.interceptors.request.use(
    async (config) => {
        const token = await getFreshToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("API 401 Error - Unauthorized");
        }
        return Promise.reject(error);
    }
);

export default api;
