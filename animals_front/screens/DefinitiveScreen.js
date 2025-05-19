import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../android/app/api';


const colors = {
  primary: '#4DB6AC',  // Teal color from the image
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#333333',
  lightGray: '#EAEAEA',
  mediumGray: '#9E9E9E',
  red: '#FF5252',
};



export default function DefinitiveScreen() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState({});


  useEffect(() => {
    api.fetchDefinitiveAnimals()
      .then(data => setAnimals(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  	
  const handleAnimalClick = (animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedAnimal(null);
    setIsModalOpen(false);
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
  const toggleFavorite = (id) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };


  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {animals.length ? (
            animals.map(animal => (
              <TouchableOpacity key={animal.id} onPress={() => handleAnimalClick(animal)} activeOpacity={0.8}>
                {/* Replicate your AnimalCard UI here */}
                <View style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.lightGray }}>
                  <Image
                    source={animal.image ? { uri: `http://192.168.0.132:8000${animal.image}` } : require('../assets/dogandcat.jpeg')}
                    style={{ width: '100%', height: 200 }}
                  />
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{animal.nom}</Text>
                    <Text style={{ color: colors.mediumGray }}>{animal.race}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ padding: 16 }}>Aucun animal en garderie Definitive.</Text>
          )}
        </ScrollView>
  
        {/* Detail Modal */}
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
                />
  
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
                      <Text style={{ fontSize: 14 }}>
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
                    onPress={() => {/* handle adoption */}}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.adoptButtonText}>Adopter</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }
  
  // Add your StyleSheet below
  const styles = {
    modalContainer: { flex: 1, backgroundColor: colors.white },
    closeButton: { padding: 16, backgroundColor: colors.primary },
    detailImage: { width: '100%', height: 300 },
    detailFavoriteButton: { position: 'absolute', top: 20, right: 20, padding: 8 },
    detailContent: { padding: 16 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailName: { fontSize: 24, fontWeight: 'bold' },
    detailBreedContainer: { backgroundColor: colors.lightGray, borderRadius: 8, padding: 4 },
    detailBreed: { fontSize: 14, fontWeight: '500' },
    detailInfoRow: { flexDirection: 'row', marginVertical: 12 },
    detailInfoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    detailInfoText: { marginLeft: 4, fontSize: 14, color: colors.mediumGray },
    divider: { height: 1, backgroundColor: colors.lightGray, marginVertical: 12 },
    aboutTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    detailDescription: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
    adoptButton: { backgroundColor: colors.success, padding: 12, borderRadius: 8, alignItems: 'center' },
    adoptButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 }
  };
