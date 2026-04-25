/**
 * ============================================================
 *  AURA API Client
 * ============================================================
 *  Centralized Axios instance used by frontend API calls.
 *
 *  [API ENDPOINT]: GET/POST/PATCH/DELETE /api/*
 *  [DATA SYNC]: Keep all request base config/interceptors here
 *  so every feature (menu, orders, users, ratings, payments)
 *  behaves consistently.
 *
 *  [BACKEND INTEGRATION]
 *  - Automatically adds JWT token to all requests
 *  - Handles 401 responses (token expired)
 *  - Logs all errors to console
 * ============================================================
 */

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add JWT token to all requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - token may be expired
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            console.warn('Authentication token expired. Please login again.');
            // Optionally redirect to login page
            // window.location.href = '/login';
        }
        
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        
        return Promise.reject(error);
    }
);

export default axiosInstance;
