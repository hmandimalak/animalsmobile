import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const API_URL = 'http://192.168.0.188:8002/api/auth/login/';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('[DEBUG] Login response:', data);

      if (!response.ok) throw new Error(data.detail || 'Échec de la connexion');

      const accessToken = data.access;
      const refreshToken = data.refresh;
      const userId = data.user_id ?? data.user?.id;

      if (!accessToken || !refreshToken || userId == null) {
        throw new Error('Données de connexion incomplètes');
      }

      await AsyncStorage.multiSet([
        ['access_token', accessToken],
        ['refresh_token', refreshToken],
        ['user_id', userId.toString()],
      ]);

      console.log('[DEBUG] Tokens and user ID stored');
    navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      console.error('[ERROR]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
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

        {/* Login Card */}
        <View style={styles.loginCard}>
          <Text style={styles.signInTitle}>Se connecter</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Salut@gmail.com"
                placeholderTextColor="#384959"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#384959"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                style={styles.input}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.toggleText}>
                  {showPassword ? '👁️' : '🔒'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>❌ {error}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Suivant</Text>
                <View style={styles.pawIcon}>
                  <Text style={styles.pawEmoji}>🐾</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
            Vous avez déjà un compte ?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
  scrollContent: {
    flexGrow: 1,
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A89A7',
    textAlign: 'left',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#6A89A7',
    marginBottom: 8,
    fontWeight: '600',
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#384959',
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 5,
  },
  toggleText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#6A89A7',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
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
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6A89A7',
  },
  error: {
    color: '#6A89A7',
    textAlign: 'center',
    fontWeight: '600',
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