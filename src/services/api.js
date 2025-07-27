import axios from 'axios';

const API_URL = 'https://consultancy-backend-1xug.vercel.app';

console.log('🚀 Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;