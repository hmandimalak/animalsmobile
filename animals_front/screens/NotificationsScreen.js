// NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'tailwind-react-native-classnames';
// Helper function to safely get authentication token from AsyncStorage
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token ? `Bearer ${token}` : null;
  } catch (e) {
    console.error("Error getting token", e);
    return null;
  }
};

// Function to fetch notifications from both animal and boutique APIs
const fetchNotifications = async (token) => {
  try {
    const headers = { Authorization: token };
    
    // Make parallel requests to both endpoints for better performance
    const [animalRes, boutiqueRes] = await Promise.all([
      fetch("http://192.168.0.132:8000/api/animals/notifications/", { headers }),
      fetch("http://192.168.0.132:8000/api/boutique/notifications/", { headers }),
    ]);
    
    // Helper function to safely parse API responses
    const parse = async (res, type) => {
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) 
        ? data.map(n => ({ 
            ...n, 
            type, 
            category: type === 'animals' ? 'Animal' : 'Boutique' 
          })) 
        : [];
    };

    // Parse both response types and combine them
    const animalNotifs = await parse(animalRes, "animals");
    const boutiqueNotifs = await parse(boutiqueRes, "boutique");
    
    // Combine and sort by date (newest first)
    return [...animalNotifs, ...boutiqueNotifs]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("Failed to fetch notifications", err);
    return [];
  }
};

// Function to mark a notification as read
const markAsRead = async (notifId, type, token) => {
  try {
    const url = `http://192.168.0.132:8000/api/${type}/notifications/${notifId}/read/`;
    await fetch(url, {
      method: "PUT",
      headers: { Authorization: token },
    });
  } catch (err) {
    console.error("Failed to mark notification as read", err);
  }
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load notifications with proper loading states
  const loadNotifications = async () => {
    setLoading(true);
    const authToken = await getAuthToken();
    setToken(authToken);
    
    if (authToken) {
      const notifs = await fetchNotifications(authToken);
      setNotifications(notifs);
    }
    
    setLoading(false);
  };

  // Function to handle refresh with separate refreshing state
  const handleRefresh = async () => {
    setRefreshing(true);
    const authToken = await getAuthToken();
    
    if (authToken) {
      const notifs = await fetchNotifications(authToken);
      setNotifications(notifs);
    }
    
    setRefreshing(false);
  };

  // Handle notification press - mark as read and potentially navigate
  const handlePress = async (notif) => {
    if (!notif.lu && token) {
      await markAsRead(notif.id, notif.type, token);
      
      // Update local state to reflect read status
      setNotifications(prev => 
        prev.map(n => 
          (n.id === notif.id && n.type === notif.type) 
            ? { ...n, lu: true } 
            : n
        )
      );
    }
    // Add navigation logic here based on notification type
    // For example: navigation.navigate('NotificationDetail', { notification: notif });
  };

  // Load notifications when component mounts
  useEffect(() => {
    loadNotifications();
  }, []);

  // Render loading state
    if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-100 justify-center items-center`}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={tw`mt-4 text-gray-500`}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={tw`p-4`}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
        />
      }
    >
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <TouchableOpacity 
            key={`${notif.type}-${notif.id}`}
            onPress={() => handlePress(notif)}
            style={[
              styles.notificationCard,
              tw`mb-4`,
              { backgroundColor: notif.lu ? '#f5f5f5' : '#ffffff' }
            ]}
          >
            <View style={tw`flex-row items-start`}>
              {/* Category indicator */}
              <View style={tw`w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-4`}>
                <Text style={tw`text-white font-bold text-xl`}>
                  {notif.category?.charAt(0) || 'N'}
                </Text>
              </View>
              
              {/* Content */}
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-lg mb-1`}>
                  {notif.titre || 'No Title'}
                </Text>
                <Text style={tw`text-gray-600 text-sm`}>
                  {notif.message || 'No message'}
                </Text>
                <Text style={tw`text-xs text-gray-400 mt-2`}>
                  {notif.date ? new Date(notif.date).toLocaleString() : 'No date'}
                </Text>
              </View>
              
              {/* Unread indicator */}
              {!notif.lu && (
                <View style={tw`bg-red-500 w-3 h-3 rounded-full ml-auto`} />
              )}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={tw`flex-1 items-center justify-center py-20`}>
          <Text style={tw`text-gray-500 text-lg`}>Aucune notification</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});