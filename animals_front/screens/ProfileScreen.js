import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// Correct import for react-native-feather icons
import * as Icons from 'react-native-feather';
// Secure Storage for token
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to safely parse JSON responses
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

// Centralized API service with authentication
const api = {
  baseUrl: 'http://192.168.0.132:8000/api',
  
  authenticatedFetch: async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };
    
    const response = await fetch(`${api.baseUrl}${endpoint}`, mergedOptions);
    return response;
  },
  
  fetchUserProfile: async () => {
    const response = await api.authenticatedFetch('/auth/profile/');
    return safeJsonParse(response);
  },
  fetchTemporaryAnimals: async () => {
    const response = await api.authenticatedFetch('/animals/mes-animaux-temporaire/');
    return safeJsonParse(response);
  },
  
  fetchDefinitiveAnimals: async () => {
    const response = await api.authenticatedFetch('/animals/mes-animaux-definitive/');
    return safeJsonParse(response);
  },
  
  fetchAdoptedAnimals: async () => {
    const response = await api.authenticatedFetch('/animals/mes-adoptions/');
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

// Helper function to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return imagePath.startsWith('http') ? imagePath : `http://192.168.0.132:8000${imagePath}`;
};

// Define color scheme based on the design
const colors = {
  primary: '#e899a3', // pastel pink from the design
  secondary: '#f6e6e8', // light pink background
  dark: '#333333',
  white: '#FFFFFF',
  gray: '#AAAAAA',
  lightGray: '#EEEEEE',
  error: '#FF6B6B',
  success: '#4CAF50',
};

