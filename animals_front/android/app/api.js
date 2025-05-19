// api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.132:8000/api';

const safeJsonParse = async (response) => {
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (e) {
    console.error('JSON parse error:', e);
    throw new Error('Failed to parse response as JSON');
  }
};

const authenticatedFetch = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  return response;
};

const api = {
  fetchDefinitiveAnimals: async () => {
    const response = await authenticatedFetch('/animals/mes-animaux-definitive/');
    return safeJsonParse(response);
  },
  fetchTemporaryAnimals: async () => {
    const response = await authenticatedFetch('/animals/mes-animaux-temporaire/');
    return safeJsonParse(response);
  },
  fetchAdoptedAnimals: async () => {
    const response = await authenticatedFetch('/animals/mes-adoptions/');
    return safeJsonParse(response);
  },
  fetchAnimalDetails: async (animalId) => {
    const response = await api.authenticatedFetch(`/animals/${animalId}/`);
    return safeJsonParse(response);
  },
  
  fetchOrders: async () => {
    const response = await api.authenticatedFetch('/boutique/mes-commandes/');
    return safeJsonParse(response);
  }
};


export default api;
