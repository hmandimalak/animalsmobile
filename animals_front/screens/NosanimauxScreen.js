import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, Image,
  ActivityIndicator, SafeAreaView, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from '../components/styles';
import FilterSection from '../components/FilterSection';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://192.168.0.188:8002/api';

export default function NosAnimaux() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [token, setToken] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [adopting, setAdopting] = useState(false); // New state for adoption loading
  const [messageModal, setMessageModal] = useState(false); // New state for message modal
  const [modalContent, setModalContent] = useState({ // New state for modal content
    title: '',
    message: '',
    type: 'success' // 'success' or 'error'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [animalType, setAnimalType] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [sexe, setSexe] = useState('');
  

  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    loadFavorites();
    fetchAnimals();
  }, []);

  const loadFavorites = async () => {
    const stored = await AsyncStorage.getItem('favorites');
    if (stored) setFavorites(JSON.parse(stored));
  };

  const toggleFavorite = async (id) => {
    const updated = { ...favorites, [id]: !favorites[id] };
    setFavorites(updated);
    await AsyncStorage.setItem('favorites', JSON.stringify(updated));
  };
  
  // Get auth token from storage
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
  
  // Updated to match web application's blue palette
  const COLORS = {
    primary: '#6A89A7',    // Soft blue (main color)
    secondary: '#BDDDFC',   // Light sky blue
    accent: '#88BDF2',      // Sky blue
    dark: '#384959',        // Dark blue-gray
    white: '#FFFFFF',
    gray: '#F0F0F0',
    darkGray: '#718096',    // Lighter blue-gray
    lightGray: '#e6e6e6',
    danger: '#ff6b6b',
    gradientStart: '#6A89A7',
    gradientEnd: '#88BDF2',
  };

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/animals/search/?query=${searchQuery}&type=${animalType}&species=${species}&age=${age}&sexe=${sexe}`;
      const res = await fetch(url);
      const data = await res.json();
      setAnimals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleAdopt = async () => {
    setAdopting(true);
    try {
     const token = await getAuthToken();
      
       if (!token) {
            // 🔴 Pas de token → on arrête le loading, on alerte, on redirige
            setLoading(false);
            Alert.alert(
              'Accès refusé',
              'Veuillez vous identifier.',
              [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
            return;
          }
      
      
      const requestBody = {
        animal: selectedAnimal.id 
      };

      const response = await fetch(`http://192.168.0.188:8002/api/animals/demandes-adoption/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        closeModal();
        setTimeout(() => {
          setModalContent({
            title: 'Succès!',
            message: 'Demande d\'adoption envoyée! Nous vous contacterons sous 48h.',
            type: 'success'
          });
          setMessageModal(true);
        }, 300);
      } else {
        const errorData = await response.json();
        
        if (response.status === 401) {
          // Token expired
          closeModal();
          setTimeout(() => {
            setModalContent({
              title: 'Session Expirée',
              message: 'Votre session a expiré. Veuillez vous reconnecter.',
              type: 'error'
            });
            setMessageModal(true);
          }, 300);
        } else if (response.status === 400 && errorData.detail?.includes("existe déjà")) {
          // Already has adoption request
          closeModal();
          setTimeout(() => {
            setModalContent({
              title: 'Demande Existante',
              message: 'Vous avez déjà une demande d\'adoption en cours pour cet animal.',
              type: 'error'
            });
            setMessageModal(true);
          }, 300);
        } else {
          // Other errors
          Alert.alert('Erreur', errorData.detail || 'Une erreur est survenue');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Erreur', 'Problème de connexion. Vérifiez votre internet.');
    } finally {
      setAdopting(false);
    }
  };

