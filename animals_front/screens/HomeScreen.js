import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Animated,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import tw from 'tailwind-react-native-classnames';
import { 
  MaterialIcons,
  FontAwesome5,
  FontAwesome,
  Ionicons,
  AntDesign,
  Feather
} from '@expo/vector-icons';
import Sidebar from './SidebarScreen';

// API Base URL - Change to your production URL when ready
const API_BASE_URL = 'http://192.168.0.132:8000/api';

// Theme colors
const COLORS = {
  primary: '#00c2cb',
  secondary: '#e6fcfd',
  accent: '#00a8b0',
  dark: '#333333',
  white: '#FFFFFF',
  gray: '#F0F0F0',
  darkGray: '#707070',
  lightGray: '#e6e6e6',
  danger: '#ff6b6b',
};

// Screen dimensions
const { width } = Dimensions.get('window');

// Animal types with icons
const animalTypes = [
  { id: 'chien', name: 'chien', icon: 'chien' },
  { id: 'chat', name: 'chat', icon: 'chat' },
  { id: 'oiseau', name: 'oiseau', icon: 'oiseau' },
  { id: 'lapin', name: 'lapin', icon: 'lapin' },
];

// animal options
const speciesOptions = {
  chien: [
    "Berger Allemand", "Labrador Retriever", "Golden Retriever", "Bullchien",
    "Rottweiler", "Husky Sibérien", "Beagle", "Caniche", "Chihuahua",
    "Yorkshire Terrier", "Autre"
  ],
  chat: [
    "Persan", "Siamois", "Maine Coon", "Bengal", "British Shorthair",
    "Ragdoll", "Sphynx", "Abyssin", "Sacré de Birmanie", "Européen", "Autre"
  ],
  oiseau: ["Parakeet", "Canary", "Cockatiel", "Lovebird", "Finch", "Other"],
  lapin: ["Holland Lop", "Mini Rex", "Netherland Dwarf", "Dutch", "Other"],
};

