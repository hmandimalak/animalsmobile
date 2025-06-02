import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Sidebar from './SidebarScreen';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');

export default function EvenementMarcheList() {
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
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
    gradientStart: '#6A89A7',
    gradientEnd: '#88BDF2',
  };
  useEffect(() => {
    fetchEvenements();
  }, []);

  const fetchEvenements = async () => {
    try {
      setLoading(true);
      // Using regular fetch without authentication for public events
      const response = await fetch('http://192.168.0.188:8002/api/animals/evenements/marche-chiens/', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Échec du chargement des événements');
      
      const data = await response.json();
      setEvenements(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des événements. Veuillez réessayer.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEEE d MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const navigateToEventDetail = (eventId) => {
    navigation.navigate('MarcheDetail', { id: eventId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement des événements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <Sidebar/>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View style={styles.headerSection}>
         <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
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
          <Text style={styles.headerTitle}>Nos evenements de marche</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>
          {/* Animated icons would be replaced by static ones in React Native */}
          <View style={styles.iconsContainer}>
            <MaterialCommunityIcons name="dog" size={32} color={colors.primary} style={styles.iconSpacing} />
            <FontAwesome5 name="paw" size={28} color={colors.primary} style={styles.iconSpacing} />
            <MaterialCommunityIcons name="cat" size={32} color={colors.primary} />
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorInner}>
              <Ionicons name="alert-circle" size={24} color={colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        {/* Event list */}
        <View style={styles.eventListContainer}>
          {evenements.length === 0 ? (
            <View style={styles.emptyEventCard}>
              <View style={styles.emptyEventIconContainer}>
                <FontAwesome5 name="paw" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyEventTitle}>Aucun événement à venir</Text>
              <Text style={styles.emptyEventText}>
                Nos prochains événements de marche seront affichés ici. Revenez bientôt!
              </Text>
            </View>
          ) : (
            <View>
              {evenements.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => navigateToEventDetail(event.id)}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                >
                  <View style={styles.eventCardTopBar} />
                  <View style={styles.eventCardContent}>
                    <View style={styles.eventCardHeader}>
                      <Text style={styles.eventCardTitle}>{event.titre}</Text>
                      <View style={styles.dogCountBadge}>
                        <Text style={styles.dogCountText}>
                          {event.chiens?.length || 0} 🐕
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.eventCardDetails}>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="calendar" size={20} color={colors.accent} style={styles.eventDetailIcon} />
                        <Text style={styles.eventDetailText}>{formatDate(event.date)}</Text>
                      </View>
                      
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="time" size={20} color={colors.accent} style={styles.eventDetailIcon} />
                        <Text style={styles.eventDetailText}>{event.heure.substring(0, 5)}</Text>
                      </View>
                      
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location" size={20} color={colors.accent} style={styles.eventDetailIcon} />
                        <Text style={styles.eventDetailText}>{event.lieu}</Text>
                      </View>
                    </View>
                    
                    {event.description && (
                      <View style={styles.eventDescriptionContainer}>
                        <Text style={styles.eventDescriptionText} numberOfLines={3}>
                          "{event.description}"
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.eventCardFooter}>
                    <View style={styles.viewDetailsContainer}>
                      <Text style={styles.viewDetailsText}>Voir les détails</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Besoin d'aide pour trouver un événement?</Text>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Contactez-nous</Text>
          </TouchableOpacity>
          
          {/* Additional padding for bottom of ScrollView */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Colors palette
const colors ={
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  navbar: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  headerSection: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingBottom: 16,
    marginBottom: 24,
  },
 
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconSpacing: {
    marginRight: 12,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#B91C1C',
  },
  eventListContainer: {
    paddingHorizontal: 16,
  },
  emptyEventCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyEventIconContainer: {
    backgroundColor: colors.secondary,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  emptyEventText: {
    fontSize: 16,
    color: `${colors.dark}B3`, // 70% opacity
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  eventCardTopBar: {
    height: 8,
    backgroundColor: colors.primary,
  },
  eventCardContent: {
    padding: 20,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  dogCountBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dogCountText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  eventCardDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailIcon: {
    marginRight: 10,
  },
  eventDetailText: {
    fontSize: 15,
    color: `${colors.dark}B3`, // 70% opacity
  },
  eventDescriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingTop: 16,
    marginTop: 8,
  },
  eventDescriptionText: {
    fontSize: 15,
    color: `${colors.dark}99`, // 60% opacity
    fontStyle: 'italic',
  },
  eventCardFooter: {
    padding: 16,
    backgroundColor: colors.grayLight,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: colors.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: `${colors.dark}99`, // 60% opacity
  },
  footerButton: {
    marginTop: 4,
  },
  footerButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
      headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
});