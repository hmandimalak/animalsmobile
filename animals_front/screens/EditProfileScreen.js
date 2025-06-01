// screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // For profile picture upload

const colors = {
  primary: '#e899a3',
  white: '#FFFFFF',
  dark: '#333333',
  gray: '#777',
  lightGray: '#eee'
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

      const response = await fetch('http://192.168.0.132:8000/api/auth/profile/', {
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

      const apiResponse = await fetch('http://192.168.0.132:8000/api/auth/profile/update/', {
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.dark }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          <Image
            source={preview ? { uri: preview } :  require('../assets/dogandcat.jpeg')}
            style={styles.profileImage}
          />
          <View style={styles.editIcon}>
            <Text style={{ color: '#fff' }}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            value={user.prenom}
            onChangeText={(text) => handleChange('prenom', text)}
            placeholder="Enter first name"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            value={user.nom}
            onChangeText={(text) => handleChange('nom', text)}
            placeholder="Enter last name"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={user.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={user.telephone}
            onChangeText={(text) => handleChange('telephone', text)}
            placeholder="+216 12 345 678"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            value={user.adresse}
            onChangeText={(text) => handleChange('adresse', text)}
            placeholder="Enter address"
            style={styles.input}
          />
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={() => setShowPasswordFields(!showPasswordFields)}
          style={styles.passwordButton}
        >
          <Text style={styles.passwordButtonText}>Changer le mot de passe</Text>
          <Text style={styles.lockIcon}>🔒</Text>
        </TouchableOpacity>

        {/* Password Fields - Conditional Rendering */}
        {showPasswordFields && (
          <View style={styles.passwordFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                value={passwords.currentPassword}
                onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                secureTextEntry
                placeholder="Current password"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={passwords.newPassword}
                onChangeText={(text) => handlePasswordChange('newPassword', text)}
                secureTextEntry
                placeholder="New password"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={passwords.confirmPassword}
                onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                secureTextEntry
                placeholder="Confirm new password"
                style={styles.input}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        >
          {loading ? (
            <Text style={styles.submitButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Messages */}
        {error && <Text style={styles.errorMessage}>{error}</Text>}
        {success && <Text style={styles.successMessage}>{success}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10
  },
  section: {
    alignItems: 'center',
    marginBottom: 24
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover'
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  changePhotoText: {
    marginTop: 8,
    color: colors.gray
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  passwordButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2463B0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 16
  },
  passwordButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  lockIcon: {
    marginLeft: 8,
    fontSize: 18,
    color: '#fff'
  },
  passwordFields: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginTop: 12
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginTop: 12
  }
});