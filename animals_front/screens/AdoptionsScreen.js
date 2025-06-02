import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Modal, Image,
  ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../android/app/api';
import styles from '../components/styles';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';


const colors = {
  primary: '#4DB6AC',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#333333',
  lightGray: '#EAEAEA',
  mediumGray: '#9E9E9E',
  red: '#FF5252',
};

const COLORS = {
  primary: '#00c2cb',
  secondary: '#e6fcfd',
  accent: '#00a8b0',
  dark: '#1a1a1a',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  darkGray: '#6B7280',
  lightGray: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  gradientStart: '#00c2cb',
  gradientEnd: '#00a8b0',
  cardBackground: '#FEFEFE',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
};

export default function AdoptionsScreen({ navigation }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({});

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

  const fetchAnimals = async () => {
    try {
      const data = await api.fetchAdoptedAnimals();
      // Handle both flat array and paginated results
      const animalsArray = Array.isArray(data) ? data : (data?.results || []);
      setAnimals(animalsArray);
    } catch (err) {
      console.error("Error fetching adopted animals:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const formatAge = (dateString) => {
    if (!dateString) return "Âge inconnu";
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (today.getDate() < birthDate.getDate()) {
        months--;
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    let ageParts = [];
    if (years > 0) {
        ageParts.push(`${years} an${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
        ageParts.push(`${months} mois`);
    }
    
    return ageParts.join(' et ') || 'Nouveau-né';
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => openModal(item)}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={
            item.image
              ? { uri: `http://192.168.0.188:8002${item.image}` }
              : require('../assets/dogandcat.jpeg')
          }
          style={{ 
            width: '100%', 
            height: 230, 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24 
          }}
          resizeMode="cover"
        />
        {/* Adoption badge */}
        <View style={styles.adoptedBadge}>
          <Text style={styles.adoptedBadgeText}>Adopté</Text>
        </View>
      </View>

      <View style={[styles.info, { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{item.nom}</Text>
          </View>
          <Text style={styles.breed}>{item.race}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Ionicons
            name={item.sexe === 'M' ? 'male' : 'female'}
            size={14}
            color={item.sexe === 'M' ? '#8E54E9' : '#F18D9E'}
            style={{ marginLeft: 6 }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6A89A7', '#6A89A7']}
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
          <Text style={styles.headerTitle}>🐾 Mes adoptions</Text>
          <View style={{width: 24}} />
        </View>
    
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C5A8FF" />
          <Text style={styles.loadingText}>Chargement des histoires...</Text>
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
              <Ionicons name="paw" size={60} color="#E8E5FF" />
              <Text style={styles.emptyText}>Aucune histoire à montrer</Text>
              <Text style={styles.emptySubtext}>Revenez plus tard</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
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
                  <Text style={styles.modalTitle}>{selectedAnimal.nom}</Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(selectedAnimal.id)}
                    style={styles.modalFavorite}
                  >
                    <Ionicons
                      name={favorites[selectedAnimal.id] ? 'heart' : 'heart-outline'}
                      size={24}
                      color={favorites[selectedAnimal.id] ? '#FF6B8B' : '#C5A8FF'}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.adoptedBanner}>
                  <Text style={styles.adoptedBannerText}>Heureusement Adopté ❤️</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="paw" size={18} color="#BDDDFC" />
                  <Text style={styles.modalText}>{selectedAnimal.race}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="transgender" size={18} color="#BDDDFC" />
                  <Text style={styles.modalText}>
                    {selectedAnimal.sexe === 'M' ? 'Mâle' : 'Femelle'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color="#BDDDFC" />
                  <Text style={styles.modalText}>
                    {formatAge(selectedAnimal.date_naissance)}
                  </Text>
                </View>
                
                <Text style={styles.sectionTitle}>Histoire d'Adoption</Text>
                <Text style={styles.modalDescription}>
                  {selectedAnimal.adoption_story || "Cet animal a trouvé une famille aimante qui lui offre une vie merveilleuse. Une belle histoire qui donne espoir!"}
                </Text>
                
                <TouchableOpacity 
                  style={styles.adoptButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.adoptButtonText}>Adopter aussi</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

// Add badge styles to your existing styles
const additionalStyles = {
  adoptedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  adoptedBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  adoptedBanner: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  adoptedBannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
};