import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert ,
    StyleSheet, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { LinearGradient } from 'expo-linear-gradient';
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


const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token ? `Bearer ${token}` : null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const PanierScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const API_BASE_URL = 'http://192.168.0.132:8000';

  // Fetch cart items
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        const savedCart = await AsyncStorage.getItem('cart');
        if (savedCart) setCartItems(JSON.parse(savedCart));
        setLoading(false);
        return;
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/`, {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      // Format cart items with correct pricing
      const formattedCart = data.map(item => ({
        id: item.id || item.produit_id,
        nom: item.nom,
        prix: parseFloat(item.prix),  // Already includes discount from backend
        image: item.image,
        quantity: item.quantity
      }));

      setCartItems(formattedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(formattedCart));

    } catch (error) {
      console.error('Error fetching cart:', error);
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
      Alert.alert('Erreur', 'Impossible de charger le panier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    if (!loading) saveCart();
  }, [cartItems, loading]);

  // Remove item from cart
  const handleRemoveItem = async (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
    try {
      const token = await getAuthToken();
      if (token) {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/api/boutique/panier/supprimer/${productId}/`,
          { method: 'DELETE', headers: { 'Authorization': token } }
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de supprimer cet article.');
    }
  };

  // Update quantity
  const handleQuantityChange = async (productId, change) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    });
    setCartItems(updatedCart);

    try {
      const token = await getAuthToken();
      if (token) {
        const updatedItem = updatedCart.find(item => item.id === productId);
        const response = await authenticatedFetch(
          `${API_BASE_URL}/api/boutique/panier/modifier/`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ produit_id: productId, quantity: updatedItem.quantity }),
          }
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de modifier la quantité.');
    }
  };

  // Calculate total
  const getTotalPrice = () =>
    cartItems.reduce((total, item) => total + (item.prix * item.quantity), 0).toFixed(2);

  const getTotalItems = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-100 justify-center items-center`}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={tw`mt-4 text-gray-600`}>Chargement...</Text>
      </View>
    );
  }
 

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
       <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 0 }}
           style={styles.header}
         >
           <View style={styles.headerContent}>
             <TouchableOpacity
               onPress={() => navigation.navigate('Boutique')} 
               hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
               style={styles.backButton}
             >
               <Ionicons name="arrow-back" size={24} color="white" />
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Notre panier</Text>
             <View style={{ width: 24 }} />
           </View>
         </LinearGradient>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <View style={tw`bg-blue-100 p-4 rounded-full mb-6`}>
            <Ionicons name="cart-outline" size={64} color="#8B5CF6" />
          </View>
          <Text style={tw`text-xl text-gray-600 mb-6`}>Votre panier est vide</Text>
          <TouchableOpacity 
            style={tw`bg-purple-600 px-8 py-3.5 rounded-xl`}
            onPress={() => navigation.navigate('Boutique')}
          >
            <Text style={tw`text-white font-bold text-lg`}>Découvrir nos produits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-32`}>
            {cartItems.map(item => {
              let imageSource;
              if (!item.image) {
                imageSource = require('../assets/dogandcat.jpeg');
              } else if (typeof item.image === 'string') {
                imageSource = { uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}` };
              } else {
                imageSource = item.image;
              }

              return (
                <View key={item.id.toString()} style={tw`bg-white mb-4 rounded-xl shadow p-4 border border-purple-100`}>
                  <View style={tw`flex-row`}>
                    <Image 
                      source={imageSource}
                      style={tw`w-24 h-24 rounded-lg`}
                      defaultSource={require('../assets/dogandcat.jpeg')}
                    />
                    <View style={tw`ml-4 flex-1 justify-between`}>
                      <View>
                        <Text style={tw`text-lg font-bold`}>{item.nom}</Text>
                        <Text style={tw`text-dark-600 font-bold`}>{item.prix.toFixed(2)} DT</Text>
                      </View>
                      <View style={tw`flex-row justify-between items-center mt-2`}>
                        <View style={tw`flex-row items-center border-2 border-dark-100 rounded-xl`}>
                          <TouchableOpacity
                            onPress={() => {
                              if (item.quantity > 1) {
                                handleQuantityChange(item.id, -1);
                              }
                            }}
                          >
                            <Ionicons 
                              name="remove" 
                              size={20} 
                              color={item.quantity <= 1 ? "#D1D5DB" : "dark"} 
                            />
                          </TouchableOpacity>
                          <Text style={tw`px-3 font-medium`}>{item.quantity}</Text>
                          <TouchableOpacity
                            onPress={() => handleQuantityChange(item.id, 1)}
                          >
                            <Ionicons name="add" size={20} color="dark" />
                          </TouchableOpacity>
                        </View>
                        <Text style={tw`font-bold text-dark-600 mr-2`}>
                          {(item.prix * item.quantity).toFixed(2)} DT
                        </Text>
                        <TouchableOpacity 
                          onPress={() => handleRemoveItem(item.id)}
                          style={tw`p-2`}
                        >
                          <Ionicons name="trash-outline" size={22} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Summary & Checkout Button */}
          <View style={tw`absolute bottom-0 left-0 right-0 bg-white px-4 py-6 border-t border-gray-200 shadow-lg`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <View>
                <Text style={tw`text-gray-600`}>Total ({getTotalItems()} articles)</Text>
                <Text style={tw` text-gray-600`}> Frais de livraison calculés à la prochaine étape</Text>
              </View>
             
              <Text style={tw`text-dark-600 text-2xl font-bold text-sm`}>{getTotalPrice()} DT</Text>
            </View>
            <TouchableOpacity
             style={[tw`py-3 rounded-xl flex-row justify-center items-center`,
                       {backgroundColor: COLORS.primary}]}
              onPress={() => navigation.navigate('Commande')}
            >
              <Text style={tw`text-white font-bold text-lg`}>Passer la commande</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
 headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
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
  
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 8,
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
  },})
  
    

export default PanierScreen;