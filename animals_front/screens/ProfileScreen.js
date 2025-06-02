import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet, 
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Icons from 'react-native-feather';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Updated to match web application's blue palette
const colors = {
  primary: '#6A89A7',     // Main brand color
  secondary: '#BDDDFC',   // Light background/container
  accent: '#88BDF2',      // Interactive elements
  dark: '#384959',        // Dark text/headers
  white: '#FFFFFF',
  gray: '#718096',        // Lighter gray for secondary text
  lightGray: '#E2E8F0',   // Very light gray for borders
  text: '#4a4a4a',
  cardBackground: '#FFFFFF',
};

const API_BASE_URL = 'http://192.168.0.188:8002/api';

// Centralized API service
const api = {
  authenticatedFetch: async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'API request failed');
    }
    
    return response;
  },
  
  fetchUserProfile: async () => {
    const response = await api.authenticatedFetch('/auth/profile/');
    return response.json();
  },
};

const Profile = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchUserProfile();
      setUser(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile: " + err.message);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          navigation.navigate('Login');
          return;
        }
        fetchUserData();
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };
    
    checkAuth();
  }, [navigation, fetchUserData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          onPress={fetchUserData}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Blue Profile Header */}
      <View style={styles.profileHeaderContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mon Profil</Text>
          
          <TouchableOpacity 
            onPress={async () => {
              await AsyncStorage.removeItem('access_token');
              navigation.navigate('Login');
            }}
          >
            <Icons.LogOut width={24} height={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileContent}>
          {user?.profilepicture ? (
            <Image 
              source={{ uri: user.profilepicture }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icons.User width={60} height={60} color={colors.white} />
            </View>
          )}
          
          <Text style={styles.profileName}>
            {user?.nom} {user?.prenom}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email}
          </Text>
        </View>
      </View>

      {/* Spacer between header and content */}
      <View style={styles.spacer} />

      {/* Main Content */}
      <ScrollView style={styles.scrollContainer}>
        {/* Container for Icons and Data */}
        <View style={styles.contentContainer}>
          {/* Horizontal Menu Buttons */}
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Definitive')}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: 'white' }]}>
                <Icons.Heart width={24} height={24} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Garde Définitive</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Temporaire')}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: 'white' }]}>
                <Icons.Clock width={24} height={24} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Garde Temporaire</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Adoptions')}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: 'white' }]}>
                <Icons.Home width={24} height={24} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Mes adoptions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Mescommandes')}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: 'white' }]}>
                <Icons.ShoppingBag width={24} height={24} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Mes commandes</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.white }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nom complet:</Text>
              <Text style={styles.detailValue}>
                {user?.nom} {user?.prenom}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Téléphone:</Text>
              <Text style={styles.detailValue}>
                {user?.telephone || 'Non spécifié'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Adresse:</Text>
              <Text style={styles.detailValue}>
                {user?.adresse || 'Non spécifiée'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={[styles.editButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.editButtonText}>Modifier le profil</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version 2.3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white
  },
  errorText: {
    color: colors.dark,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center'
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold'
  },
  scrollContainer: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
  profileHeaderContainer: {
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height:  3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  backButton: {
    padding: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: colors.secondary, // Light blue background
    borderRadius: 16,
    margin: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  menuItem: {
    alignItems: 'center',
    width: 80,
  },
  menuIconWrapper: {
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark, // Dark text
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#eaf5ff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changeText: {
    color: colors.primary,
    fontWeight: '500',
  },
  editButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionText: {
    color: colors.gray,
    fontSize: 14,
  },
});

export default Profile;