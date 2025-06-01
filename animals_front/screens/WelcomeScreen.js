import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="paw" size={80} color="#FF8C42" />
        </View>
        
        {/* App Name */}
        <Text style={styles.appName}>Adopti</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Votre compagnon pour l'adoption d'animaux</Text>
        
        {/* Hero Image */}
        <Image
          source={require('../assets/animals.jpg')} // Update with your actual image path
          style={styles.heroImage}
          resizeMode="contain"
        />
        
        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Login')}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Commencer</Text>
            <View style={styles.pawIcon}>
              <Text style={styles.pawEmoji}>🐾</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà membre?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    position: 'relative',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF8C42',
    opacity: 0.7,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF8C42',
    opacity: 0.5,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FF8C42',
    opacity: 0.4,
  },
  decorativeCircle4: {
    position: 'absolute',
    bottom: height * 0.3,
    right: width * 0.15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8C42',
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    backgroundColor: 'white',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF8C42',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 140, 66, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  heroImage: {
    width: width * 0.9,
    height: height * 0.3,
    marginBottom: 40,
    borderRadius: 20,
  },
  button: {
    backgroundColor: '#FF8C42',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginRight: 10,
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
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#8B4513',
    fontSize: 16,
    opacity: 0.9,
  },
  footerLink: {
    color: '#FF8C42',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
});