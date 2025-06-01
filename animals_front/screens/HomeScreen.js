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
import Notifications from './NotificationsScreen';
import NotificationPopup from './NotificationPopup';
import { 
  MaterialIcons,
  FontAwesome5,
  FontAwesome,
  Ionicons,
  AntDesign,
  Feather
} from '@expo/vector-icons';
import Sidebar from './SidebarScreen';
import NotificationsScreen from './NotificationsScreen';
import HomeStyles from '../components/HomeStyles';

// API Base URL - Change to your production URL when ready
const API_BASE_URL = 'http://192.168.0.132:8000/api';

// Enhanced Theme colors with gradients and modern palette
// Replace the existing COLORS object with this updated version
// Replace the existing COLORS object with this updated version
const COLORS = {
  primary: '#6A89A7',    // Soft blue (main color)
  secondary: '#BDDDFC',   // Light sky blue
  accent: '#88BDF2',      // Sky blue
  tertiary: '#E4F0FD',    // Very light blue
  dark: '#384959',        // Dark blue-gray
  white: '#FFFFFF',
  gray: '#F7FAFC',
  darkGray: '#718096',
  lightGray: '#E2E8F0',
  danger: '#EF4444',
  success: '#48BB78',
  warning: '#ED8936',
  
  // Removed all pink-related colors
  gradientStart: '#6A89A7',
  gradientEnd: '#384959',
  cardBackground: '#FEFEFE',
  shadowColor: 'rgba(106, 137, 167, 0.15)',
  
  // Updated animal colors to blue variants
  dogColor: '#A7C6E5',    // Light blue for dogs
  catColor: '#B5D3E7',    // Light blue for cats
  birdColor: '#87CEEB',    // Sky blue for birds
  rabbitColor: '#98D1D1',  // Light teal for rabbits
};

// Screen dimensions
const { width, height } = Dimensions.get('window');

// Animal types with enhanced icons and cute colors
const animalTypes = [
  { id: 'chien', name: '🐕 Chiens', icon: 'dog', color: COLORS.dogColor },
  { id: 'chat', name: '🐱 Chats', icon: 'cat', color: COLORS.catColor },
  { id: 'oiseau', name: '🐦 Oiseaux', icon: 'twitter', color: COLORS.birdColor },
  { id: 'lapin', name: '🐰 Lapins', icon: 'heart', color: COLORS.rabbitColor },
];

