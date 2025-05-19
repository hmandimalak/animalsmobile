import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import PhoneInput from 'react-native-phone-number-input';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const phoneInput = useRef(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    confirmPassword: '',
    profilepicture: null,
    role: 'Proprietaire', // Default role as required by your Django model
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Request permission and pick image function
  const pickImage = async () => {
    // Request permission for media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Get the selected asset
      const selectedAsset = result.assets[0];
      
      // Create a file object similar to what your backend expects
      const imageFile = {
        uri: selectedAsset.uri,
        type: 'image/jpeg', // Assuming JPEG. You might want to detect this from the URI
        name: 'profile-image.jpg', // This name will be used by your server
      };
      
      setFormData({ ...formData, profilepicture: imageFile });
    }
  };

  // For taking a new photo with camera
  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la caméra');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      
      const imageFile = {
        uri: selectedAsset.uri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      };
      
      setFormData({ ...formData, profilepicture: imageFile });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.telephone || formData.telephone.length < 8) newErrors.telephone = 'Numéro invalide';
    if (!formData.adresse.trim()) newErrors.adresse = 'Adresse requise';
    if (formData.password.length < 6) newErrors.password = 'Mot de passe trop court';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mots de passe différents';
    if (!formData.role) newErrors.role = 'Sélectionnez un rôle';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Set a default role if not provided
    if (!formData.role) {
      handleChange('role', 'Proprietaire');
    }

    const formDataToSend = new FormData();
    
    // Debug log to check what's being sent
    console.log("Form data before sending:", formData);
    
    Object.keys(formData).forEach(key => {
      if (key === 'profilepicture' && formData[key]) {
        // Make sure the image object has the correct format for the server
        formDataToSend.append(key, {
          uri: formData[key].uri,
          type: formData[key].type || 'image/jpeg',
          name: formData[key].name || 'profile.jpg',
        });
        console.log("Adding image:", formData[key].uri);
      } else {
        // Include ALL fields, including confirmPassword
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      console.log("Sending form data to server...");
      
      // Log the FormData content (for debugging)
      for (let [key, value] of formDataToSend._parts) {
        console.log(`${key}:`, value);
      }
      
      const response = await fetch('http://192.168.0.132:8000/api/auth/register/', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      console.log("Response status:", response.status);
      
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        Alert.alert('Erreur', 'Erreur lors du traitement de la réponse');
        return;
      }
      
      if (response.ok) {
        Alert.alert('Succès', 'Inscription réussie!');
        navigation.navigate('Login');
      } else {
        console.error("Server returned errors:", data);
        setErrors(data);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion au serveur');
    }
  };

  return (
    <LinearGradient colors={['#87CEEB', '#FFFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Rejoignez Notre Communauté</Text>

          {/* Profile Image Upload */}
          <View style={styles.imageUploadContainer}>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {formData.profilepicture ? (
                <Image source={{ uri: formData.profilepicture.uri }} style={styles.profileImage} />
              ) : (
                <>
                  <Icon name="image" size={30} color="#2A9D8F" />
                  <Text style={styles.uploadText}>Galerie</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageUpload} onPress={takePhoto}>
              <Icon name="camera" size={30} color="#2A9D8F" />
              <Text style={styles.uploadText}>Prendre photo</Text>
            </TouchableOpacity>
          </View>

          {/* Name Inputs */}
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfInput, errors.nom && styles.errorInput]}>
              <Icon name="user" size={20} color="#2A9D8F" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={formData.nom}
                onChangeText={(text) => handleChange('nom', text)}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput, errors.prenom && styles.errorInput]}>
              <Icon name="user" size={20} color="#2A9D8F" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={formData.prenom}
                onChangeText={(text) => handleChange('prenom', text)}
              />
            </View>
          </View>
          {errors.nom && <Text style={styles.errorText}>{errors.nom}</Text>}
          {errors.prenom && <Text style={styles.errorText}>{errors.prenom}</Text>}

          {/* Email Input */}
          <View style={[styles.inputContainer, errors.email && styles.errorInput]}>
            <Icon name="envelope" size={20} color="#2A9D8F" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Phone Input */}
          <View style={[styles.phoneContainer, errors.telephone && styles.errorInput]}>
            <PhoneInput
              ref={phoneInput}
              defaultValue={formData.telephone}
              defaultCode="TN"
              layout="first"
              onChangeFormattedText={(text) => handleChange('telephone', text)}
              containerStyle={styles.phoneInputContainer}
              textContainerStyle={styles.phoneTextContainer}
              flagButtonStyle={styles.flagButton}
              textInputStyle={styles.phoneTextInput}
              codeTextStyle={styles.codeText}
            />
          </View>
          {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}

          {/* Address Input */}
          <View style={[styles.inputContainer, errors.adresse && styles.errorInput]}>
            <Icon name="home" size={20} color="#2A9D8F" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse"
              value={formData.adresse}
              onChangeText={(text) => handleChange('adresse', text)}
            />
          </View>
          {errors.adresse && <Text style={styles.errorText}>{errors.adresse}</Text>}
          
          {/* Password Inputs */}
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfInput, errors.password && styles.errorInput]}>
              <Icon name="lock" size={20} color="#2A9D8F" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#2A9D8F" />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, styles.halfInput, errors.confirmPassword && styles.errorInput]}>
              <Icon name="lock" size={20} color="#2A9D8F" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmation"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
              />
            </View>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Créer mon compte</Text>
            <Icon name="paw" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Déjà membre? <Text style={styles.loginLinkText}>Connectez-vous ici</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    minHeight: '100%',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#264653',
    textAlign: 'center',
    marginBottom: 25,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageUpload: {
    height: 120,
    width: '48%',
    borderWidth: 2,
    borderColor: '#2A9D8F',
    borderStyle: 'dashed',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  uploadText: {
    color: '#2A9D8F',
    marginTop: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9C46A',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#FFF',
  },
  halfInput: {
    width: '48%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#264653',
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
  },
  phoneContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  phoneInputContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9C46A',
    borderRadius: 10,
  },
  phoneTextContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 0,
    borderRadius: 10,
  },
  errorInput: {
    borderColor: '#E76F51',
  },
  errorText: {
    color: '#E76F51',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A9D8F',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  loginLink: {
    marginTop: 20,
  },
  loginText: {
    textAlign: 'center',
    color: '#264653',
  },
  loginLinkText: {
    color: '#E76F51',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  roleButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedRole: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  roleButtonText: {
    color: '#264653',
    fontSize: 14,
  },
  selectedRoleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;