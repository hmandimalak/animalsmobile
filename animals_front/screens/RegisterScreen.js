import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import PhoneInput from 'react-native-phone-number-input';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// …



export default function RegisterScreen  () {
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
   const colors = {
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
      
      const response = await fetch('http://192.168.0.188:8002/api/auth/register/', {
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
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      <View style={styles.decorativeCircle5} />
      <View style={styles.decorativeCircle6} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Bienvenu a</Text>
          <Text style={styles.appName}>Adopti</Text>
          
          {/* Cute pet image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/animals.jpg')}
              style={styles.petImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Registration Card */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Creer un compte</Text>
          <Text style={styles.subtitle}>rejoigner notre famille🐾</Text>

     
          {/* Name Inputs */}
           <Text style={styles.inputLabel}>Nom complet</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfInput, errors.nom && styles.errorInput]}>
              
              <Text style={styles.inputEmoji}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder=" Nom"
                placeholderTextColor="#384959"
                value={formData.nom}
                onChangeText={(text) => handleChange('nom', text)}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfInput, errors.prenom && styles.errorInput]}>
               
              <Text style={styles.inputEmoji}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Prenom"
                placeholderTextColor="#384959"
                value={formData.prenom}
                onChangeText={(text) => handleChange('prenom', text)}
              />
            </View>
          </View>
          {errors.nom && <Text style={styles.errorText}>❌ {errors.nom}</Text>}
          {errors.prenom && <Text style={styles.errorText}>❌ {errors.prenom}</Text>}

          {/* Email Input */}
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputContainer, errors.email && styles.errorInput]}>
            <Text style={styles.inputEmoji}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="salut@gmail.com"
              placeholderTextColor="#384959"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>❌ {errors.email}</Text>}

          {/* Phone Input */}
           <Text style={styles.inputLabel}>Téléphone</Text>
          <View style={[styles.phoneContainer, errors.telephone && styles.errorInput]}>
            
            <Text style={styles.phoneEmoji}>📱</Text>
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
          {errors.telephone && <Text style={styles.errorText}>❌ {errors.telephone}</Text>}

          {/* Address Input */}
          <Text style={styles.inputLabel}>Addresse</Text>
          <View style={[styles.inputContainer, errors.adresse && styles.errorInput]}>
             
            <Text style={styles.inputEmoji}>🏠</Text>
            <TextInput
              style={styles.input}
              placeholder="Addresse"
              placeholderTextColor="#384959"
              value={formData.adresse}
              onChangeText={(text) => handleChange('adresse', text)}
            />
          </View>
          {errors.adresse && <Text style={styles.errorText}>❌ {errors.adresse}</Text>}
          
          {/* Password Inputs */}
          <Text style={styles.inputLabel}>Mot de passe</Text>
             
            <View style={[styles.inputContainer, errors.password && styles.errorInput]}>
              <Text style={styles.inputEmoji}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#384959"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleEmoji}>
                  {showPassword ? '👁️' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.inputContainer, errors.confirmPassword && styles.errorInput]}>
              
              <Text style={styles.inputEmoji}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirmé Mot de passe"
                placeholderTextColor="#384959"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
              />
            </View>
          {errors.password && <Text style={styles.errorText}>❌ {errors.password}</Text>}
          {errors.confirmPassword && <Text style={styles.errorText}>❌ {errors.confirmPassword}</Text>}
               {/* Profile Image Upload */}
          <View style={styles.imageUploadContainer}>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {formData.profilepicture ? (
                <Image source={{ uri: formData.profilepicture.uri }} style={styles.profileImage} />
              ) : (
                <>
                   <MaterialIcons 
  name="photo-library" 
  size={32}            // adjust size as needed
  color={colors.primary} 
/>
                 
                  <Text style={styles.uploadText}>Gallerie</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageUpload} onPress={takePhoto}>
               <Text style={styles.uploadEmoji}>📷</Text>
          

              <Text style={styles.uploadText}>Camera</Text>
            </TouchableOpacity>
          </View>


          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Creer un compte</Text>
              <View style={styles.pawIcon}>
                <Text style={styles.pawEmoji}>🐾</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BDDDFC',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6A89A7',
    opacity: 0.7,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6A89A7',
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 120,
    left: 60,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#6A89A7',
    opacity: 0.4,
  },
  decorativeCircle4: {
    position: 'absolute',
    top: 40,
    right: 80,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6A89A7',
    opacity: 0.6,
  },
  decorativeCircle5: {
    position: 'absolute',
    top: 200,
    left: 30,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6A89A7',
    opacity: 0.3,
  },
  decorativeCircle6: {
    position: 'absolute',
    top: 160,
    right: 50,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#6A89A7',
    opacity: 0.4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 20,
    color: '#6A89A7',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '400',
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6A89A7',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(255, 140, 66, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A89A7',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A89A7',
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.9,
  },
imageUploadContainer: {
  flexDirection: 'row',
  justifyContent: 'space-evenly', // Horizontal centering
  alignItems: 'center',     // Vertical centering (optional)
  marginBottom: 20,
  marginRight:'20px'
},
  imageUpload: {
    height: 70,
    width: '48%',
    borderWidth: 2,
    borderColor: '#6A89A7',
    borderStyle: 'dashed',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BDDDFC',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  uploadEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  uploadText: {
    color: '#6A89A7',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BDDDFC',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 5,
  },
  halfInput: {
    width: '48%',
  },
  inputEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#384959',
    fontWeight: '500',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BDDDFC',
    borderRadius: 15,
    paddingLeft: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 5,
  },
  phoneEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  phoneTextInput: {
    color: '#384959',
    fontWeight: '500',
    fontSize: 16,
  },
  codeText: {
    color: '#384959',
    fontWeight: '500',
  },
  flagButton: {
    backgroundColor: 'transparent',
  },
  toggleEmoji: {
    fontSize: 18,
    padding: 5,
  },
  errorInput: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
   inputLabel: {
    fontSize: 16,
    color: '#6A89A7',
    marginBottom: 8,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6A89A7',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  pawIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 5,
    minWidth: 30,
    alignItems: 'center',
  },
  pawEmoji: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#6A89A7',
    fontSize: 14,
    opacity: 0.9,
  },
  footerLink: {
    color: '#6A89A7',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});