const Profile = () => {
  const navigation = useNavigation();
  
  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [garderieType, setGarderieType] = useState(null);
  const [showGarderieOptions, setShowGarderieOptions] = useState(false);
  
  // Data states
  const [animals, setAnimals] = useState([]);
  const [adoptedAnimals, setAdoptedAnimals] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // UI states
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      
      fetchUserData();
    };
    
    checkAuth();
  }, [navigation]);
  
  // Fetch user profile data
  // Modified fetchUserData to prevent recursion
  const fetchUserData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      let token = await AsyncStorage.getItem('access_token');

      // Initial fetch attempt
      let response = await fetch(`${api.baseUrl}/auth/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // Handle token expiration
      if (response.status === 401 && retryCount === 0) {
        const newToken = await refreshToken();
        if (newToken) {
          // Retry with new token
          return fetchUserData(1); // Pass retry count to prevent loops
        }
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${text}`);
      }

      const data = await response.json();
      setUser(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile: " + err.message);
      
      if (err.message.includes("401")) {
        navigation.navigate("Login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigation]);
  
  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.navigate("Login");
        return null;
      }

      const response = await fetch(`${api.baseUrl}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (!response.ok) {
        Alert.alert("Session Expired", "Please log in again.");
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        navigation.navigate("Login");
        return null;
      }

      const data = await response.json();
      await AsyncStorage.setItem('access_token', data.access);
      return data.access;
    } catch (err) {
      console.error("Error refreshing token:", err);
      Alert.alert("Error", "Failed to refresh session. Please log in again.");
      navigation.navigate("Login");
      return null;
    }
  };
  
  // Handle active section changes
  useEffect(() => {
    // Reset loading state when changing sections
    if (activeSection !== "editProfile") {
      setLoading(true);
    }
    
    const fetchSectionData = async () => {
      try {
        switch(activeSection) {
          case "profile":
            await fetchUserData();
            break;
            
          case "garderie":
            if (garderieType === "temporaire") {
              const data = await api.fetchTemporaryAnimals();
              setAnimals(data || []);
            } else if (garderieType === "definitive") {
              const data = await api.fetchDefinitiveAnimals();
              setAnimals(data || []);
            }
            setError(null);
            break;
            
          case "adoptions":
            const adoptionsData = await api.fetchAdoptedAnimals();
            setAdoptedAnimals(adoptionsData || []);
            setError(null);
            break;
            
          case "commandes":
            const ordersData = await api.fetchOrders();
            setOrders(ordersData || []);
            setError(null);
            break;
            
          case "editProfile":
            // No need to fetch data here
            break;
        }
      } catch (err) {
        console.error(`Error loading data for section ${activeSection}:`, err);
        setError(`Failed to load data for ${activeSection}: ${err.message}`);
        
        // Set empty arrays on error to avoid using stale data
        if (activeSection === "garderie") setAnimals([]);
        if (activeSection === "adoptions") setAdoptedAnimals([]);
        if (activeSection === "commandes") setOrders([]);
      } finally {
        if (activeSection !== "editProfile") {
          setLoading(false);
        }
      }
    };
    
    if (activeSection !== "editProfile") {
      fetchSectionData();
    }
  }, [activeSection, garderieType, fetchUserData]);
  
  // Handle animal selection for modal
  const handleAnimalClick = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await api.fetchAnimalDetails(id);
      setSelectedAnimal(data);
      setIsModalOpen(true);
      setError(null);
    } catch (err) {
      console.error("Error fetching animal details:", err);
      setError("Failed to load animal details: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle section change
  const handleSectionChange = useCallback((section, garderieOption = null) => {
    setActiveSection(section);
    if (garderieOption) {
      setGarderieType(garderieOption);
    }
  }, []);
  
  const closeModal = () => {
    setSelectedAnimal(null);
    setIsModalOpen(false);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    handleSectionChange("profile");
  };
  
  // Format animal age
  const formatAge = (dateString) => {
    if (!dateString) return "Âge inconnu";
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    // Calculate years and months
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    // Adjust for month difference
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }
    
    // Handle negative months
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Build age string
    let ageParts = [];
    if (years > 0) {
        ageParts.push(`${years} an${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
        ageParts.push(`${months} mois`);
    }
    
    return ageParts.join(' et ') || 'Nouveau-né';
  };
  
  // Loading screen
  if (loading && !user) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // Error screen
  if (error && !user) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white, padding: 16}}>
        <Text style={{color: 'red', fontSize: 20, fontWeight: 'bold', marginBottom: 8}}>Error</Text>
        <Text style={{color: '#555', marginBottom: 16, textAlign: 'center'}}>{error}</Text>
        <TouchableOpacity 
          onPress={() => {fetchUserData(); setError(null);}}
          style={{paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 8}}
        >
          <Text style={{color: colors.white, fontWeight: 'bold'}}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Animal Card Component
  const AnimalCard = ({ animal }) => (
    <TouchableOpacity 
      style={{
        backgroundColor: colors.white, 
        borderRadius: 12, 
        overflow: 'hidden', 
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      }}
      onPress={() => handleAnimalClick(animal.id)}
      activeOpacity={0.7}
    >
      <View style={{height: 192, position: 'relative'}}>
        {animal.image ? (
          <Image
            source={{ uri: getImageUrl(animal.image) }}
            style={{width: '100%', height: '100%', resizeMode: 'cover'}}
            defaultSource={require('../assets/dogandcat.jpeg')}
          />
        ) : (
          <View style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee'}}>
            <Text style={{color: '#888', fontStyle: 'italic'}}>Pas de photo disponible</Text>
          </View>
        )}
      </View>
      <View style={{padding: 16}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', color: '#333'}}>{animal.nom}</Text>
        <Text style={{fontSize: 14, color: '#777', marginTop: 4}}>{animal.espece}</Text>
        <Text style={{color: '#555'}}>{animal.race}</Text>
      </View>
    </TouchableOpacity>
  );
  
  // Edit Profile Component
  const EditProfileModal = () => {
    if (!user) return null;
    
    return (
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
          <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
          
          <View style={{padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee'}}>
            <TouchableOpacity onPress={closeEditModal}>
              <Icons.ArrowLeft width={24} height={24} color={colors.dark} />
            </TouchableOpacity>
            <Text style={{marginLeft: 16, fontSize: 20, fontWeight: 'bold'}}>Edit Profile</Text>
          </View>
          
          <ScrollView style={{flex: 1, paddingHorizontal: 16, paddingVertical: 24}}>
            <View style={{alignItems: 'center', marginBottom: 24}}>
              <View style={{position: 'relative'}}>
                <View style={{width: 96, height: 96, borderRadius: 48, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center'}}>
                  {user.profilepicture ? (
                    <Image 
                      source={{ uri: user.profilepicture }} 
                      style={{width: 96, height: 96, borderRadius: 48, resizeMode: 'cover'}}
                    />
                  ) : (
                    <Text style={{fontSize: 40, color: '#aaa'}}>👤</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={{
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    backgroundColor: colors.primary, 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <Icons.Edit width={16} height={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={{marginBottom: 16}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>First Name</Text>
              <View style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12}}>
                <Text>{user.prenom || 'Sabrina'}</Text>
              </View>
            </View>
            
            <View style={{marginBottom: 16}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>Last Name</Text>
              <View style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12}}>
                <Text>{user.nom || 'Aryan'}</Text>
              </View>
            </View>
            
            <View style={{marginBottom: 16}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>Email</Text>
              <View style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12}}>
                <Text>{user.email || 'SabrinaAry208@gmail.com'}</Text>
              </View>
            </View>
            
            <View style={{marginBottom: 16}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>Phone Number</Text>
              <View style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row'}}>
                <Text>{user.telephone || '+234 904 6470'}</Text>
              </View>
            </View>
            
            <View style={{marginBottom: 16}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>Birth</Text>
              <TouchableOpacity style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text>Select date</Text>
                <Icons.ChevronDown width={16} height={16} color={colors.dark} />
              </TouchableOpacity>
            </View>
            
            <View style={{marginBottom: 24}}>
              <Text style={{fontSize: 14, color: '#777', marginBottom: 4}}>Gender</Text>
              <TouchableOpacity style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text>Select gender</Text>
                <Icons.ChevronDown width={16} height={16} color={colors.dark} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={{
                paddingVertical: 12, 
                paddingHorizontal: 16, 
                backgroundColor: '#2463B0', 
                borderRadius: 8, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 16, 
                flexDirection: 'row'
              }}
            >
              <Text style={{color: colors.white, fontWeight: 'bold'}}>Change Password</Text>
              <View style={{marginLeft: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: colors.white}}>🔒</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      {/* Edit Profile Modal */}
      <EditProfileModal />
      
      {/* Main view */}
      <View style={{flex: 1, backgroundColor: '#f5f5f5'}}>
        {/* Header */}
        <View style={{backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icons.ArrowLeft width={24} height={24} color={colors.dark} />
            <Text style={{marginLeft: 16, fontSize: 20, fontWeight: 'bold'}}>My Profile</Text>
          </View>
        </View>
        
        {/* Content */}
        <ScrollView style={{flex: 1}}>
          {/* Profile Header */}
          <View style={{backgroundColor: colors.white, padding: 16, marginBottom: 8}}>
            <View style={{flexDirection: 'row'}}>
              {/* Profile Image */}
              <View style={{marginRight: 16}}>
                {user?.profilepicture ? (
                  <Image 
                    source={{ uri: user.profilepicture }} 
                    style={{width: 64, height: 64, borderRadius: 32, resizeMode: 'cover'}}
                  />
                ) : (
                  <View style={{width: 64, height: 64, borderRadius: 32, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{fontSize: 30, color: '#aaa'}}>👤</Text>
                  </View>
                )}
              </View>
              
              {/* Profile Info */}
              <View style={{justifyContent: 'center'}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>{user?.nom || 'Sabrina'} {user?.prenom || 'Aryan'}</Text>
                <Text style={{color: '#777'}}>{user?.email || 'SabrinaAry208@gmail.com'}</Text>
              </View>
            </View>
            
            {/* Edit Profile Button */}
            <TouchableOpacity 
              onPress={() => setIsEditModalOpen(true)}
              style={{marginTop: 16, backgroundColor: '#3d9be9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center'}}
            >
              <Text style={{color: colors.white, fontWeight: '500'}}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          {/* Menu Items */}
          <View style={{backgroundColor: colors.white, marginBottom: 8}}>
            <TouchableOpacity style={{paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
            onPress={() => navigation.navigate('Definitive')}>
              
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icons.Heart width={20} height={20} color={colors.dark} />
                <Text style={{marginLeft: 16}}>garderie definitive</Text>
              </View>
              <Icons.ChevronRight width={20} height={20} color={colors.gray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={{paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
            onPress={() => navigation.navigate('Temporaire')}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icons.Download width={20} height={20} color={colors.dark} />
                <Text style={{marginLeft: 16}}>garderie temporaire</Text>
              </View>
              <Icons.ChevronRight width={20} height={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
          
          <View style={{backgroundColor: colors.white, marginBottom: 8}}>
            <TouchableOpacity style={{paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
            onPress={() => navigation.navigate('Adoptions')}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icons.Globe width={20} height={20} color={colors.dark} />
                <Text style={{marginLeft: 16}}>Mes adoptions</Text>
              </View>
              <Icons.ChevronRight width={20} height={20} color={colors.gray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={{paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
            onPress={() => navigation.navigate('Mescommandes')}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icons.MapPin width={20} height={20} color={colors.dark} />
                <Text style={{marginLeft: 16}}>Mes commandes</Text>
              </View>
              <Icons.ChevronRight width={20} height={20} color={colors.gray} />
            </TouchableOpacity>
            
           
          </View>
       
          
          <TouchableOpacity 
            style={{backgroundColor: colors.white, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32}}
            onPress={async () => {
              await AsyncStorage.removeItem('access_token');
              navigation.navigate('Login');
            }}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icons.LogOut width={20} height={20} color={colors.dark} />
              <Text style={{marginLeft: 16}}>Log Out</Text>
            </View>
            <Icons.ChevronRight width={20} height={20} color={colors.gray} />
          </TouchableOpacity>
          
          <View style={{alignItems: 'center', marginBottom: 16}}>
            <Text style={{color: '#999', fontSize: 12}}>App Version 2.3</Text>
          </View>
           {activeSection === 'garderie' && (
    animals.length
      ? animals.map(a => <AnimalCard key={a.id} animal={a} />)
      : <Text style={{ padding: 16 }}>Aucun animal en garderie.</Text>
  )}

  {activeSection === 'adoptions' && (
    adoptedAnimals.length
      ? adoptedAnimals.map(a => <AnimalCard key={a.id} animal={a} />)
      : <Text style={{ padding: 16 }}>Aucune adoption enregistrée.</Text>
  )}
        </ScrollView>
        
        {/* Animal Details Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          {selectedAnimal && (
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16}}>
              <View style={{backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 400}}>
                {/* Close button */}
                <TouchableOpacity 
                  onPress={closeModal}
                  style={{
                    position: 'absolute', 
                    right: 8, 
                    top: 8, 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    zIndex: 10, 
                    borderRadius: 20, 
                    padding: 4,
                    elevation: 5,
                  }}
                >
                  <Icons.X width={20} height={20} color={colors.dark} />
                </TouchableOpacity>
                
              
                
                {/* Image */}
                <View className="h-48 w-full">
                  {selectedAnimal.image ? (
                    <Image 
                      source={{ uri: getImageUrl(selectedAnimal.image) }} 
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-gray-200">
                      <Text className="text-4xl">🐾</Text>
                    </View>
                  )}
                </View>
                
                {/* Details */}
                <View className="p-4">
                  <Text className="text-xl font-bold mb-3">{selectedAnimal.nom}</Text>
                  
                  <View className="flex-row flex-wrap mb-4">
                    <View className="bg-gray-100 rounded-lg p-2 mr-2 mb-2">
                      <Text className="text-xs text-gray-500">Espèce</Text>
                      <Text className="font-medium">{selectedAnimal.espece}</Text>
                    </View>
                    
                    <View className="bg-gray-100 rounded-lg p-2 mr-2 mb-2">
                      <Text className="text-xs text-gray-500">Race</Text>
                      <Text className="font-medium">{selectedAnimal.race}</Text>
                    </View>
                    
                    <View className="bg-gray-100 rounded-lg p-2 mr-2 mb-2">
                      <Text className="text-xs text-gray-500">Sexe</Text>
                      <Text className="font-medium">
                        {selectedAnimal.sexe === 'M' ? 'Mâle' : 'Femelle'}
                      </Text>
                    </View>
                    
                    <View className="bg-gray-100 rounded-lg p-2 mb-2">
                      <Text className="text-xs text-gray-500">Âge</Text>
                      <Text className="font-medium">
                        {selectedAnimal.date_naissance ? formatAge(selectedAnimal.date_naissance) : "Âge inconnu"}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="mb-4">
                    <Text className="font-semibold mb-1">Description</Text>
                    <Text className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedAnimal.description || `${selectedAnimal.nom} est un adorable ${selectedAnimal.espece.toLowerCase()} qui attend avec impatience de trouver sa famille pour toujours.`}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={closeModal}
                    className="border border-gray-300 rounded-lg py-3 items-center mt-2"
                  >
                    <Text className="text-gray-700 font-medium">Retour à la liste</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Profile;