const renderCard = ({ item }) => (
  <TouchableOpacity 
    style={[styles.card, { backgroundColor: COLORS.white }]} 
    onPress={() => openModal(item)}
  >
    <View style={{ position: 'relative' }}>
      <Image
        source={
          item.image
            ? { uri: `http://192.168.0.188:8002${item.image}` }
            : require('../assets/dogandcat.jpeg')
        }
        style={{ width: '100%', height: 230, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        resizeMode="cover"
      />
    </View>

    <View style={[styles.info, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.name, { color: COLORS.dark }]}>{item.nom}</Text>
        </View>
        <Text style={[styles.breed, { color: COLORS.darkGray }]}>{item.race}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Ionicons
            name={item.sexe === 'M' ? 'male' : 'female'}
            size={14}
            color={item.sexe === 'M' ? COLORS.primary : COLORS.accent}
            style={{ marginLeft: 6 }}
          />
      </View>
    </View>
  </TouchableOpacity>
);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
      {/* Message Modal */}
      <Modal
        visible={messageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.messageModal, 
            { backgroundColor: modalContent.type === 'success' ? '#e6f7ee' : '#fde8e8' }
          ]}>
            <Text style={[
              styles.messageModalTitle, 
              { color: modalContent.type === 'success' ? '#27ae60' : '#e74c3c' }
            ]}>
              {modalContent.title}
            </Text>
            <Text style={styles.messageModalText}>{modalContent.message}</Text>
            
            <TouchableOpacity
              style={[
                styles.messageModalButton,
                { backgroundColor: modalContent.type === 'success' ? '#27ae60' : '#e74c3c' }
              ]}
              onPress={() => {
                setMessageModal(false);
                if (modalContent.type === 'error') {
                  navigation.navigate('Login');
                }
              }}
            >
              <Text style={styles.messageModalButtonText}>
                {modalContent.type === 'error' ? 'Se connecter' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
       
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🐾 Nos Petits Compagnons</Text>
          <View style={{width: 24}} />
        </View>
        <Text style={styles.headerSubtitle}>
          Trouvez votre nouveau meilleur ami
        </Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <FilterSection
          animalType={animalType}
          setAnimalType={setAnimalType}
          species={species}
          setSpecies={setSpecies}
          age={age}
          setAge={setAge}
          sexe={sexe}
          setSexe={setSexe}
          fetchAnimals={fetchAnimals}
          colors={COLORS}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.dark }]}>Chargement des amours...</Text>
        </View>
      ) : (
        <FlatList
          data={animals}
          renderItem={renderCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="paw" size={60} color={COLORS.lightGray} />
              <Text style={[styles.emptyText, { color: COLORS.dark }]}>Aucun animal trouvé</Text>
              <Text style={[styles.emptySubtext, { color: COLORS.darkGray }]}>Essayez d'autres filtres</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: COLORS.white }]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            {selectedAnimal && (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Image
                  source={
                    selectedAnimal.image
                      ? { uri: `http://192.168.0.188:8002${selectedAnimal.image}` }
                      : require('../assets/dogandcat.jpeg')
                  }
                  style={styles.modalImage}
                />
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: COLORS.dark }]}>{selectedAnimal.nom}</Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(selectedAnimal.id)}
                    style={styles.modalFavorite}
                  >
                    <Ionicons
                      name={favorites[selectedAnimal.id] ? 'heart' : 'heart-outline'}
                      size={24}
                      color={favorites[selectedAnimal.id] ? COLORS.primary : COLORS.darkGray}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="paw" size={18} color={COLORS.primary} />
                  <Text style={[styles.modalText, { color: COLORS.dark }]}>{selectedAnimal.race}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="transgender" size={18} color={COLORS.primary} />
                  <Text style={[styles.modalText, { color: COLORS.dark }]}>
                    {selectedAnimal.sexe === 'M' ? 'Mâle' : 'Femelle'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  <Text style={[styles.modalText, { color: COLORS.dark }]}>3 ans</Text>
                </View>
                
                <Text style={[styles.sectionTitle, { color: COLORS.dark }]}>Description</Text>
                <Text style={[styles.modalDescription, { color: COLORS.dark }]}>
                  {selectedAnimal.description || "Un adorable compagnon qui cherche un foyer aimant. Très joueur et affectueux, parfait pour une famille."}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.adoptButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleAdopt}
                  disabled={adopting}
                >
                  {adopting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.adoptButtonText}>Adopter {selectedAnimal.nom}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <Feather name="home" size={24} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Nosanimaux')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.primary }]}>
            <FontAwesome5 name="paw" size={20} color={COLORS.white} />
          </View>
          <Text style={[styles.navText, { color: COLORS.primary }]}>Nos animaux</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Garde')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <MaterialIcons name="pets" size={22} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Garde</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Boutique')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <Feather name="shopping-bag" size={20} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Boutique</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}