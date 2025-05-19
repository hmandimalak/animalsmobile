import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    confirmPassword: '',
    profilepicture: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: "Permission d'accès aux photos",
            message: "L'application a besoin d'accéder à vos photos pour télécharger une image de profil.",
            buttonNeutral: "Demander plus tard",
            buttonNegative: "Annuler",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const selectImage = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert("Permission refusée", "Veuillez autoriser l'accès aux photos dans les paramètres de votre appareil.");
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.7,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      } 
      
      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert("Erreur", response.errorMessage || "Erreur lors du chargement de l'image");
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        console.log('Image selected:', source);
        setFormData(prev => ({ ...prev, profilepicture: source.uri }));
      } else {
        Alert.alert("Erreur", "Impossible de récupérer l'image sélectionnée");
      }
    });
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert("Permission refusée", "Veuillez autoriser l'accès à la caméra dans les paramètres de votre appareil.");
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.7,
      saveToPhotos: true,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      } 
      
      if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert("Erreur", response.errorMessage || "Erreur lors de la prise de photo");
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        console.log('Photo taken:', source);
        setFormData(prev => ({ ...prev, profilepicture: source.uri }));
      } else {
        Alert.alert("Erreur", "Impossible de récupérer la photo prise");
      }
    });
  };
  
  const showImageOptions = () => {
    Alert.alert(
      "Photo de profil",
      "Choisissez une option",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Prendre une photo", onPress: takePhoto },
        { text: "Choisir dans la galerie", onPress: selectImage },
      ]
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = 'Nom requis';
    if (!formData.prenom) newErrors.prenom = 'Prénom requis';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.telephone || formData.telephone.length < 8) {
      newErrors.telephone = 'Numéro invalide';
    }
    if (!formData.adresse) newErrors.adresse = "Adresse requise";
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Mot de passe trop court";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);

    // Prepare form data for submission
    const dataToSend = new FormData();
    
    // Add all text fields
    Object.keys(formData).forEach(key => {
      if (key !== 'profilepicture' && key !== 'confirmPassword') {
        dataToSend.append(key, formData[key]);
      }
    });
    
    // Add image if available
    if (formData.profilepicture) {
      // Extract filename from the URI
      const uriParts = formData.profilepicture.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      dataToSend.append('profilepicture', {
        uri: formData.profilepicture,
        name: fileName || 'profile.jpg',
        type: 'image/jpeg',
      });
    }

    console.log('Sending form data:', JSON.stringify(dataToSend));

    try {
      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        body: dataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();
      
      if (response.ok) {
        Alert.alert(
          "Succès", 
          "Inscription réussie !",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        const errorMessage = responseData.message || 
                            (typeof responseData === 'object' ? JSON.stringify(responseData) : 'Erreur lors de l\'inscription');
        Alert.alert("Erreur", errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert("Erreur de connexion", "Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      {/* Image Picker */}
      <TouchableOpacity onPress={showImageOptions} style={styles.imagePicker}>
        {formData.profilepicture ? (
          <Image source={{ uri: formData.profilepicture }} style={styles.image} />
        ) : (
          <View style={styles.imagePickerContent}>
            <Text style={styles.imageText}>Ajouter une photo</Text>
            <Text style={styles.imageSubText}>Appuyez ici</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Input Fields */}
      <TextInput
        placeholder="Nom"
        style={[styles.input, errors.nom && styles.inputError]}
        value={formData.nom}
        onChangeText={(text) => handleInputChange('nom', text)}
      />
      {errors.nom && <Text style={styles.error}>{errors.nom}</Text>}

      <TextInput
        placeholder="Prénom"
        style={[styles.input, errors.prenom && styles.inputError]}
        value={formData.prenom}
        onChangeText={(text) => handleInputChange('prenom', text)}
      />
      {errors.prenom && <Text style={styles.error}>{errors.prenom}</Text>}

      <TextInput
        placeholder="Email"
        style={[styles.input, errors.email && styles.inputError]}
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        placeholder="Téléphone"
        style={[styles.input, errors.telephone && styles.inputError]}
        keyboardType="phone-pad"
        value={formData.telephone}
        onChangeText={(text) => handleInputChange('telephone', text)}
      />
      {errors.telephone && <Text style={styles.error}>{errors.telephone}</Text>}

      <TextInput
        placeholder="Adresse"
        style={[styles.input, errors.adresse && styles.inputError]}
        value={formData.adresse}
        onChangeText={(text) => handleInputChange('adresse', text)}
      />
      {errors.adresse && <Text style={styles.error}>{errors.adresse}</Text>}

      <TextInput
        placeholder="Mot de passe"
        style={[styles.input, errors.password && styles.inputError]}
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <TextInput
        placeholder="Confirmer le mot de passe"
        style={[styles.input, errors.confirmPassword && styles.inputError]}
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
      />
      {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

      <TouchableOpacity 
        onPress={handleSubmit} 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Login')} 
        style={styles.linkContainer}
      >
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fefefe',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  imagePicker: {
    backgroundColor: '#eee',
    height: 120,
    width: 120,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  imagePickerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  imageSubText: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  image: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2c89d9',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#94bce9',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  link: {
    color: '#2c89d9',
    textDecorationLine: 'underline',
  },
});