// Enhanced animal options
const speciesOptions = {
  chien: [
    "Berger Allemand", "Labrador Retriever", "Golden Retriever", "Bulldog",
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
  const [pageLoading, setPageLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [age, setAge] = useState('');
  const [adoptedCount, setAdoptedCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fallback image for when animal images are unavailable
  const fallbackImage = require('../assets/dogandcat.jpeg');

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
      } catch (error) {
        console.error("Initialization error", error);
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    const fetchAdoptedCount = async () => {
      try {
        const response = await fetch("http://192.168.0.132:8000/api/animals/adopted-count/");
        if (!response.ok) throw new Error("Failed to load adopted count");
        const data = await response.json();
        setAdoptedCount(data.adopted_count || 0);
      } catch (err) {
        console.error("Error fetching adopted count:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAdoptedCount();
  }, []);

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

  const StatCard = ({ value, label, icon, color }) => (
    <View style={HomeStyles.statCard}>
      <View style={HomeStyles.statCardContent}>
        <View style={[HomeStyles.statIconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={HomeStyles.statTextContainer}>
          <Text style={HomeStyles.statValue}>{value.toLocaleString()}+</Text>
          <Text style={HomeStyles.statLabel}>{label}</Text>
        </View>
        <View style={HomeStyles.heartDecoration}>
          <Text style={HomeStyles.heartEmoji}>💕</Text>
        </View>
      </View>
    </View>
  );

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
      alert('Impossible de récupérer les animaux. Veuillez réessayer plus tard.');
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
      alert('Impossible de charger les détails de l\'animal. Veuillez réessayer.');
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
    fetchAnimals('', selectedAnimalType, animal);
  };

  const handleSearch = () => {
    fetchAnimals(searchTerm, selectedAnimalType, selectedanimal);
  };

  const handleAdoptClick = async () => {
    if (!token) {
      alert("Veuillez vous connecter pour soumettre une demande d'adoption.");
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
      
      alert("Demande d'adoption envoyée avec succès!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Network error:", error);
      alert("Erreur de connexion. Veuillez vérifier votre connexion internet.");
    }
  };

  const getCurrentUser = () => {
    return user ? user.nom : "Invité";
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

  // Enhanced animal card with better styling
  const renderAnimalCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => fetchAnimalDetails(item.id)}
      style={HomeStyles.animalCard}
      activeOpacity={0.9}
    >
      <View style={HomeStyles.imageContainer}>
        <Image
          source={
            item.image
              ? { uri: `http://192.168.0.132:8000${item.image}` }
              : require('../assets/dogandcat.jpeg')
          }
          style={HomeStyles.animalImage}
          resizeMode="cover"
        />
        <View style={HomeStyles.heartBadge}>
          <Text style={HomeStyles.heartBadgeText}>❤️</Text>
        </View>
      </View>
      <View style={HomeStyles.animalCardContent}>
        <Text style={HomeStyles.animalTitle}>{item.description}</Text>
        <View style={HomeStyles.animalDetails}>
          <View style={HomeStyles.animalInfo}>
            <Text style={HomeStyles.animalSubtitle}>
              {item.race} • {item.date_naissance ? formatAge(item.date_naissance) : 'Inconnu'}
            </Text>
            <View style={HomeStyles.locationContainer}>
              <Text style={HomeStyles.locationIcon}>📍</Text>
              <Text style={HomeStyles.locationText}>
                {item.location}
              </Text>
            </View>
          </View>
          <View style={HomeStyles.viewButton}>
            <Text style={HomeStyles.viewButtonText}>
              Voir ✨
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Enhanced animal type pill with better styling and colors
  const renderAnimalTypePill = ({ item }) => (
    <TouchableOpacity
      style={[
        HomeStyles.animalTypePill,
        {
          backgroundColor: selectedAnimalType === item.id ? item.color : COLORS.white,
          borderColor: item.color,
        }
      ]}
      onPress={() => handleAnimalTypeSelect(item.id)}
      activeOpacity={0.8}
    >
      <Text style={{ 
        color: selectedAnimalType === item.id ? COLORS.white : COLORS.dark,
        fontWeight: selectedAnimalType === item.id ? 'bold' : '600',
        fontSize: 14,
      }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced AnimalDetailsModal with better styling
  const AnimalDetailsModal = () => (
    <Modal
      visible={isModalOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsModalOpen(false)}
    >
      <View style={HomeStyles.modalOverlay}>
        <View style={HomeStyles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setIsModalOpen(false)}
            style={HomeStyles.closeButton}
          >
            <Text style={HomeStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Pet Name Header */}
          <Text style={HomeStyles.modalTitle}>
            {selectedAnimal?.nom} 🐾
          </Text>

          {/* Image */}
          <View style={HomeStyles.modalImageContainer}>
            <Image
              source={{
                uri: `http://192.168.0.132:8000${selectedAnimal.image}`
              }}
              style={HomeStyles.modalImage}
              resizeMode="cover"
            />
            <View style={HomeStyles.modalHeartBadge}>
              <Text style={HomeStyles.modalHeartText}>💖</Text>
            </View>
          </View>

          {/* Details Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={HomeStyles.detailsGrid}>
              <View style={HomeStyles.detailCard}>
                <Text style={HomeStyles.detailLabel}>Sexe</Text>
                <Text style={HomeStyles.detailValue}>
                  {selectedAnimal?.sexe === 'M' ? '♂️ Mâle' : '♀️ Femelle'}
                </Text>
              </View>
              <View style={HomeStyles.detailCard}>
                <Text style={HomeStyles.detailLabel}>Âge</Text>
                <Text style={HomeStyles.detailValue}>
                  🎂 {selectedAnimal?.date_naissance ? formatAge(selectedAnimal.date_naissance) : 'Inconnu'}
                </Text>
              </View>
              <View style={HomeStyles.detailCard}>
                <Text style={HomeStyles.detailLabel}>Race</Text>
                <Text style={HomeStyles.detailValue}>
                  🏷️ {selectedAnimal?.race}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={HomeStyles.descriptionTitle}>Description 📝</Text>
            <Text style={HomeStyles.descriptionText}>
              {selectedAnimal?.description || "Aucune description disponible."}
            </Text>

            {/* Action Buttons */}
            <View style={HomeStyles.actionButtons}>
              <TouchableOpacity style={HomeStyles.favoriteButton}>
                <Text style={HomeStyles.favoriteButtonText}>💝</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={HomeStyles.adoptButton}
                onPress={handleAdoptClick}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={HomeStyles.adoptButtonText}>🏡 Adopter</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={HomeStyles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      {/* Loading Overlay */}
      {pageLoading && (
        <View style={HomeStyles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={HomeStyles.loadingText}>Chargement des animaux... 🐾</Text>
        </View>
      )}
      
      {/* Animated Sidebar */}
      <Sidebar 
        isVisible={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Enhanced Header */}
        <View style={HomeStyles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={HomeStyles.menuButton}>
            <Text style={HomeStyles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <View style={HomeStyles.logoContainer}>
            <Image 
              source={require('../assets/dogandcat.jpeg')} 
              style={HomeStyles.logoImage}
            />
            <Text style={HomeStyles.logoText}>
              Adopti 🐾
            </Text>
          </View>
          
          <View style={HomeStyles.headerRightContainer}>
            <NotificationPopup />
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')} 
              style={HomeStyles.profileButton}
            >
              <Text style={HomeStyles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={HomeStyles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={HomeStyles.welcomeSection}>
            <Text style={HomeStyles.welcomeText}>
              Bonjour {getCurrentUser()}! 👋
            </Text>
            <Text style={HomeStyles.welcomeSubtext}>
              Trouvez votre compagnon parfait 💕
            </Text>
          </View>

          {/* Enhanced Animal Types */}
          <View style={HomeStyles.animalTypeContainer}>
            <View style={HomeStyles.animalTypeRow}>
              <FlatList
                data={animalTypes}
                renderItem={renderAnimalTypePill}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={HomeStyles.animalTypeList}
                style={{ flex: 1 }}
              />
              <TouchableOpacity style={HomeStyles.searchButton} onPress={handleSearch}>
                <Text style={HomeStyles.searchButtonText}>🔍 Rechercher</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Enhanced Species Section */}
          {selectedAnimalType && speciesOptions[selectedAnimalType] && (
            <View style={HomeStyles.speciesSection}>
              <View style={HomeStyles.sectionHeader}>
                <Text style={HomeStyles.sectionTitle}>Races populaires 🌟</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={HomeStyles.speciesContainer}
              >
                {speciesOptions[selectedAnimalType]?.map((animal) => (
                  <TouchableOpacity
                    key={animal}
                    style={[
                      HomeStyles.speciesButton,
                      {
                        backgroundColor: selectedanimal === animal ? COLORS.primary : COLORS.white,
                        borderColor: COLORS.primary,
                      }
                    ]}
                    onPress={() => handleanimalSelect(animal)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ 
                      color: selectedanimal === animal ? COLORS.white : COLORS.dark,
                      fontWeight: selectedanimal === animal ? 'bold' : '600',
                      fontSize: 14,
                    }}>
                      {animal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Search Results if any */}
          {hasSearched && searchResults.length > 0 && (
            <View style={HomeStyles.searchResultsSection}>
              <View style={HomeStyles.sectionHeader}>
                <Text style={HomeStyles.sectionTitle}>Résultats de recherche 🎯</Text>
                <Text style={HomeStyles.resultCount}>
                  {searchResults.length} trouvé{searchResults.length > 1 ? 's' : ''} ✨
                </Text>
              </View>
              
              <FlatList
                data={searchResults}
                renderItem={renderAnimalCard}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={HomeStyles.animalCardList}
              />
            </View>
          )}

          {/* Enhanced Statistics Section */}
          <View style={HomeStyles.statsSection}>
            <View style={HomeStyles.sectionHeader}>
              <Text style={HomeStyles.sectionTitle}>Animaux adoptés 🏠</Text>
            </View>

            {loadingStats ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <StatCard
                value={adoptedCount}
                label="Depuis 2020"
                icon={<Text style={HomeStyles.statEmoji}>🏡</Text>}
                color={COLORS.primary}
              />
            )}
          </View>

          {/* Success Stories Section */}
          <View style={HomeStyles.successStoriesSection}>
            <View style={HomeStyles.sectionHeader}>
              <Text style={HomeStyles.sectionTitle}>Histoires de succès 🌈</Text>
              <TouchableOpacity>
                <Text style={HomeStyles.viewMoreText}>Voir plus ✨</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={HomeStyles.storiesContainer}
            >
              {[
                {
                  id: 1,
                  title: "Buddy a trouvé sa famille 🎉",
                  description: "Après 6 mois d'attente, Buddy vit maintenant avec une famille aimante avec deux enfants.",
                  image: require('../assets/dogandcat.jpeg'),
                  date: "Il y a 2 semaines"
                },
                {
                  id: 2,
                  title: "Luna et son nouveau foyer 🌙",
                  description: "Cette belle chatte persane a été adoptée par un couple retraité adorable.",
                  image: require('../assets/dogandcat.jpeg'),
                  date: "Il y a 1 mois"
                }
              ].map((story) => (
                <View key={story.id} style={HomeStyles.storyCard}>
                  <View style={HomeStyles.storyImageContainer}>
                    <Image
                      source={story.image}
                      style={HomeStyles.storyImage}
                      resizeMode="cover"
                    />
                    <View style={HomeStyles.storyHeartBadge}>
                      <Text style={HomeStyles.storyHeartText}>💖</Text>
                    </View>
                  </View>
                  <View style={HomeStyles.storyContent}>
                    <Text style={HomeStyles.storyTitle}>
                      {story.title}
                    </Text>
                    <Text style={HomeStyles.storyDescription}>
                      {story.description}
                    </Text>
                    <Text style={HomeStyles.storyDate}>
                      {story.date}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Enhanced Bottom Navigation */}
          <View style={HomeStyles.bottomNavigation}>
            <TouchableOpacity style={HomeStyles.navButton}>
              <View style={[HomeStyles.navIconContainer, { backgroundColor: COLORS.primary }]}>
                <Text style={HomeStyles.activeNavIcon}>🏠</Text>
              </View>
              <Text style={[HomeStyles.navText, { color: COLORS.primary }]}>Accueil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={HomeStyles.navButton}
              onPress={() => navigation.navigate('Nosanimaux')}
            >
              <View style={[HomeStyles.navIconContainer, { backgroundColor: COLORS.white }]}>
                <Text style={HomeStyles.navIcon}>🐾</Text>
              </View>
              <Text style={[HomeStyles.navText, { color: COLORS.darkGray }]}>Nos animaux</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={HomeStyles.navButton}
              onPress={() => navigation.navigate('Garde')}
            >
              <View style={[HomeStyles.navIconContainer, { backgroundColor: COLORS.white }]}>
                <Text style={HomeStyles.navIcon}>🏥</Text>
              </View>
              <Text style={[HomeStyles.navText, { color: COLORS.darkGray }]}>Garde</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={HomeStyles.navButton}
              onPress={() => navigation.navigate('Boutique')}
            >
              <View style={[HomeStyles.navIconContainer, { backgroundColor: COLORS.white }]}>
                <Text style={HomeStyles.navIcon}>🛍️</Text>
              </View>
              <Text style={[HomeStyles.navText, { color: COLORS.darkGray }]}>Boutique</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      {/* Animal Details Modal */}
      {isModalOpen && selectedAnimal && <AnimalDetailsModal />}
    </SafeAreaView>
  );
}