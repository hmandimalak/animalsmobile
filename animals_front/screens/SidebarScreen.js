import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Updated theme colors to match web application
const COLORS = {
  primary: '#6A89A7',    // Soft blue (main color)
  secondary: '#BDDDFC',   // Light sky blue
  accent: '#88BDF2',      // Sky blue
  dark: '#384959',        // Dark blue-gray
  white: '#FFFFFF',
  gray: '#F0F0F0',
  darkGray: '#718096',    // Lighter blue-gray
  lightGray: '#e6e6e6',
  danger: '#ff6b6b',
};

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar({ isVisible, onClose }) {
  const navigation = useNavigation();
  // Animation value for sliding effect
  const slideAnim = React.useRef(new Animated.Value(isVisible ? 0 : -SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const navigateTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

 if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Dark overlay */}
      <TouchableOpacity 
        activeOpacity={1}
        onPress={onClose}
        style={styles.overlay}
      />
      
      {/* Sidebar container */}
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Header section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.white} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Adopti</Text>
              <Text style={styles.subtitleText}>Adoption d'animaux</Text>
            </View>
          </View>
        </View>
        
        {/* Navigation items */}
        <View style={styles.menu}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.activeItem]}
            onPress={() => navigateTo('Home')}
          >
            <Ionicons name="home-outline" size={24} color={COLORS.dark} />
            <Text style={[styles.menuItemText, styles.activeItemText]}>Accueil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Profile')}
          >
            <Ionicons name="person-outline" size={24} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Mon Profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Nosanimaux')}
          >
            <MaterialCommunityIcons name="dog" size={24} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Nos Animaux</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Garde')}
          >
            <FontAwesome5 name="calendar-alt" size={22} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Service de garde</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Boutique')}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Boutique</Text>
          </TouchableOpacity>
           <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Marche')}
          >
             <FontAwesome5 name="dog"  size={24} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Événement des marches des chiens</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('Blog')}
          >
            <Ionicons name="newspaper-outline"  size={24} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Blog</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer with contact/help */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerItem}
            onPress={() => navigateTo('FAQ')}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.dark} />
            <Text style={styles.footerItemText}>FAQ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerItem, styles.logoutItem]}
            onPress={() => navigateTo('Logout')}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    backgroundColor: COLORS.primary, // Blue header
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent, // Light blue accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginLeft: 16,
  },
  titleText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  menu: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeItem: {
    borderLeftColor: COLORS.accent, // Light blue accent
    backgroundColor: COLORS.secondary, // Very light blue
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark, // Dark blue-gray text
  },
  activeItemText: {
    color: COLORS.primary, // Soft blue
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerItemText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark, // Dark blue-gray text
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.danger,
  },
});