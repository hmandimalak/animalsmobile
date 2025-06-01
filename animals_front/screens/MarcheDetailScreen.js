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
      const response = await fetch(`http://192.168.0.132:8000/api/animals/evenements/marche-chiens/${id}/`);

      if (!response.ok) throw new Error(`Échec du chargement: ${response.status}`);
      
      const data = await response.json();
      setEvenement(data.evenement || data); // Handle both formats

      const dogIds = (data.evenement?.chiens || data.chiens || []);
      
      if (Array.isArray(dogIds) && dogIds.length > 0) {
        const dogDetails = await Promise.all(
          dogIds.map(dogId => 
            fetch(`http://192.168.0.132:8000/api/animals/${dogId}/`)
            .then(res => res.ok ? res.json() : null)
          )
        );
        setFilteredDogs(dogDetails.filter(Boolean));
      }

      // Only fetch user-specific data if authenticated
      if (token) {
        try {
          const userResponse = await authenticatedFetch(`http://192.168.0.132:8000/api/animals/evenements/marche-chiens/${id}/user-demandes/`);
          
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
      const response = await fetch(`http://192.168.0.132:8000/api/animals/${dog.id}/`);
      const data = await response.json();
      setSelectedDog(data);
      setIsModalOpen(true);
    } catch (error) {
      setError('Failed to load animal details');
    }
  };

  const submitRequest = async () => {
    if (!isAuthenticated) {
      // Save the current page to redirect back after login
      await AsyncStorage.setItem('redirectAfterLogin', JSON.stringify({
        screen: 'EvenementMarcheDetail',
        params: { id: eventId }
      }));
      navigation.navigate('Login');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await authenticatedFetch('http://192.168.0.132:8000/api/animals/demandes/marche-chiens/', {
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
    
    // If not authenticated, redirect to login when trying to select a dog
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
      await authenticatedFetch(`http://192.168.0.132:8000/api/animals/demandes/marche-chiens/${userDemandes[dogId].demandeId}/`, {
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
      'Acceptee': { bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-200', text: 'Accepté', style: styles.statusAccepted },
      'Refusee': { bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-200', text: 'Refusé', style: styles.statusRejected },
      default: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-200', text: 'En attente', style: styles.statusPending }
    };
    return statusConfig[status] || statusConfig.default;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Custom Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('Marche')}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
          <Text style={styles.backButtonText}>Retour aux événements</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}
      
      {/* Success Message */}
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
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Chargement de l'événement...</Text>
        </View>
      ) : evenement ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.contentContainer}>
            {/* Event Card */}
            <View style={styles.eventCard}>
              <LinearGradient
                colors={['#8B5CF6', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eventCardHeader}
              />
              <View style={styles.eventCardContent}>
                <Text style={styles.eventTitle}>{evenement.titre}</Text>
                
                <View style={styles.eventMetaContainer}>
                  <View style={styles.eventMetaBadge}>
                    <FontAwesome5 name="calendar-alt" size={16} color="#9D6FDE" />
                    <Text style={styles.eventMetaText}>{formatDate(evenement.date)}</Text>
                  </View>
                  <View style={styles.eventMetaBadge}>
                    <Ionicons name="time-outline" size={16} color="#9D6FDE" />
                    <Text style={styles.eventMetaText}>{evenement.heure?.substring(0, 5)}</Text>
                  </View>
                  <View style={styles.eventMetaBadge}>
                    <Ionicons name="location-outline" size={16} color="#9D6FDE" />
                    <Text style={styles.eventMetaText}>{evenement.lieu}</Text>
                  </View>
                </View>
                
                {evenement.description && (
                  <View style={styles.eventDescriptionContainer}>
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <View style={styles.dividerIcon}>
                        <MaterialCommunityIcons name="paw" size={24} color="#D946EF" />
                      </View>
                    </View>
                    <Text style={styles.eventDescription}>{evenement.description}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Dogs List */}
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
                    <MaterialCommunityIcons name="paw" size={32} color="#9CA3AF" />
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
                        colors={['#C4B5FD', '#F5D0FE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.dogCardTopBar}
                      />
                      <View style={styles.dogCardContent}>
                        <View style={styles.dogCardMainInfo}>
                          <View style={styles.dogImage}>
                            {dog.image ? (
                              <Image
                                source={{ uri: `http://192.168.0.132:8000${dog.image}` }}
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
                          <MaterialCommunityIcons name="paw" size={14} color="#9CA3AF" />
                          <Text style={styles.dogEnergyText}>
                            {dog.niveau_energie || 'Énergie modérée'}
                          </Text>
                          
                          {selectedDogs.includes(dog.id) && (
                            <View style={styles.dogSelectedIcon}>
                              <View style={styles.selectedIconCircle}>
                                <Ionicons name="heart" size={16} color="#FFFFFF" />
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
              <Ionicons name="close" size={32} color="#EF4444" />
            </View>
            <Text style={styles.notFoundTitle}>Événement non trouvé</Text>
            <Text style={styles.notFoundText}>Cet événement n'existe pas ou a été supprimé.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Marche')}
              style={styles.notFoundButton}
            >
              <Text style={styles.notFoundButtonText}>Retour à la liste des événements</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Dog Details Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#8B5CF6', '#D946EF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            />
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                {selectedDog?.nom}
              </Text>
              
              <View style={styles.modalDogDetails}>
                <View style={styles.modalDogImageContainer}>
                  {selectedDog?.image ? (
                    <Image
                      source={{ uri: `http://192.168.0.132:8000${selectedDog.image}` }}
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
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
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
                    <MaterialCommunityIcons name="paw" size={16} color="#FFFFFF" />
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

      {/* Floating Action Button */}
      {selectedDogs.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={submitRequest}
            disabled={submitting}
            style={styles.fab}
          >
            {submitting ? (
              <View style={styles.submittingContent}>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
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
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  errorContent: {
    flexDirection: 'row',
  },
  errorText: {
    color: '#B91C1C',
    marginLeft: 8,
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
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
    color: '#8B5CF6',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    marginBottom: 24,
    shadowColor: '#7C3AED',
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
    color: '#7C3AED',
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
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  eventMetaText: {
    fontWeight: '500',
    marginLeft: 8,
    color: '#6D28D9',
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
    backgroundColor: '#E5E7EB',
  },
  dividerIcon: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  eventDescription: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  dogsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dogsCardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dogsCardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dogsCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  dogsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  dogsCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
  },
  emptyDogsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyDogsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyDogsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDogsText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  dogsList: {
    padding: 16,
  },
  dogCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dogCardDeactivated: {
  opacity: 0.7,
},
dogCardSelected: {
  borderColor: '#8B5CF6',
  borderWidth: 2,
},
dogCardTopBar: {
  height: 4,
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
  backgroundColor: '#EDE9FE',
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
  color: '#1F2937',
  marginBottom: 4,
},
dogBreed: {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 4,
},
dogMeta: {
  fontSize: 12,
  color: '#9CA3AF',
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
  color: '#6B7280',
  lineHeight: 18,
},
dogEnergyInfo: {
  flexDirection: 'row',
  alignItems: 'center',
},
dogEnergyText: {
  fontSize: 12,
  color: '#9CA3AF',
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
  backgroundColor: '#D946EF',
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
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 32,
  alignItems: 'center',
  width: '100%',
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
notFoundIconContainer: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#FEE2E2',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
},
notFoundTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 8,
},
notFoundText: {
  color: '#6B7280',
  textAlign: 'center',
  marginBottom: 20,
},
notFoundButton: {
  backgroundColor: '#8B5CF6',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 8,
},
notFoundButtonText: {
  color: '#FFFFFF',
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
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  width: '100%',
  maxWidth: 480,
  overflow: 'hidden',
  elevation: 8,
  shadowColor: '#000',
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
  color: '#7C3AED',
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
  backgroundColor: '#EDE9FE',
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
  color: '#9CA3AF',
  marginBottom: 4,
},
modalDogInfoValue: {
  fontSize: 16,
  color: '#1F2937',
  fontWeight: '500',
},
modalDogInfoDescription: {
  fontSize: 14,
  color: '#4B5563',
  lineHeight: 20,
},
selectDogButton: {
  backgroundColor: '#8B5CF6',
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
},
deselectDogButton: {
  backgroundColor: '#9CA3AF',
},
cancelRequestButton: {
  backgroundColor: '#EF4444',
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
},
buttonText: {
  color: '#FFFFFF',
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
  borderTopColor: '#F3F4F6',
},
modalCloseButtonText: {
  color: '#6B7280',
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
  backgroundColor: '#7C3AED',
  borderRadius: 30,
  paddingVertical: 16,
  paddingHorizontal: 24,
  flexDirection: 'row',
  alignItems: 'center',
  elevation: 6,
  shadowColor: '#7C3AED',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
},
fabText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 16,
},
fabBadge: {
  backgroundColor: '#D946EF',
  width: 24,
  height: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 12,
},
fabBadgeText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 12,
}})