export default function Home() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAnimalType, setSelectedAnimalType] = useState('chien');
  const [selectedanimal, setSelectedanimal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredAnimals, setFeaturedAnimals] = useState([]);
  const [sidebarAnim] = useState(new Animated.Value(-300));
  const [pageLoading, setPageLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [age, setAge] = useState('');

  // Fallback image for when animal images are unavailable
  const fallbackImage = require('../assets/dogandcat.jpeg');

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSidebarOpen, sidebarAnim]);

  useEffect(() => {
    // Check for authentication and fetch featured animals
    const initialize = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        setToken(storedToken);
        
        if (storedToken) {
          const decoded = jwtDecode(storedToken);
          
          // Fetch user profile
          fetch(`${API_BASE_URL}/auth/profile/`, {
            method: "GET",
            headers: { Authorization: `Bearer ${storedToken}` },
          })
            .then((response) => response.json())
            .then((data) => setUser(data))
            .catch((error) => console.error("Error fetching user profile", error));
        }
        
        // Fetch featured animals
        fetchAnimals ();
      } catch (error) {
        console.error("Initialization error", error);
      }
    };
    
    initialize();
  }, []);

  // Function to fetch featured animals
  const fetchFeaturedAnimals = async () => {
    setPageLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/animals/featured/`);
      if (!response.ok) {
        throw new Error('Failed to fetch featured animals');
      }
      const data = await response.json();
      setFeaturedAnimals(data);
    } catch (error) {
      console.error("Error fetching featured animals:", error);
      // Use mock data as fallback if API request fails
      setFeaturedAnimals([
        {
          id: 1,
          nom: "Buddy",
          espece: "chien",
          race: "Labrador Retriever",
          description: "Loyal Friend Needs a Forever Home",
          image: null, // Will use fallback image
          sexe: 'M',
          age: '2 years',
          location: '3 miles away'
        },
        {
          id: 2,
          nom: "Whiskers",
          espece: "chat",
          race: "Tabby",
          description: "Affectionate Lap Cat Hoping to Meet You",
          image: null, // Will use fallback image
          sexe: 'F',
          age: '1 year',
          location: '5 miles away'
        }
      ]);
    } finally {
      setPageLoading(false);
    }
  };
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


  // Function to search animals based on criteria
  const fetchAnimals = async (query = '', type = '', species = '', age = '', sexe = '') => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/animals/search/`);
      
      // Add search parameters to URL
      if (query) url.searchParams.append('query', query);
      if (type) url.searchParams.append('type', type);
      if (species) url.searchParams.append('species', species);
      if (age) url.searchParams.append('age', age);
      if (sexe) url.searchParams.append('sexe', sexe);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await response.json();
      setSearchResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching animals:', error);
      // Show an error message to the user
      alert('Could not fetch animals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single animal's details
  const fetchAnimalDetails = async (animalId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/animals/${animalId}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch animal details');
      }
      const animal = await response.json();
      setSelectedAnimal(animal);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch animal details', error);
      alert('Could not load animal details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAnimalTypeSelect = (type) => {
    setSelectedAnimalType(type);
    setSelectedanimal('');
  };

  const handleanimalSelect = (animal) => {
    setSelectedanimal(animal);
    // Trigger search with selected type and species
    fetchAnimals('', selectedAnimalType, animal);
  };

  const handleSearch = () => {
    fetchAnimals(searchTerm, selectedAnimalType, selectedanimal);
  };

  const handleAdoptClick = async () => {
    if (!token) {
      alert("Please login to submit an adoption request.");
      setIsModalOpen(false);
      navigation.navigate('Login');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/adoptions/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          animal_id: selectedAnimal.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit adoption request');
      }
      
      alert("Adoption request sent successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Network error:", error);
      alert("Connection error. Please check your internet connection.");
    }
  };

  const getCurrentUser = () => {
    return user ? user.nom : "Guest";
  };

  // Get the appropriate image source
  const getImageSource = (animal) => {
    if (!animal.image) return fallbackImage;
  
    // If image is already an absolute URL (contains http), use it directly
    if (animal.image.startsWith('http')) {
      return { uri: animal.image };
    }
  
    // Otherwise, assume it's a relative path and prepend the base URL
    return { uri: `http://192.168.0.132:8000${animal.image}` };
  };

  // Render animal card
  const renderAnimalCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => fetchAnimalDetails(item.id)}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 20,
        marginRight: 16,
        marginBottom: 8,
        width: width * 0.8,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      <Image
        source={
          item.image
            ? { uri: `http://192.168.0.132:8000${item.image}` }
            : require('../assets/dogandcat.jpeg')
        }
        style={{
          width: '100%',
          height: 200,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20
        }}
        resizeMode="cover"
      />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.dark }}>{item.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
  {item.race} • {item.date_naissance ? formatAge(item.date_naissance) : 'Unknown'}
</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Feather name="map-pin" size={12} color={COLORS.primary} />
              <Text style={{ fontSize: 12, color: COLORS.darkGray, marginLeft: 4 }}>
                {item.location}
              </Text>
            </View>
          </View>
          <View style={{ 
            backgroundColor: COLORS.secondary, 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 20,
            borderWidth: 1,
            borderColor: COLORS.primary
          }}>
            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>
              View
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  // Animal type pill button
  const renderAnimalTypePill = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: selectedAnimalType === item.id ? COLORS.primary : COLORS.lightGray,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
      }}
      onPress={() => handleAnimalTypeSelect(item.id)}
    >
      {selectedAnimalType === item.id && (
        <AntDesign name="check" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
      )}
      <Text style={{ 
        color: selectedAnimalType === item.id ? COLORS.white : COLORS.dark,
        fontWeight: selectedAnimalType === item.id ? 'bold' : 'normal',
      }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // AnimalDetailsModal using Tailwind styles
const AnimalDetailsModal = () => (
  <Modal
    visible={isModalOpen}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setIsModalOpen(false)}
  >
    <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
      <View style={tw`bg-white rounded-t-3xl p-5 max-h-4/5`}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => setIsModalOpen(false)}
          style={tw`self-end mb-3`}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>

        {/* Pet Name Header */}
        <Text style={tw`text-2xl font-bold text-center text-gray-800 mb-2`}>
          {selectedAnimal?.nom}
        </Text>
        {/* Image */}
        <Image
  source={{
    uri: `http://192.168.0.132:8000${selectedAnimal.image}`
  }}
  style={{
    width: '100%',
    height: 200,
    borderRadius: 20
  }}
  resizeMode="cover"
