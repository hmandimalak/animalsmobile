import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  Modal, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// Define colors for consistent styling
const colors = {
  primary: '#4DB6AC',  // Teal color from the image
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#333333',
  lightGray: '#EAEAEA',
  mediumGray: '#9E9E9E',
  red: '#FF5252',
};

export default function NosAnimaux() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [sexe, setSexe] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [favorites, setFavorites] = useState({});
  
  const navigation = useNavigation();
  const route = useRoute();

  // Set up API endpoint
  const API_BASE_URL = 'http://192.168.0.132:8000/api';

  useEffect(() => {
    if (route.params) {
      const { query = '', type = '', species = '', age = '', sexe = '' } = route.params;

      setSearchQuery(query);
      setAnimalType(type);
      setSpecies(species);
      setAge(age);
      setSexe(sexe);

      fetchAnimals(query, type, species, age, sexe);
    } else {
      fetchAnimals();
    }
    
    // Load favorites from AsyncStorage
    loadFavorites();
  }, [route.params]);

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (animalId) => {
    try {
      const newFavorites = { ...favorites };
      newFavorites[animalId] = !newFavorites[animalId];
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const fetchAnimals = async (query = '', type = '', species = '', age = '', sexe = '') => {
    setPageLoading(true);
    try {
      // Build query parameters for API call
      let endpoint = `${API_BASE_URL}/animals/search/?`;
      const params = [];
      
      if (query) params.push(`query=${encodeURIComponent(query)}`);
      if (type) params.push(`type=${encodeURIComponent(type)}`);
      if (species) params.push(`species=${encodeURIComponent(species)}`);
      if (age) params.push(`age=${encodeURIComponent(age)}`);
      if (sexe) params.push(`sexe=${encodeURIComponent(sexe)}`);
      
      endpoint += params.join('&');
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setAnimals(data);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSearch = () => {
    // Navigate to the same screen with search parameters
    navigation.setParams({
      query: searchQuery,
      type: animalType,
      species,
      age,
      sexe,
    });
    
    // Also fetch the data directly
    fetchAnimals(searchQuery, animalType, species, age, sexe);
  };

  const fetchAnimalDetails = async (animalId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/animals/${animalId}/`);
      const data = await response.json();
      setSelectedAnimal(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch animal details', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedAnimal(null);
    setIsModalOpen(false);
  };

  // Update this function in your NosAnimaux.js file

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    console.log("[DEBUG] Retrieved token:", token ? "Token exists" : "No token");
    
    if (token) {
      return `Bearer ${token}`;
    } else {
      console.log("[DEBUG] No token found in storage");
      return null;
    }
  } catch (error) {
    console.error("[ERROR] Error retrieving auth token:", error);
    return null;
  }
};

const handleAdoptClick = async () => {
  try {
    const authToken = await getAuthToken();
    console.log("[DEBUG] Auth token for adoption:", authToken ? "Token exists" : "No token");
    
    if (!authToken) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour adopter un animal.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
      return;
    }
  
    if (!selectedAnimal || !selectedAnimal.id) {
      Alert.alert("Erreur", "Information de l'animal non disponible");
      return;
    }
  
    // Show a loading indicator
    setLoading(true);
  
    const requestBody = {
      animal: selectedAnimal.id,
    };
  
    console.log("[DEBUG] Adoption request:", JSON.stringify(requestBody));
    console.log("[DEBUG] Request URL:", `${API_BASE_URL}/animals/demandes-adoption/`);
  
    const response = await fetch(`${API_BASE_URL}/animals/demandes-adoption/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(requestBody),
    });
  
    console.log("[DEBUG] Response status:", response.status);
    
    const responseData = await response.json().catch(() => ({}));
    console.log("[DEBUG] Response data:", responseData);
  
    if (response.ok) {
      setShowSuccessModal(true);
      closeModal();
    } else {
      if (response.status === 401) {
        Alert.alert(
          "Session expirée",
          "Votre session a expiré. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => navigation.navigate('Login') }]
        );
      } else if (responseData.detail?.includes("existe déjà")) {
        Alert.alert(
          "Demande existante", 
          "Vous avez déjà fait une demande d'adoption pour cet animal."
        );
      } else {
        Alert.alert(
          "Erreur", 
          responseData.detail || "Une erreur est survenue lors de la demande d'adoption."
        );
      }
    }
  } catch (error) {
    console.error("[ERROR] Adoption request failed:", error);
    Alert.alert(
      "Erreur de connexion", 
      "Impossible de communiquer avec le serveur. Vérifiez votre connexion internet."
    );
  } finally {
    setLoading(false);
  }
};

  // Function to format age in a more friendly way
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
  const resetFilters = () => {
    setSearchQuery('');
    setAnimalType('');
    setSpecies('');
    setAge('');
    setSexe('');
    navigation.setParams({});
    fetchAnimals();
  };

  // Get active filters
  const activeFilters = [
    animalType && { label: animalType, value: "type" },
    species && { label: species, value: "species" },
    age && { label: age, value: "age" },
    sexe && { label: sexe === 'M' ? 'Mâle' : 'Femelle', value: "sexe" }
  ].filter(Boolean);
  
  // Render an animal card
  const renderAnimalCard = ({ item, index }) => {
    // Alternate card layout based on index
    const isEven = index % 2 === 0;
    
    return (
      <TouchableOpacity
        style={[styles.animalCard, isEven ? { marginRight: 8 } : { marginLeft: 8 }]}
        onPress={() => fetchAnimalDetails(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
           <Image
                  source={
                    item.image
                      ? { uri: `http://192.168.0.132:8000${item.image}` }
                      : require('../assets/dogandcat.jpeg')
                  }
                  style={styles.animalImage}
       ></Image>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={favorites[item.id] ? "heart" : "heart-outline"} 
              size={22} 
              color={favorites[item.id] ? colors.red : colors.white} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>
              {item.status || "Adoption"}
            </Text>
          </View>
          
          <Text style={styles.animalName} numberOfLines={1}>
            {item.nom} ({item.race})
          </Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={colors.mediumGray} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.race}
            </Text>
            <Text style={{ fontSize: 14}}>
             {item.date_naissance ? formatAge(item.date_naissance) : 'Unknown'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {animalType || 'Tous les animaux'}
        </Text>
        <TouchableOpacity
          style={styles.moreButton}
        >
          <Feather name="more-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterPillsContainer}
        contentContainerStyle={styles.filterPillsContent}
      >
        <TouchableOpacity 
          style={[
            styles.filterPill, 
            animalType === 'chat' && styles.activeFilterPill
          ]}
          onPress={() => {
            const newType = animalType === 'chat' ? '' : 'chat';
            setAnimalType(newType);
            navigation.setParams({
              ...route.params,
              type: newType
            });
            fetchAnimals(searchQuery, newType, species, age, sexe);
          }}
        >
          <Text style={[
            styles.filterPillText,
            animalType === 'chat' && styles.activeFilterPillText
          ]}>Chat</Text>
          {animalType === 'chat' && (
            <Ionicons name="close" size={16} color={colors.white} style={styles.pillCloseIcon} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterPill, 
            animalType === 'chien' && styles.activeFilterPill
          ]}
          onPress={() => {
            const newType = animalType === 'chien' ? '' : 'chien';
            setAnimalType(newType);
            navigation.setParams({
              ...route.params,
              type: newType
            });
            fetchAnimals(searchQuery, newType, species, age, sexe);
          }}
        >
          <Text style={[
            styles.filterPillText,
            animalType === 'chien' && styles.activeFilterPillText
          ]}>Chien</Text>
          {animalType === 'chien' && (
            <Ionicons name="close" size={16} color={colors.white} style={styles.pillCloseIcon} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterPill, 
            activeFilters.some(f => f.value === 'adoption') && styles.activeFilterPill
          ]}
          onPress={() => {
            // Toggle adoption filter
            navigation.navigate('FilterScreen');
          }}
        >
          <Text style={styles.filterPillText}>Adoption</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterPill}
          onPress={() => {
            // Toggle disappear filter
            navigation.navigate('FilterScreen');
          }}
        >
          <Text style={styles.filterPillText}>Disparu</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterPill}
          onPress={() => {
            // Toggle mating filter
            navigation.navigate('FilterScreen');
          }}
        >
          <Text style={styles.filterPillText}>Reproduction</Text>
        </TouchableOpacity>
        
        {/* More filters button */}
        <TouchableOpacity 
          style={styles.moreFiltersButton}
          onPress={() => navigation.navigate('FilterScreen')}
        >
          <Feather name="sliders" size={16} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Search Bar - Hidden by default, can be toggled */}
      {false && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={20} color={colors.mediumGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un animal"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>
      )}

      {/* Animals Grid */}
      {pageLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={animals}
          renderItem={renderAnimalCard}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.animalsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun animal ne correspond à votre recherche</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeModal}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          {selectedAnimal && (
            <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={
                    selectedAnimal.image
                      ? { uri: `http://192.168.0.132:8000${selectedAnimal.image}` }
                      : require('../assets/dogandcat.jpeg')
                  }
                  style={styles.detailImage}
       ></Image>
             
              
              <TouchableOpacity 
                style={styles.detailFavoriteButton}
                onPress={() => toggleFavorite(selectedAnimal.id)}
              >
                <Ionicons 
                  name={favorites[selectedAnimal.id] ? "heart" : "heart-outline"} 
                  size={24} 
                  color={favorites[selectedAnimal.id] ? colors.red : colors.white} 
                />
              </TouchableOpacity>
              
              <View style={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>{selectedAnimal.nom}</Text>
                  <View style={styles.detailBreedContainer}>
                    <Text style={styles.detailBreed}>{selectedAnimal.race}</Text>
                  </View>
                </View>

                <View style={styles.detailInfoRow}>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="location-outline" size={16} color={colors.mediumGray} />
                    <Text style={styles.detailInfoText}>
                      {selectedAnimal.race || "New York"}
                    </Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="time-outline" size={16} color={colors.mediumGray} />
                    <Text style={{ fontSize: 14}}>
             {selectedAnimal.date_naissance ? formatAge(selectedAnimal.date_naissance) : 'Unknown'}
            </Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons 
                      name={selectedAnimal.sexe === 'M' ? "male-outline" : "female-outline"} 
                      size={16} 
                      color={colors.mediumGray} 
                    />
                    <Text style={styles.detailInfoText}>
                      {selectedAnimal.sexe === 'M' ? 'Mâle' : 'Femelle'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.aboutTitle}>À propos</Text>
                <Text style={styles.detailDescription}>
                  {selectedAnimal.description || "Ce petit trésor n'attend que vous pour partager sa vie ! Venez le rencontrer dans notre refuge."}
                </Text>

                <TouchableOpacity
                  style={styles.adoptButton}
                  onPress={handleAdoptClick}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adoptButtonText}>Adopter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalBackground}>
          <View style={styles.successModalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>C'est fait !</Text>
            <Text style={styles.successMessage}>
              Votre demande d'adoption a bien été envoyée ! 
              Nous vous contacterons très vite ❤️
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Super !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  moreButton: {
    padding: 4,
  },
  filterPillsContainer: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterPillsContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  activeFilterPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: colors.text,
  },
  activeFilterPillText: {
    color: colors.white,
  },
  pillCloseIcon: {
    marginLeft: 4,
  },
  moreFiltersButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  animalsList: {
    padding: 8,
    paddingBottom: 24,
  },
  animalCard: {
    flex: 1,
    margin: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  animalImage: {
    height: 140,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: -12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E6F7F5',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
    paddingTop: 16,
  },
  animalName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: colors.mediumGray,
    marginLeft: 2,
    flex: 1,
  },
  ageText: {
    fontSize: 12,
    color: colors.mediumGray,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
    textAlign: 'center',
  },
  loader: {
    marginTop: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    height: 320,
    width: '100%',
  },
  detailFavoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    padding: 24,
    paddingBottom: 40,
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  detailBreedContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  detailBreed: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailInfoText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginBottom: 24,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.mediumGray,
    marginBottom: 30,
  },
  adoptButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  adoptButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  successMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 24,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
