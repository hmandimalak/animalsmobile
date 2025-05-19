import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    const API_URL = 'http://192.168.0.132:8000/api/auth/login/';
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

    Alert.alert(
      "Connexion réussie",
      "Vous êtes maintenant connecté.",
      [{ text: "OK", onPress: () => navigation.navigate('Home') }]
    );
  } catch (err) {
    console.error('[ERROR]', err.message);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <FontAwesome name="key" size={40} color="#fff" />
      </View>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Accédez à votre espace Pawfect Home</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="envelope" size={20} color="#333" style={styles.icon} />
        <TextInput
          placeholder="Adresse email"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="#333" style={styles.icon} />
        <TextInput
          placeholder="Mot de passe"
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          style={styles.input}
          secureTextEntry
        />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
        <Text style={styles.forgot}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.googleButton} 
        onPress={() => Alert.alert("OAuth", "Connexion Google non implémentée")}
      >
        <FontAwesome name="google" size={20} color="#DB4437" />
        <Text style={styles.googleText}>Continuer avec Google</Text>
      </TouchableOpacity>

      <Text style={styles.registerText}>
        Pas encore membre ?{' '}
        <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          Créez un compte
        </Text>
      </Text>

      <Image
        source={require('../assets/animals.jpg')}
        style={styles.image}
        resizeMode="cover"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fefefe',
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: '#6C63FF',
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    width: '100%',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: 6,
    color: '#6C63FF',
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  googleButton: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  googleText: {
    color: '#333',
    fontWeight: 'bold',
  },
  registerText: {
    marginTop: 20,
    color: '#444',
  },
  registerLink: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 30,
    borderRadius: 12,
  },
});