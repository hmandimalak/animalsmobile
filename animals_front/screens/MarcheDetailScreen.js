import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Modal,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

export default function EvenementMarcheDetail () {
  const [evenement, setEvenement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userDemandes, setUserDemandes] = useState({});
  const [filteredDogs, setFilteredDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const eventId = route.params?.id;

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access_token');
      setIsAuthenticated(!!token);
      
      if (eventId) fetchEventDetails(eventId);
    };
    
    checkAuth();
  }, [eventId]);

  const fetchEventDetails = async (id) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      
      // Fetch event details without authentication
      const response = await fetch(`http://192.168.0.188:8002/api/animals/evenements/marche-chiens/${id}/`);

      if (!response.ok) throw new Error(`Échec du chargement: ${response.status}`);
      
      const data = await response.json();
      setEvenement(data.evenement || data); // Handle both formats

      const dogIds = (data.evenement?.chiens || data.chiens || []);
      
      if (Array.isArray(dogIds) && dogIds.length > 0) {
        const dogDetails = await Promise.all(
          dogIds.map(dogId => 
            fetch(`http://192.168.0.188:8002/api/animals/${dogId}/`)
            .then(res => res.ok ? res.json() : null)
          )
        );
        setFilteredDogs(dogDetails.filter(Boolean));
      }

      // Only fetch user-specific data if authenticated
      if (token) {
        try {
          const userResponse = await authenticatedFetch(`http://192.168.0.188:8002/api/animals/evenements/marche-chiens/${id}/user-demandes/`);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user_demande) {
              const dogDemandeMap = {};
              userData.user_demande.chiens.forEach(dogId => {
                dogDemandeMap[dogId] = {
                  demandeId: userData.user_demande.id,
                  status: userData.user_demande.statut
                };
              });
              setUserDemandes(dogDemandeMap);
            }
          }
        } catch (err) {
          console.error("Error fetching user-specific data:", err);
          // Non-critical error, don't display to user
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimalDetails = async (dog) => {
    if (!dog?.id) return;
    try {
      const response = await fetch(`http://192.168.0.188:8002/api/animals/${dog.id}/`);
      const data = await response.json();
      setSelectedDog(data);
      setIsModalOpen(true);
    } catch (error) {
      setError('Failed to load animal details');
    }
  };

  const submitRequest = async () => {
    if (!isAuthenticated) {
      await AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
        screen: 'EvenementMarcheDetail',
        params: { id: eventId }
      }));
      navigation.navigate('Login');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await authenticatedFetch('http://192.168.0.188:8002/api/animals/demandes/marche-chiens/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evenement: evenement.id,
          chiens: selectedDogs
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          await AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
            screen: 'EvenementMarcheDetail',
            params: { id: eventId }
          }));
          navigation.navigate('Login');
          return;
        }
        throw new Error(errorData.detail || 'Une erreur est survenue');
      }
      
      await fetchEventDetails(eventId);
      setSuccess('Demande soumise avec succès !');
      setSelectedDogs([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDogSelection = (dog) => {
    if (!dog?.id || userDemandes[dog.id]) return;
    
    if (!isAuthenticated) {
      AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
        screen: 'EvenementMarcheDetail',
        params: { id: eventId }
      }));
      navigation.navigate('Login');
      return;
    }
    
    setSelectedDogs(prev => 
      prev.includes(dog.id) 
        ? prev.filter(id => id !== dog.id) 
        : [...prev, dog.id]
    );
  };

  const cancelRequest = async (dogId) => {
    if (!isAuthenticated) {
      AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
        screen: 'EvenementMarcheDetail',
        params: { id: eventId }
      }));
      navigation.navigate('Login');
      return;
    }
    
    try {
      setSubmitting(true);
      await authenticatedFetch(`http://192.168.0.188:8002/api/animals/demandes/marche-chiens/${userDemandes[dogId].demandeId}/`, {
        method: 'DELETE',
      });
      await fetchEventDetails(eventId);
      setSuccess('Demande annulée avec succès');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Acceptee': { bgColor: COLORS.secondary, textColor: COLORS.dark, borderColor: COLORS.primary, text: 'Accepté', style: styles.statusAccepted },
      'Refusee': { bgColor: COLORS.danger + '20', textColor: COLORS.danger, borderColor: COLORS.danger, text: 'Refusé', style: styles.statusRejected },
      default: { bgColor: COLORS.accent + '20', textColor: COLORS.dark, borderColor: COLORS.accent, text: 'En attente', style: styles.statusPending }
    };
    return statusConfig[status] || statusConfig.default;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('Marche')}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          <Text style={styles.backButtonText}>Retour aux événements</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}
      
      {success && (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de l'événement...</Text>
        </View>
      ) : evenement ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            <View style={styles.eventCard}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eventCardHeader}
              />
              <View style={styles.eventCardContent}>
                <Text style={styles.eventTitle}>{evenement.titre}</Text>
                
                <View style={styles.eventMetaContainer}>
                  <View style={styles.eventMetaBadge}>
                    <FontAwesome5 name="calendar-alt" size={16} color={COLORS.dark} />
                    <Text style={styles.eventMetaText}>{formatDate(evenement.date)}</Text>
                  </View>
                  <View style={styles.eventMetaBadge}>
                    <Ionicons name="time-outline" size={16} color={COLORS.dark} />
                    <Text style={styles.eventMetaText}>{evenement.heure?.substring(0, 5)}</Text>
                  </View>
                  <View style={styles.eventMetaBadge}>
                    <Ionicons name="location-outline" size={16} color={COLORS.dark} />
                    <Text style={styles.eventMetaText}>{evenement.lieu}</Text>
                  </View>
                </View>
                
                {evenement.description && (
                  <View style={styles.eventDescriptionContainer}>
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <View style={styles.dividerIcon}>
                        <MaterialCommunityIcons name="paw" size={24} color={COLORS.dark} />
                      </View>
                    </View>
                    <Text style={styles.eventDescription}>{evenement.description}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.dogsCard}>
              <View style={styles.dogsCardHeader}>
                <View style={styles.dogsCardHeaderContent}>
                  <Text style={styles.dogsCardTitle}>
                    Chiens participants
                  </Text>
                  <View style={styles.dogsCountBadge}>
                    <Text style={styles.dogsCountText}>
                      {filteredDogs.length} compagnons
                    </Text>
                  </View>
                </View>
              </View>
              
              {filteredDogs.length === 0 ? (
                <View style={styles.emptyDogsContainer}>
                  <View style={styles.emptyDogsIcon}>
                    <MaterialCommunityIcons name="paw" size={32} color={COLORS.darkGray} />
                  </View>
                  <Text style={styles.emptyDogsTitle}>Aucun chien disponible</Text>
                  <Text style={styles.emptyDogsText}>Aucun chien n'a été ajouté à cet événement pour le moment.</Text>
                </View>
              ) : (
                <View style={styles.dogsList}>
                  {filteredDogs.map((dog) => (
                    <TouchableOpacity
                      key={dog.id}
                      style={[
                        styles.dogCard,
                        userDemandes[dog.id] && styles.dogCardDeactivated,
                        selectedDogs.includes(dog.id) && styles.dogCardSelected
                      ]}
                      onPress={() => !userDemandes[dog.id] && fetchAnimalDetails(dog)}
                      activeOpacity={userDemandes[dog.id] ? 1 : 0.7}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.dogCardTopBar}
                      />
                      <View style={styles.dogCardContent}>
                        <View style={styles.dogCardMainInfo}>
                          <View style={styles.dogImage}>
                            {dog.image ? (
                              <Image
                                source={{ uri: `http://192.168.0.188:8002${dog.image}` }}
                                style={styles.dogImageContent}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.dogImagePlaceholder}>
                                <Text style={{ fontSize: 30 }}>🐶</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.dogInfo}>
                            <Text style={styles.dogName}>{dog.nom}</Text>
                            <Text style={styles.dogBreed}>{dog.race || "Race inconnue"}</Text>
                            <Text style={styles.dogMeta}>
                              {dog.sexe === 'M' ? 'Mâle' : 'Femelle'} • {formatDate(dog.date_naissance)}
                            </Text>
                            {userDemandes[dog.id] && (
                              <View style={[
                                styles.statusBadge,
                                getStatusBadge(userDemandes[dog.id].status).style
                              ]}>
                                <Text style={styles.statusText}>
                                  {getStatusBadge(userDemandes[dog.id].status).text}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        {dog.description && (
                          <View style={styles.dogDescription}>
                            <Text style={styles.dogDescriptionText} numberOfLines={2}>
                              {dog.description}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.dogEnergyInfo}>
                          <MaterialCommunityIcons name="paw" size={14} color={COLORS.darkGray} />
                          <Text style={styles.dogEnergyText}>
                            {dog.niveau_energie || 'Énergie modérée'}
                          </Text>
                          
                          {selectedDogs.includes(dog.id) && (
                            <View style={styles.dogSelectedIcon}>
                              <View style={styles.selectedIconCircle}>
                                <Ionicons name="heart" size={16} color={COLORS.white} />
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundCard}>
            <View style={styles.notFoundIconContainer}>
              <Ionicons name="close" size={32} color={COLORS.danger} />
            </View>
            <Text style={styles.notFoundTitle}>Événement non trouvé</Text>
            <Text style={styles.notFoundText}>Cet événement n'existe pas ou a été supprimé.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Marche')}
              style={[styles.notFoundButton, { backgroundColor: COLORS.primary }]} 
            >
              <Text style={styles.notFoundButtonText}>Retour à la liste des événements</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: COLORS.primary }]} />
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                {selectedDog?.nom}
              </Text>
              
              <View style={styles.modalDogDetails}>
                <View style={styles.modalDogImageContainer}>
                  {selectedDog?.image ? (
                    <Image
                      source={{ uri: `http://192.168.0.188:8002${selectedDog.image}` }}
                      style={styles.modalDogImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalDogImagePlaceholder}>
                      <Text style={{ fontSize: 40 }}>🐾</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalDogInfoRow}>
                  <View style={styles.modalDogInfoItem}>
                    <Text style={styles.modalDogInfoLabel}>Race</Text>
                    <Text style={styles.modalDogInfoValue}>{selectedDog?.race || 'Non spécifiée'}</Text>
                  </View>
                  <View style={styles.modalDogInfoItem}>
                    <Text style={styles.modalDogInfoLabel}>Sexe</Text>
                    <Text style={styles.modalDogInfoValue}>{selectedDog?.sexe === 'M' ? 'Mâle' : 'Femelle'}</Text>
                  </View>
                </View>
                
                <View style={styles.modalDogInfoFull}>
                  <Text style={styles.modalDogInfoLabel}>Date de naissance</Text>
                  <Text style={styles.modalDogInfoValue}>{formatDate(selectedDog?.date_naissance)}</Text>
                </View>
                
                {selectedDog?.description && (
                  <View style={styles.modalDogInfoFull}>
                    <Text style={styles.modalDogInfoLabel}>Description</Text>
                    <Text style={styles.modalDogInfoDescription}>{selectedDog.description}</Text>
                  </View>
                )}
              </View>
              
              {selectedDog && userDemandes[selectedDog.id] ? (
                getStatusBadge(userDemandes[selectedDog.id].status).text !== 'Accepté' && (
                  <TouchableOpacity
                    onPress={() => {
                      cancelRequest(selectedDog.id);
                      setIsModalOpen(false);
                    }}
                    style={styles.cancelRequestButton}
                    disabled={submitting}
                  >
                    {submitting ? 
                      <View style={styles.submittingContent}>
                        <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 10 }} />
                        <Text style={styles.buttonText}>Annulation...</Text>
                      </View> : 
                      <Text style={styles.buttonText}>Annuler la demande</Text>
                    }
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    if (!isAuthenticated) {
                      AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
                        screen: 'EvenementMarcheDetail',
                        params: { id: eventId }
                      }));
                      navigation.navigate('Login');
                      setIsModalOpen(false);
                      return;
                    }
                    toggleDogSelection(selectedDog);
                    setIsModalOpen(false);
                  }}
                  style={[
                    styles.selectDogButton,
                    selectedDogs.includes(selectedDog?.id) && styles.deselectDogButton
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {!isAuthenticated 
                      ? 'Se connecter pour sélectionner' 
                      : selectedDogs.includes(selectedDog?.id) 
                        ? 'Désélectionner' 
                        : 'Sélectionner pour la marche'}
                  </Text>
                  {!selectedDogs.includes(selectedDog?.id) && (
                    <MaterialCommunityIcons name="paw" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              onPress={() => setIsModalOpen(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedDogs.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={submitRequest}
            disabled={submitting}
            style={styles.fab}
          >
            {submitting ? (
              <View style={styles.submittingContent}>
                <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 10 }} />
                <Text style={styles.fabText}>Envoi en cours...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.fabText}>Confirmer la sélection</Text>
                <View style={styles.fabBadge}>
                  <Text style={styles.fabBadgeText}>{selectedDogs.length}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: COLORS.danger + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  errorContent: {
    flexDirection: 'row',
  },
  errorText: {
    color: COLORS.danger,
    marginLeft: 8,
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  successContent: {
    flexDirection: 'row',
  },
  successText: {
    color: '#047857',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventCardHeader: {
    height: 4,
  },
  eventCardContent: {
    padding: 24,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  eventMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  eventMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  eventMetaText: {
    fontWeight: '500',
    marginLeft: 8,
    color: COLORS.dark,
  },
  eventDescriptionContainer: {
    alignItems: 'center',
  },
  dividerContainer: {
    position: 'relative',
    width: '100%',
    marginVertical: 16,
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerIcon: {
    position: 'relative',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  eventDescription: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  dogsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dogsCardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dogsCardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dogsCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dogsCountBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  dogsCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },

  emptyDogsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyDogsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyDogsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyDogsText: {
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  dogsList: {
    padding: 16,
  },
  dogCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dogCardDeactivated: {
    opacity: 0.7,
  },
  dogCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dogCardTopBar: {
    height: 4,
    backgroundColor: COLORS.accent,
  },
  dogCardContent: {
    padding: 16,
  },
  dogCardMainInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dogImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  dogImageContent: {
    width: '100%',
    height: '100%',
  },
  dogImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dogName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  dogMeta: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dogDescription: {
    marginBottom: 12,
  },
  dogDescriptionText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  dogEnergyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogEnergyText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  dogSelectedIcon: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectedIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notFoundCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notFoundIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  notFoundText: {
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  notFoundButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  notFoundButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    height: 6,
  },
  modalBody: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDogDetails: {
    marginBottom: 24,
  },
  modalDogImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalDogImage: {
    width: '100%',
    height: '100%',
  },
  modalDogImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDogInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalDogInfoItem: {
    flex: 1,
  },
  modalDogInfoFull: {
    marginBottom: 16,
  },
  modalDogInfoLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  modalDogInfoValue: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  modalDogInfoDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  selectDogButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deselectDogButton: {
    backgroundColor: COLORS.darkGray,
  },
  cancelRequestButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  submittingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  modalCloseButtonText: {
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabBadge: {
    backgroundColor: COLORS.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  fabBadgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  }
});
