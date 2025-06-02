import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.0.188:8002';

// Import your API service
import api from '../android/app/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';




// Helper function to build image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it’s already a full URL, just return it
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  // Otherwise, make sure it includes /media/, then prefix your Django host
  // imagePath might already include "/media", so we guard against duplicating it
  const cleanPath = imagePath.startsWith("/media/")
    ? imagePath
    : `/media${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  return `${API_BASE}${cleanPath}`;
};

const colors = {
  primary: '#6A89A7',     // Main brand color
  secondary: '#BDDDFC',   // Light background/container
  accent: '#88BDF2',      // Interactive elements
  dark: '#384959',        // Dark text/headers
  white: '#FFFFFF',
  gray: '#718096',        // Lighter gray for secondary text
  lightGray: '#E2E8F0',   // Very light gray for borders
  text: '#4a4a4a',
  cardBackground: '#FFFFFF',
};

export default function CommandesScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const data = await api.fetchOrders();
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
     <LinearGradient
        colors={['#6A89A7', '#6A89A7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
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
          <Text style={styles.headerTitle}>Mes commandes</Text>
          <View style={{width: 24}} />
        </View>
      
      </LinearGradient>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune commande trouvée</Text>
          <TouchableOpacity
            onPress={() => alert("Boutique page coming soon")}
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>Visiter la boutique</Text>
          </TouchableOpacity>
        </View>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>Commande #{order.numero_commande}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.date_commande).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                order.statut === 'livrée' && { backgroundColor: '#e8f5e9', color: colors.green },
                order.statut === 'annulée' && { backgroundColor: '#ffebee', color: colors.red },
                order.statut !== 'livrée' && order.statut !== 'annulée' && { backgroundColor: '#e3f2fd', color: colors.blue }
              ]}>
                <Text style={[
                  styles.statusText,
                  order.statut === 'livrée' && { color: colors.green },
                  order.statut === 'annulée' && { color: colors.red },
                  order.statut !== 'livrée' && order.statut !== 'annulée' && { color: colors.blue }
                ]}>
                  {order.statut}
                </Text>
              </View>
            </View>

            <View style={styles.itemsContainer}>
              {order.items?.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <Image
                    source={{ uri: getImageUrl(item.image) }}
                    style={styles.itemImage}
                    defaultSource={require('../assets/dogandcat.jpeg')}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.nom}</Text>
                   <Text style={styles.itemInfo}>
  {item.quantite} x {parseFloat(item.prix || 0).toFixed(2)} DT
</Text>
                  </View>
                  <Text style={styles.itemPrice}>
  {parseFloat(item.prix || 0).toFixed(2)} DT
</Text>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.footerLabel}>Paiement: {order.methode_paiement}</Text>
                <Text style={styles.footerLabel}>Adresse: {order.adresse_livraison}</Text>
              </View>
              <Text style={styles.totalPrice}>
                Total: {order.total_prix} DT
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${colors.primary}50`,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
  },
  shopButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderDate: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: `${colors.mediumGray}30`,
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
   backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 8,
  },

  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemInfo: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${colors.mediumGray}30`,
  },
  footerLabel: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
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
   title: {
     fontSize: 30,
     fontWeight: '800',
     color: '#8E54E9',
     marginBottom: 4,
     fontFamily: 'System',
   marginLeft: 12,   // push it right of back-button
   },
   subtitle: {
    fontSize: 16,
    color: '#BFA2DB',
    fontSize: 16,
    color: '#BFA2DB',
    marginHorizontal: 24,
   marginBottom: 12,
   },

});