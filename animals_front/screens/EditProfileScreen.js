// screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'react-native-feather';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Updated to match profile screen's blue palette
const colors = {
  primary: '#6A89A7',     // Main brand color
  secondary: '#BDDDFC',   // Light background/container
  accent: '#88BDF2',      // Interactive elements
  dark: '#384959',        // Dark text/headers
  white: '#FFFFFF',
  gray: '#718096',        // Lighter gray for secondary text
  lightGray: '#E2E8F0',   // Very light gray for borders
};

export default function EditProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    profilepicture: null,
  });

  const [preview, setPreview] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load user data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch('http://192.168.0.188:8002/api/auth/profile/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();

      setUser({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        profilepicture: null
      });

      setPreview(data.profilepicture || null);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleChange = (name, value) => {
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (name, value) => {
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setUser((prev) => ({
        ...prev,
        profilepicture: selectedAsset
      }));
      setPreview(selectedAsset.uri);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('Authentication token not found');

      const formData = new FormData();

      formData.append('nom', user.nom);
      formData.append('prenom', user.prenom);
      formData.append('email', user.email);
      formData.append('telephone', user.telephone);
      formData.append('adresse', user.adresse);

      // Append image only if changed
      if (user.profilepicture && user.profilepicture.uri) {
        const uri = user.profilepicture.uri;
        const name = uri.split('/').pop();
        const type = `${uri.split('.').pop()}/*`;

        formData.append('profilepicture', {
          uri,
          name,
          type
        });
      }

      // Add password fields if toggled
      if (showPasswordFields) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          throw new Error("Les nouveaux mots de passe ne correspondent pas.");
        }

        formData.append('current_password', passwords.currentPassword);
        formData.append('new_password', passwords.newPassword);
      }

      const apiResponse = await fetch('http://192.168.0.188:8002/api/auth/profile/update/', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type header manually for FormData
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await apiResponse.json();
      setSuccess("Profile updated successfully!");

      setTimeout(() => {
        navigation.goBack(); // Go back to profile
      }, 1500);

    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Blue Header with Back Button and Title */}
      <View style={styles.profileHeaderContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Modifier le Profil</Text>
          
          {/* Empty View to balance the header */}
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Profile Picture */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {preview ? (
              <Image source={{ uri: preview }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Icons.User width={60} height={60} color={colors.white} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={18} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Appuyez pour changer la photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              value={user.prenom}
              onChangeText={(text) => handleChange('prenom', text)}
              placeholder="Entrez votre prénom"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              value={user.nom}
              onChangeText={(text) => handleChange('nom', text)}
              placeholder="Entrez votre nom"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={user.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="Entrez votre email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              value={user.telephone}
              onChangeText={(text) => handleChange('telephone', text)}
              placeholder="+216 12 345 678"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              value={user.adresse}
              onChangeText={(text) => handleChange('adresse', text)}
              placeholder="Entrez votre adresse"
              style={styles.input}
            />
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            onPress={() => setShowPasswordFields(!showPasswordFields)}
            style={styles.passwordButton}
          >
            <Text style={styles.passwordButtonText}>Changer le mot de passe</Text>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
          </TouchableOpacity>

          {/* Password Fields - Conditional Rendering */}
          {showPasswordFields && (
            <View style={styles.passwordFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe actuel</Text>
                <TextInput
                  value={passwords.currentPassword}
                  onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                  secureTextEntry
                  placeholder="Entrez votre mot de passe actuel"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <TextInput
                  value={passwords.newPassword}
                  onChangeText={(text) => handlePasswordChange('newPassword', text)}
                  secureTextEntry
                  placeholder="Entrez votre nouveau mot de passe"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  value={passwords.confirmPassword}
                  onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                  secureTextEntry
                  placeholder="Confirmez votre nouveau mot de passe"
                  style={styles.input}
                />
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.disabledButton]}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Enregistrement...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>

          {/* Messages */}
          {error && <Text style={styles.errorMessage}>{error}</Text>}
          {success && <Text style={styles.successMessage}>{success}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeaderContainer: {
    backgroundColor: colors.primary,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height:  3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  backButton: {
    padding: 4,
  },
  section: {
    alignItems: 'center',
    marginVertical: 24,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.dark,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  changePhotoText: {
    marginTop: 8,
    color: colors.gray,
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: colors.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  passwordButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 16,
  },
  passwordButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  passwordFields: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: colors.gray,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorMessage: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  successMessage: {
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});