/>

        {/* Details Grid */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={tw`flex-row justify-between mb-6`}>
            <View style={tw`items-center flex-1 p-2 bg-blue-50 rounded-lg mx-1`}>
              <Text style={tw`text-xs text-gray-500`}>Sexe</Text>
              <Text style={tw`text-base font-semibold text-gray-800 mt-1`}>
                {selectedAnimal?.sexe === 'M' ? 'Male' : 'Female'}
              </Text>
            </View>
            <View style={tw`items-center flex-1 p-2 bg-blue-50 rounded-lg mx-1`}>
              <Text style={tw`text-xs text-gray-500`}>Age</Text>
              <Text style={tw`text-base font-semibold text-gray-800 mt-1`}>
              {selectedAnimal?.date_naissance ? formatAge(selectedAnimal.date_naissance) : 'Unconnu'}
              </Text>
            </View>
            <View style={tw`items-center flex-1 p-2 bg-blue-50 rounded-lg mx-1`}>
              <Text style={tw`text-xs text-gray-500`}>race</Text>
              <Text style={tw`text-base font-semibold text-gray-800 mt-1`}>
                {selectedAnimal?.race}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={tw`font-bold text-lg text-gray-800 mb-2`}>Description</Text>
          <Text style={tw`text-gray-600 mb-6`}>
            {selectedAnimal?.description || "No description available."}
          </Text>

          {/* Action Buttons */}
          <View style={tw`flex-row items-center justify-between pt-4 border-t border-gray-200`}>
            <TouchableOpacity style={tw`p-3 rounded-full bg-blue-100 mr-4`}>
              <FontAwesome name="heart-o" size={20} color="#00c2cb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-teal-500 py-4 rounded-xl items-center`}
              onPress={handleAdoptClick}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`text-white font-bold text-lg`}>Adopt Me</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar backgroundColor={COLORS.primary} />
      
      {/* Loading Overlay */}
      {pageLoading && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.darkGray }}>Loading animals...</Text>
        </View>
      )}
      
      {/* Animated Sidebar */}
      <Animated.View 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: 270,
          backgroundColor: COLORS.white,
          zIndex: 50,
          elevation: 10,
          transform: [{ translateX: sidebarAnim }]
        }}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </Animated.View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingHorizontal: 20, 
          paddingVertical: 16,
          backgroundColor: COLORS.white
        }}>
          <TouchableOpacity onPress={toggleSidebar}>
            <MaterialIcons name="menu" size={28} color={COLORS.dark} />
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('../assets/dogandcat.jpeg')} 
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} 
            />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.dark }}>
              Adopti
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <FontAwesome name="user-circle" size={28} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={{ flex: 1, backgroundColor: COLORS.white }} 
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 16 }}>
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: COLORS.lightGray, 
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignItems: 'center'
            }}>
              <Feather name="search" size={18} color={COLORS.darkGray} />
              <TextInput
                style={{ 
                  flex: 1, 
                  marginLeft: 10, 
                  fontSize: 16, 
                  color: COLORS.dark 
                }}
                placeholder="Search for a pet"
                placeholderTextColor={COLORS.darkGray}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              <TouchableOpacity onPress={handleSearch}>
                <View style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8
                }}>
                  <Text style={{ color: COLORS.white, fontWeight: '600' }}>Search</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animal Types */}
          <View style={{ marginBottom: 24 }}>
          <FlatList
          data={featuredAnimals}
          renderItem={renderAnimalCard}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
          </View>
          
          {/* Search Results if any */}
          {hasSearched && searchResults.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingHorizontal: 20, 
                marginBottom: 16 
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.dark }}>
                  Search Results
                </Text>
              </View>
              
              <FlatList
                data={searchResults}
                renderItem={renderAnimalCard}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              />
            </View>
          )}
          
         
            
         
          
          {/* animals Section */}
          {selectedAnimalType && speciesOptions[selectedAnimalType] && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingHorizontal: 20, 
                marginBottom: 16 
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.dark }}>
                  Popular animals
                </Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {speciesOptions[selectedAnimalType]?.map((animal) => (
                  <TouchableOpacity
                    key={animal}
                    style={{
                      backgroundColor: selectedanimal === animal ? COLORS.primary : COLORS.lightGray,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 8
                    }}
                    onPress={() => handleanimalSelect(animal)}
                  >
                    <Text style={{ 
                      color: selectedanimal === animal ? COLORS.white : COLORS.dark,
                      fontWeight: selectedanimal === animal ? 'bold' : 'normal'
                    }}>
                      {animal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Navigation Icons */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            paddingVertical: 20,
            paddingHorizontal: 20,
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.lightGray,
            marginTop: 8
          }}>
            <TouchableOpacity style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center' 
              }}>
                <Feather name="home" size={24} color={COLORS.white} />
              </View>
              <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ alignItems: 'center' }}
              onPress={() => navigation.navigate('Nosanimaux')} // ✅ Add this line
            >
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="message-circle" size={24} color={COLORS.darkGray} />
              </View>
              <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 4 }}>Nosanimaux</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ alignItems: 'center' }}
            onPress={() => navigation.navigate('Garde')} // ✅ Add this line
            >
              
              <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: COLORS.lightGray,
                justifyContent: 'center',
                alignItems: 'center' 
              }}>
                <Feather name="message-circle" size={24} color={COLORS.darkGray} />
              </View>
              <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 4 }}>service de garde</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ alignItems: 'center' }}
            onPress={() => navigation.navigate('Boutique')} // ✅ Add this line
            >
              <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: COLORS.lightGray,
                justifyContent: 'center',
                alignItems: 'center' 
              }}>
                <Feather name="heart" size={24} color={COLORS.darkGray} />
              </View>
              <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 4 }}>boutique</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      {/* Animal Details Modal */}
      {isModalOpen && selectedAnimal && <AnimalDetailsModal />}
    </SafeAreaView>
  );
}