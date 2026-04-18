/**
 * ============================================================
 *  AURA API Client
 * ============================================================
 *  Centralized Axios instance used by frontend API calls.
 *
 *  [API ENDPOINT]: GET/POST/PATCH/DELETE /api/v1/*
 *  [DATA SYNC]: Keep all request base config/interceptors here
 *  so every feature (menu, orders, users, ratings, payments)
 *  behaves consistently.
 *
 *  [BACKEND INTEGRATION: TODO]
 *  Add auth token request interceptor and 401 refresh logic.
 * ============================================================
 */

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;
