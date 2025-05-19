import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// TODO: Install AsyncStorage with: npm install @react-native-async-storage/async-storage
// For now, use a temporary mock for AsyncStorage
const AsyncStorage = {
  getItem: async (key) => null,
  setItem: async (key, value) => {},
  removeItem: async (key) => {}
};

const authenticatedFetch = async (url, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return fetch(url, options);
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

export default function Sidebar({ onClose }) {
  const [user, setUser] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();

  const colors = {
    primary: '#6A89A7',
    secondary: '#BDDDFC',
    accent: '#88BDF2',
    dark: '#384959',
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      try {
        // Fetch user profile and notifications in parallel
        const [profileResponse, animalResponse, boutiqueResponse] = await Promise.all([
          authenticatedFetch("http://127.0.0.1:8000/api/auth/profile/"),
          authenticatedFetch("http://127.0.0.1:8000/api/animals/notifications/"),
          authenticatedFetch("http://127.0.0.1:8000/api/boutique/notifications/")
        ]);

        // Handle profile response
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData);
        }

        // Process notifications
        const processNotifications = async (response, type) => {
          if (!response.ok) return [];
          const data = await response.json();
          return Array.isArray(data) ? data.map(n => ({ ...n, type })) : [];
        };

        const [animalNotifications, boutiqueNotifications] = await Promise.all([
          processNotifications(animalResponse, 'animals'),
          processNotifications(boutiqueResponse, 'boutique')
        ]);

        const allNotifications = [...animalNotifications, ...boutiqueNotifications];
        setNotifications(allNotifications);
        setNotifCount(allNotifications.filter(n => !n.lu).length);

      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear all authentication tokens
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      navigation.navigate('Login');
    }
  };

  const handleNotifClick = async (notifId, notificationType) => {
    try {
      const endpoint = `http://127.0.0.1:8000/api/${notificationType}/notifications/${notifId}/read/`;
      await authenticatedFetch(endpoint, { method: "PUT" });

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notifId ? { ...notif, lu: true } : notif
        )
      );
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Notification update failed:", error);
    }
  };

  const isAuthenticated = () => !!user;
  const getCurrentUser = () => user?.nom || "Guest";

  const navigationItems = [
    { label: "Accueil", iconName: "home-outline", route: "Home" },
    { label: "Nos Animaux", iconName: "paw-outline", route: "Animals" },
    { label: "Service de Garde", iconName: "calendar-outline", route: "Daycare" },
    { label: "Boutique", iconName: "cart-outline", route: "Shop" },
    { label: "Evenements", iconName: "calendar-outline", route: "Events" },
    { label: "Blog", iconName: "newspaper-outline", route: "Blog" },
    { label: "FAQ", iconName: "help-circle-outline", route: "FAQ" },
  ];

  const renderNotifications = () => {
    if (!isNotificationOpen) return null;

    return (
      <SafeAreaView className="flex-1">
        <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <TouchableOpacity onPress={onClose} style={{ marginBottom: 20 }}>
        <Text style={{ color: 'blue' }}>Close Sidebar</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Sidebar Menu</Text>
        <View className={`w-64 h-full bg-[${colors.secondary}] border-r border-[${colors.primary}]`}>
          {/* Logo Section */}
          <View className="py-5 border-b border-[${colors.primary}] items-center">
            <Image 
              source={require('../assets/adoption.jpg')} 
              className="w-32 h-16 rounded-xl border-2 border-[${colors.primary}]"
            />
          </View>
  
          {/* Navigation Items */}
          <ScrollView className="flex-1">
            {navigationItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                className="flex-row items-center py-3 px-5 border-b border-[${colors.accent}] active:bg-[${colors.accent}]/20"
                onPress={() => navigation.navigate(item.route)}
              >
                <Ionicons 
                  name={item.iconName} 
                  size={24} 
                  color={colors.dark} 
                  className="mr-4"
                />
                <Text className={`text-[${colors.dark}] text-base font-medium`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
  
          {/* User Section */}
          <View className="p-4 border-t border-[${colors.primary}]">
            {isAuthenticated() ? (
              <>
                <View className="flex-row items-center justify-end mb-3">
                  <TouchableOpacity 
                    className="relative p-2"
                    onPress={() => setIsNotificationOpen(!isNotificationOpen)}
                  >
                    <Ionicons 
                      name="notifications-outline" 
                      size={24} 
                      color={colors.dark} 
                    />
                    {notifCount > 0 && (
                      <View className="absolute -top-1 -right-1 bg-[${colors.accent}] w-5 h-5 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                          {notifCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
  
                <TouchableOpacity 
                  className="flex-row items-center p-2 bg-[${colors.accent}]/20 rounded-full mb-3"
                  onPress={() => navigation.navigate('Profile')}
                >
                  <View className={`w-8 h-8 rounded-full bg-[${colors.primary}] items-center justify-center`}>
                    <Ionicons name="person" size={20} color="white" />
                  </View>
                  <Text className={`ml-3 text-[${colors.dark}] font-medium`}>
                    {getCurrentUser()}
                  </Text>
                </TouchableOpacity>
  
                <TouchableOpacity 
                  className="flex-row items-center justify-center p-3 bg-[${colors.primary}]/10 rounded-full"
                  onPress={handleLogout}
                >
                  <Ionicons 
                    name="log-out-outline" 
                    size={20} 
                    color={colors.dark} 
                  />
                  <Text className={`ml-2 text-[${colors.dark}] font-medium`}>
                    Déconnexion
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                className="flex-row items-center justify-center p-3 bg-[${colors.primary}] rounded-full"
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons name="log-in-outline" size={20} color="white" />
                <Text className="ml-2 text-white font-medium">Connexion</Text>
              </TouchableOpacity>
            )}
          </View>
  
          {/* Notification Panel */}
          {isNotificationOpen && (
            <View className={`absolute right-0 bottom-20 w-64 bg-[${colors.secondary}] border border-[${colors.primary}] rounded-lg shadow-lg`}>
              <Text className={`p-3 text-[${colors.dark}] font-semibold border-b border-[${colors.primary}]`}>
                Notifications
              </Text>
              <ScrollView className="max-h-64">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <TouchableOpacity
                      key={`${notif.type}-${notif.id}`}
                      className={`p-3 border-b border-[${colors.accent}] ${notif.lu ? 'bg-[#ffffff]' : 'bg-[${colors.accent}]/20'}`}
                      onPress={() => handleNotifClick(notif.id, notif.type)}
                    >
                      <Text className={`${notif.lu ? 'text-gray-500 line-through' : `text-[${colors.dark}]`}`}>
                        {notif.message}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="p-4 text-gray-500 text-center">
                    Aucune notification
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
        </View>
      </SafeAreaView>
  )}};