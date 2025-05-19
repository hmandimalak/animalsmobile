// utils/authInterceptor.js
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ajouter l'import manquant

const API_BASE_URL = 'http://192.168.0.132:8000/api';

const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Refresh token expiré ou invalide');
      }
      throw new Error(`Erreur HTTP! statut: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Stockage asynchrone correct
    await AsyncStorage.multiSet([
      ['access_token', data.access],
      ['refresh_token', data.refresh]
    ]);
    
    return data.access;
  } catch (error) {
    // Nettoyage des tokens avec async/await
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    // Utilisez la navigation React Native au lieu de window.location
    navigation.navigate('Login'); // Ajoutez la logique de navigation
    throw error;
  }
};

export const authenticatedFetch = async (url, options = {}) => {
  try {
    // Récupération asynchrone correcte
    let accessToken = await AsyncStorage.getItem('access_token');
    
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        // Retirez le Content-Type par défaut pour les FormData
        ...(options.headers?.['Content-Type'] === 'multipart/form-data' 
          ? {} 
          : {'Content-Type': 'application/json'}
        )
      },
    });

    if (response.ok) return response;

    if (response.status === 401) {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const newAccessToken = await refreshAccessToken(refreshToken);
      
      // Nouvelle tentative avec le nouveau token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
          ...(options.headers?.['Content-Type'] === 'multipart/form-data' 
            ? {} 
            : {'Content-Type': 'application/json'}
          )
        },
      });
      
      return response;
    }

    return response;
    
  } catch (error) {
    console.error('Erreur fetch:', error);
    throw error;
  }
};