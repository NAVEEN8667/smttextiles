import axios from 'axios';

const fallbackApiUrl = 'http://localhost:5000/api';
const rawApiUrl = import.meta.env.VITE_API_URL || fallbackApiUrl;

export const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

axios.defaults.baseURL = API_BASE_URL;
