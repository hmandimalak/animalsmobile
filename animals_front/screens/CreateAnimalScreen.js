import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { authenticatedFetch } from '../android/app/authInterceptor';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, 
  Image, Modal, ActivityIndicator, Alert, SafeAreaView,
  Platform, KeyboardAvoidingView, StyleSheet, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Garde() {
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Load auth data when component mounts
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("access_token");
        const storedUserId = await AsyncStorage.getItem("user_id");
        
        console.log("Retrieved user ID:", storedUserId); // Debug log
        
        setToken(storedToken);
        setUserId(storedUserId);
      } catch (error) {
        console.error("Error loading auth data:", error);
      }
    };
    loadAuthData();
  }, []);
  
  const [formData, setFormData] = useState({
    nom: '',
    espece: '',
    race: '',
    date_naissance: '',
    sexe: 'M',
    description: '',
    type_garde: 'Définitive',
    date_reservation: '',
    date_fin: '',
    photo: null,
  });

  const speciesOptions = {
    Chien: [
      "Berger Allemand", "Labrador Retriever", "Golden Retriever", "Bulldog",
      "Rottweiler", "Husky Sibérien", "Beagle", "Caniche", "Chihuahua",
      "Yorkshire Terrier", "Autre"
    ],
    Chat: [
      "Persan", "Siamois", "Maine Coon", "Bengal", "British Shorthair",
      "Ragdoll", "Sphynx", "Abyssin", "Sacré de Birmanie", "Européen", "Autre"
    ]
  };

  // Date picker state
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showReservationDatePicker, setShowReservationDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adoptedAnimals, setAdoptedAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdoptedAnimal, setSelectedAdoptedAnimal] = useState(null);
  const [formMode, setFormMode] = useState('new'); // 'new' or 'existing'

  const fetchAdoptedAnimals = async () => {
    try {
      // Get current token before making the request
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
      
      const response = await authenticatedFetch("http://192.168.0.132:8000/api/animals/mes-adoptions/");
      if (!response.ok) throw new Error('Échec de la récupération');
      return await response.json();
    } catch (error) {
      console.error("Erreur fetchAdoptedAnimals :", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadAnimals = async () => {
      setIsLoading(true);
      try {
        const animals = await fetchAdoptedAnimals();
        setAdoptedAnimals(animals || []);
      } catch (error) {
        console.error("Error fetching adopted animals:", error);
        setAdoptedAnimals([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAnimals();
  }, []);

  const handleTextChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSpeciesChange = (value) => {
    setFormData({ ...formData, espece: value, race: '' }); // Reset race when species changes
  };

  const handleDateChange = (event, selectedDate, dateField) => {
    // Hide the date picker
    if (dateField === 'date_naissance') setShowBirthDatePicker(false);
    else if (dateField === 'date_reservation') setShowReservationDatePicker(false);
    else if (dateField === 'date_fin') setShowEndDatePicker(false);

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, [dateField]: formattedDate });
    }
  };

  const handleAdoptedAnimalSelect = (animal) => {
    setSelectedAdoptedAnimal(animal);
    setFormData({
      ...formData,
      nom: animal.nom,
      espece: animal.espece,
      race: animal.race,
      date_naissance: animal.date_naissance,
      sexe: animal.sexe,
      description: animal.description || '',
      // Note: we don't change type_garde, date_reservation, and date_fin as those are specific to this request
    });
  };

  const switchMode = (mode) => {
    setFormMode(mode);
    if (mode === 'new') {
      setSelectedAdoptedAnimal(null);
      setFormData({
        nom: '',
        espece: '',
        race: '',
        date_naissance: '',
        sexe: 'M',
        description: '',
        type_garde: formData.type_garde, // Preserve the type_garde
        date_reservation: formData.date_reservation, // Preserve reservation dates
        date_fin: formData.date_fin,
        photo: null,
      });
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, photo: result.assets[0] });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const validateForm = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const { date_naissance, date_reservation, date_fin, type_garde } = formData;

    if (!date_naissance) {
      Alert.alert('Erreur', 'Veuillez entrer la date de naissance.');
      return false;
    }

    if (date_naissance > today) {
      Alert.alert('Erreur', 'La date de naissance doit être aujourd\'hui ou une date précédente.');
      return false;
    }

    if (type_garde === 'Temporaire') {
      if (!date_reservation) {
        Alert.alert('Erreur', 'Veuillez entrer une date de réservation.');
        return false;
      }

      if (date_reservation < today) {
        Alert.alert('Erreur', 'La date de réservation doit être aujourd\'hui ou une date future.');
        return false;
      }

      if (date_naissance >= date_reservation) {
        Alert.alert('Erreur', 'La date de naissance doit être avant la date de réservation.');
        return false;
      }

      if (date_fin && date_fin <= date_reservation) {
        Alert.alert('Erreur', 'La date de fin doit être après la date de réservation.');
        return false;
      }
    }

    return true;
  };
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

 const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  setError(null);

  try {
    const authToken = await getAuthToken();
    const currentUserId = await AsyncStorage.getItem("user_id");

    console.log("[DEBUG] Auth token for submission:", authToken ? "Token exists" : "No token");
    console.log("[DEBUG] User ID for submission:", currentUserId);

    if (!authToken || !currentUserId) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour soumettre une demande de garde.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    const apiFormData = new FormData();

    if (formMode === 'existing' && selectedAdoptedAnimal) {
      apiFormData.append('animal', selectedAdoptedAnimal.id);
      apiFormData.append('type_garde', formData.type_garde);

      if (formData.type_garde === 'Temporaire') {
        apiFormData.append('date_reservation', formData.date_reservation);
        if (formData.date_fin) {
          apiFormData.append('date_fin', formData.date_fin);
        }
      }

      apiFormData.append('utilisateur', currentUserId);

      const response = await fetch('http://192.168.0.132:8000/api/animals/demandes-garde/', {
        method: "POST",
        headers: {
        
        'Authorization': authToken,
        },
        body: apiFormData,

      });

      const responseText = await response.text();
      console.log("Server response text:", responseText);

      if (response.ok) {
        setIsModalOpen(true);
      } else if (response.status === 401) {
        Alert.alert("Session expirée", "Votre session a expiré. Veuillez vous reconnecter.");
        navigation.navigate("Login");
      } else {
        try {
          const errorData = JSON.parse(responseText);
          Alert.alert("Erreur", errorData.detail || JSON.stringify(errorData));
        } catch {
          Alert.alert("Erreur", "Une erreur est survenue lors de la soumission.");
        }
      }
    } else {
      // For new animal
      Object.keys(formData).forEach(key => {
        if (key !== 'photo') {
          apiFormData.append(key, formData[key]);
        }
      });

      if (formData.photo) {
        apiFormData.append('image', {
          uri: formData.photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      apiFormData.append('utilisateur', currentUserId);

      const response = await fetch('http://192.168.0.132:8000/api/animals/animaux/', {
        method: "POST",
        headers: {
       
        'Authorization': authToken,
        },
        body: apiFormData,
      });

      const responseText = await response.text();
      console.log("Server response text:", responseText);

      if (response.ok) {
        setIsModalOpen(true);
      } else if (response.status === 401) {
        Alert.alert("Session expirée", "Votre session a expiré. Veuillez vous reconnecter.");
        navigation.navigate("Login");
      } else {
        try {
          const errorData = JSON.parse(responseText);
          Alert.alert("Erreur", errorData.detail || JSON.stringify(errorData));
        } catch {
          Alert.alert("Erreur", "Une erreur est survenue lors de la soumission.");
        }
      }
    }
  } catch (error) {
    console.error("Network error:", error);
    setError(error.message);
    Alert.alert("Erreur réseau", "Une erreur de connexion est survenue");
  } finally {
    setLoading(false);
  }
};

  // Function to get animal emoji based on species
  const getAnimalEmoji = (species) => {
    return species === 'Chien' ? '🐶' : species === 'Chat' ? '🐱' : '🐾';
  };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Header */}
          <LinearGradient
            colors={['#8A2BE2', '#4B0082']}
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
              <Text style={styles.headerTitle}>Nouvelle Fiche Animal</Text>
              <View style={{width: 24}} />
            </View>
            <Text style={styles.headerSubtitle}>
              Confiez-nous votre compagnon en quelques étapes
            </Text>
          </LinearGradient>

          {/* Form Mode Toggle - Segmented Control */}
          <View style={styles.formModeToggleContainer}>
            <TouchableOpacity
              onPress={() => switchMode('new')}
              style={[
                styles.formModeButton,
                formMode === 'new' && styles.formModeButtonActive,
                {borderTopLeftRadius: 10, borderBottomLeftRadius: 10}
              ]}
            >
              <View style={styles.formModeButtonContent}>
                <MaterialCommunityIcons 
                  name="paw" 
                  size={20} 
                  color={formMode === 'new' ? 'white' : '#8A2BE2'} 
                />
                <Text style={[
                  styles.formModeButtonText,
                  formMode === 'new' && styles.formModeButtonTextActive
                ]}>
                  Nouveau
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchMode('existing')}
              style={[
                styles.formModeButton,
                formMode === 'existing' && styles.formModeButtonActive,
                {borderTopRightRadius: 10, borderBottomRightRadius: 10}
              ]}
            >
              <View style={styles.formModeButtonContent}>
               <MaterialCommunityIcons name="format-list-bulleted" size={20} color={formMode === 'existing' ? 'white' : '#8A2BE2'} />
                <Text style={[
                  styles.formModeButtonText,
                  formMode === 'existing' && styles.formModeButtonTextActive
                ]}>
                  Existant
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Adopted Animals List */}
          {formMode === 'existing' && (
            <View style={styles.adoptedAnimalsContainer}>
              <Text style={styles.sectionTitle}>Vos animaux adoptés</Text>
              {isLoading ? (
                <ActivityIndicator size="large" color="#8A2BE2" />
              ) : adoptedAnimals.length === 0 ? (
                <View style={styles.emptyAnimalsContainer}>
                  <Image 
                    source={{uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png'}}
                    style={styles.emptyAnimalsImage}
                  />
                  <Text style={styles.emptyAnimalsText}>
                    Aucun animal adopté trouvé
                  </Text>
                </View>
              ) : (
                <View style={styles.animalsList}>
                  {adoptedAnimals.map((animal) => (
                    <TouchableOpacity
                      key={animal.id}
                      onPress={() => handleAdoptedAnimalSelect(animal)}
                      style={[
                        styles.animalCard,
                        selectedAdoptedAnimal?.id === animal.id && styles.animalCardSelected
                      ]}
                    >
                      <View style={styles.animalCardContent}>
                        <View style={styles.animalCardEmoji}>
                          <Text style={styles.animalCardEmojiText}>
                            {getAnimalEmoji(animal.espece)}
                          </Text>
                        </View>
                        <View style={styles.animalCardInfo}>
                          <Text style={styles.animalCardName}>{animal.nom}</Text>
                          <Text style={styles.animalCardDetails}>
                            {animal.race} • {animal.sexe === 'M' ? 'Mâle' : 'Femelle'}
                          </Text>
                        </View>
                        {selectedAdoptedAnimal?.id === animal.id && (
                          <View style={styles.selectedCheckmark}>
                            <FontAwesome5 name="check-circle" size={20} color="#8A2BE2" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Form Fields Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Informations de l'animal</Text>
            
            {/* Name Input */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nom</Text>
              <View style={styles.formInputContainer}>
                <MaterialCommunityIcons name="paw" size={20} color="#8A2BE2" />
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Luna"
                  placeholderTextColor="#AAAAAA"
                  value={formData.nom}
                  onChangeText={(text) => handleTextChange('nom', text)}
                />
              </View>
            </View>

            {/* Species Picker */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Espèce</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.espece}
                      onValueChange={handleSpeciesChange}
                      dropdownIconColor="#8A2BE2"
                      style={styles.picker}
                    >
                      <Picker.Item label="Choisir une espèce" value="" />
                      <Picker.Item label="🐶 Chien" value="Chien" />
                      <Picker.Item label="🐱 Chat" value="Chat" />
                    </Picker>
                  </View>
                </View>
                            {/* Race Picker */}
                {formData.espece && (
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Race</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.race}
                        onValueChange={(value) => handleTextChange('race', value)}
                        enabled={formMode !== 'existing' || !selectedAdoptedAnimal}
                        dropdownIconColor="#8A2BE2"
                        style={styles.picker}
                      >
                        <Picker.Item label="Sélectionner une race" value="" />
                        {speciesOptions[formData.espece]?.map((race) => (
                          <Picker.Item key={race} label={race} value={race} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}
            {/* Birth Date Picker */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Date de Naissance</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowBirthDatePicker(true)}
              >
                <Text style={formData.date_naissance ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {formData.date_naissance || 'JJ/MM/AAAA'}
                </Text>
                <MaterialCommunityIcons name="calendar" size={24} color="#8A2BE2" />
              </TouchableOpacity>
              {showBirthDatePicker && (
                <DateTimePicker
                  value={formData.date_naissance ? new Date(formData.date_naissance) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => 
                    handleDateChange(event, selectedDate, 'date_naissance')
                  }
                />
              )}
            </View>

            {/* Gender Selector */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Sexe</Text>
              <View style={styles.genderSelector}>
                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => handleTextChange('sexe', 'M')}
                >
                  <View style={[
                    styles.radioButton,
                    formData.sexe === 'M' && styles.radioButtonSelected
                  ]}>
                    {formData.sexe === 'M' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.genderText}>Mâle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => handleTextChange('sexe', 'F')}
                >
                  <View style={[
                    styles.radioButton,
                    formData.sexe === 'F' && styles.radioButtonSelected
                  ]}>
                    {formData.sexe === 'F' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.genderText}>Femelle</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description Field */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Description</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Décrivez votre animal (caractère, habitudes, besoins spécifiques...)"
                  placeholderTextColor="#AAAAAA"
                  value={formData.description}
                  onChangeText={(text) => handleTextChange('description', text)}
                />
              </View>
            </View>

            {/* Photo Upload */}
            {formMode === 'new' && (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Photo</Text>
                <TouchableOpacity 
                  style={styles.photoUploadContainer}
                  onPress={pickImage}
                >
                  {formData.photo ? (
                    <Image 
                      source={{ uri: formData.photo.uri }}
                      style={styles.uploadedPhoto}
                    />
                  ) : (
                    <View style={styles.photoUploadPlaceholder}>
                      <MaterialCommunityIcons name="image-plus" size={32} color="#8A2BE2" />
                      <Text style={styles.photoUploadText}>Ajouter une photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Type de Garde */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Type de Garde</Text>
              <View style={styles.typeGardeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeGardeOption,
                    formData.type_garde === 'Définitive' && styles.typeGardeOptionSelected
                  ]}
                  onPress={() => handleTextChange('type_garde', 'Définitive')}
                >
                  <MaterialCommunityIcons 
                    name="home-heart" 
                    size={24} 
                    color={formData.type_garde === 'Définitive' ? 'white' : '#8A2BE2'} 
                  />
                  <Text style={[
                    styles.typeGardeText,
                    formData.type_garde === 'Définitive' && styles.typeGardeTextSelected
                  ]}>
                    Définitive
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeGardeOption,
                    formData.type_garde === 'Temporaire' && styles.typeGardeOptionSelected
                  ]}
                  onPress={() => handleTextChange('type_garde', 'Temporaire')}
                >
                  <MaterialCommunityIcons 
                    name="calendar-clock" 
                    size={24} 
                    color={formData.type_garde === 'Temporaire' ? 'white' : '#8A2BE2'} 
                  />
                  <Text style={[
                    styles.typeGardeText,
                    formData.type_garde === 'Temporaire' && styles.typeGardeTextSelected
                  ]}>
                    Temporaire
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Additional fields for Temporary guard */}
            {formData.type_garde === 'Temporaire' && (
              <>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Date de début</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowReservationDatePicker(true)}
                  >
                    <Text style={formData.date_reservation ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {formData.date_reservation || 'JJ/MM/AAAA'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={24} color="#8A2BE2" />
                  </TouchableOpacity>
                  {showReservationDatePicker && (
                    <DateTimePicker
                      value={formData.date_reservation ? new Date(formData.date_reservation) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => 
                        handleDateChange(event, selectedDate, 'date_reservation')
                      }
                    />
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Date de fin (optionnelle)</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={formData.date_fin ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {formData.date_fin || 'JJ/MM/AAAA'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={24} color="#8A2BE2" />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={formData.date_fin ? new Date(formData.date_fin) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => 
                        handleDateChange(event, selectedDate, 'date_fin')
                      }
                    />
                  )}
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || (formMode === 'existing' && !selectedAdoptedAnimal)) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || (formMode === 'existing' && !selectedAdoptedAnimal)}
            >
              {loading ? (
                <View style={styles.submitButtonLoadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitButtonText}>Envoi en cours...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="paw" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Valider la demande</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModalOpen}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIcon}>
                  <Text style={styles.modalIconText}>🎉</Text>
                </View>
              </View>
              <Text style={styles.modalTitle}>Demande envoyée !</Text>
              <Text style={styles.modalDescription}>
                Nous avons bien reçu votre demande et vous contacterons dans les plus brefs délais.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setIsModalOpen(false);
                  navigation.navigate('Home');
                }}
              >
                <Text style={styles.modalButtonText}>Retour à l'accueil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formModeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  formModeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formModeButtonActive: {
    backgroundColor: '#8A2BE2',
  },
  formModeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formModeButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#333',
  },
  formModeButtonTextActive: {
    color: 'white',
  },
  adoptedAnimalsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyAnimalsContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  emptyAnimalsImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  emptyAnimalsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  animalsList: {
    marginBottom: 10,
  },
  animalCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  animalCardSelected: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  animalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalCardEmoji: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  animalCardEmojiText: {
    fontSize: 24,
  },
  animalCardInfo: {
    flex: 1,
  },
  animalCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  animalCardDetails: {
    fontSize: 14,
    color: '#666',
  },
  selectedCheckmark: {
    marginLeft: 10,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E6',
  },
  formInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    color: '#333',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E6',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E6',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  genderSelector: {
    flexDirection: 'row',
    marginTop: 5,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    borderColor: '#8A2BE2',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8A2BE2',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E6',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  photoUploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1C4E9',
    borderRadius: 15,
    height: 180,
    overflow: 'hidden',
  },
  photoUploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  photoUploadText: {
    marginTop: 10,
    color: '#8A2BE2',
    fontSize: 16,
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  typeGardeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeGardeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  typeGardeOptionSelected: {
    backgroundColor: '#8A2BE2',
  },
  typeGardeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8A2BE2',
    marginLeft: 8,
  },
  typeGardeTextSelected: {
    color: 'white',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#8A2BE2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#C4B0ED',
    shadowOpacity: 0.1,
  },
  submitButtonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 15,
  },
  modalIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconText: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
