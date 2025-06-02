import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to get authentication token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) return `Bearer ${token}`;
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const CommandeScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const navigation = useNavigation();
  
  // API base URL - make sure to use your correct IP address
  const API_BASE_URL = 'http://192.168.0.188:8002';
  
  // Address form data state
  const [addressData, setAddressData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephone: ''
  });
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


  // Fetch cart items and user profile on component mount
  useEffect(() => {
    fetchCartItems();
    fetchUserProfile();
  }, []);

  // Fetch cart items from API
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        // Try to get cart from local storage if no token
        const savedCart = await AsyncStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
        setLoading(false);
        return;
      }
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const formattedCart = data.map(item => ({
          id: item.id || item.produit_id,
          nom: item.nom,
          prix: parseFloat(item.prix),
          image: item.image,
          quantity: item.quantity
        }));
        setCartItems(formattedCart);
        
        // Save to AsyncStorage as backup
        await AsyncStorage.setItem('cart', JSON.stringify(formattedCart));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Try to get cart from local storage if API fails
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      Alert.alert(
        'Erreur',
        'Impossible de charger le panier. Veuillez vérifier votre connexion internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile for address data
  const fetchUserProfile = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/profile/`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      
      if (data) {
        setAddressData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          telephone: data.telephone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle input changes for address form
  const handleInputChange = (name, value) => {
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate pricing information
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.prix * item.quantity), 0).toFixed(2);
  };

  const getFinalTotal = () => {
    const total = parseFloat(getTotalPrice());
 
    return (total).toFixed(2);
  };

  // Handle quantity change for cart items
  const handleQuantityChange = async (productId, change) => {
    // Optimistically update UI
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
        
        const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/modifier/`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ 
            produit_id: productId, 
            quantity: updatedItem.quantity 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      
      // Update cart in AsyncStorage
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert UI on error
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de modifier la quantité. Veuillez réessayer.');
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    // Validate all required fields
    if (!addressData.nom || !addressData.prenom || !addressData.adresse || 
        !addressData.code_postal || !addressData.ville || !addressData.telephone) {
      Alert.alert('Erreur', 'Veuillez remplir toutes les informations de livraison');
      return;
    }
    
    // Check auth token
    const token = await getAuthToken();
    if (!token) {
      Alert.alert(
        'Connexion requise', 
        'Vous devez être connecté pour passer une commande.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setProcessingOrder(true);
    
    try {
      // Create order with address and payment method
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/commander/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          adresse_livraison: `${addressData.prenom} ${addressData.nom}, ${addressData.adresse}, ${addressData.code_postal} ${addressData.ville}`,
          telephone: addressData.telephone,
          methode_paiement: 'livraison'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order error details:', errorData);
        Alert.alert('Erreur', 'Impossible de créer la commande. Veuillez réessayer.');
        throw new Error(`Error: ${response.status}`);
      }
      
      // Get response data
      const data = await response.json();
      
      // Clear cart
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
      
      // Show success message
      setOrderSuccess(true);
      setOrderNumber(data.numero_commande);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la commande.');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={tw`flex-1 bg-gray-100 justify-center items-center`}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={tw`mt-4 text-gray-600`}>Chargement...</Text>
      </View>
    );
  }

  // Show empty cart state
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`bg-white px-4 pt-12 pb-4 shadow-md`}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={tw`p-2 mr-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold`}>Commande</Text>
          </View>
        </View>
        
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <View style={tw`bg-blue-100 p-4 rounded-full mb-6`}>
            <Ionicons name="cart-outline" size={64} color="#8B5CF6" />
          </View>
          <Text style={tw`text-xl text-gray-600 mb-6`}>Votre panier est vide</Text>
          <TouchableOpacity 
            style={tw`bg-blue-600 px-8 py-3.5 rounded-xl`}
            onPress={() => navigation.navigate('Boutique')}
          >
            <Text style={tw`text-white font-bold text-lg`}>Découvrir nos produits</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show order success state
  if (orderSuccess) {
    return (
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`bg-white px-4 pt-12 pb-4 shadow-md`}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Boutique')} 
              style={tw`p-2 mr-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-bold`}>Commande réussie</Text>
          </View>
        </View>
        
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <View style={tw`bg-green-100 p-4 rounded-full mb-6`}>
            <Ionicons name="checkmark" size={64} color="green" />
          </View>
          <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Commande réussie!</Text>
          <Text style={tw`text-gray-600 text-center mb-6`}>
            Votre commande numéro <Text style={tw`font-bold text-blue-600`}>{orderNumber}</Text> a été enregistrée.
          </Text>
          <View style={tw`flex-row`}>
            <TouchableOpacity 
              style={tw`bg-blue-600 px-6 py-3 rounded-xl mr-4`}
              onPress={() => navigation.navigate('Boutique')}
            >
              <Text style={tw`text-white font-bold`}>Continuer les achats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={tw`bg-gray-200 px-6 py-3 rounded-xl`}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={tw`text-gray-700 font-bold`}>Voir mes commandes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Main content - Checkout form and order summary
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
                     onPress={() => navigation.navigate('Panier')} 
                     hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                     style={styles.backButton}
                   >
                     <Ionicons name="arrow-back" size={24} color="white" />
                   </TouchableOpacity>
                   <Text style={styles.headerTitle}>Finaliser la commande</Text>
                   <View style={{ width: 24 }} />
                 </View>
               </LinearGradient>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-32`}>
        {/* Shipping Information Form */}
        <View style={tw`bg-white rounded-xl shadow mb-6 p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Informations de livraison</Text>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-600 mb-1`}>Nom</Text>
            <TextInput
              style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
              value={addressData.nom}
              onChangeText={(text) => handleInputChange('nom', text)}
              placeholder="Votre nom"
            />
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-600 mb-1`}>Prénom</Text>
            <TextInput
              style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
              value={addressData.prenom}
              onChangeText={(text) => handleInputChange('prenom', text)}
              placeholder="Votre prénom"
            />
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-600 mb-1`}>Adresse</Text>
            <TextInput
              style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
              value={addressData.adresse}
              onChangeText={(text) => handleInputChange('adresse', text)}
              placeholder="Votre adresse complète"
            />
          </View>
          
          <View style={tw`flex-row mb-4`}>
            <View style={tw`flex-1 mr-2`}>
              <Text style={tw`text-gray-600 mb-1`}>Code Postal</Text>
              <TextInput
                style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
                value={addressData.code_postal}
                onChangeText={(text) => handleInputChange('code_postal', text)}
                placeholder="Code postal"
                keyboardType="numeric"
              />
            </View>
            <View style={tw`flex-1 ml-2`}>
              <Text style={tw`text-gray-600 mb-1`}>Ville</Text>
              <TextInput
                style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
                value={addressData.ville}
                onChangeText={(text) => handleInputChange('ville', text)}
                placeholder="Votre ville"
              />
            </View>
          </View>
          
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-600 mb-1`}>Téléphone</Text>
            <TextInput
              style={tw`border-2 border-blue-100 rounded-xl px-4 py-2`}
              value={addressData.telephone}
              onChangeText={(text) => handleInputChange('telephone', text)}
              placeholder="Numéro de téléphone"
              keyboardType="phone-pad"
            />
          </View>
        </View>
        
        {/* Payment Method */}
        <View style={tw`bg-white rounded-xl shadow mb-6 p-4`}>
          <Text style={[tw`text-lg font-bold mb-4`]}>Méthode de paiement</Text>
          
          <View style={tw`flex-row items-center p-3 border-2 border-blue-100 rounded-xl bg-blue-50`}>
            <View style={tw`bg-blue-100 p-2 rounded-full mr-4`}>
              <Ionicons name="cash-outline" size={24} color="black" />
            </View>
            <View>
              <Text style={[tw`font-bold`]}>Paiement à la livraison</Text>
              <Text style={tw`text-gray-600 text-sm`}>Espèces ou carte à la réception</Text>
            </View>
          </View>
        </View>
        
        {/* Order Summary */}
        <View style={tw`bg-white rounded-xl shadow mb-6 p-4`}>
          <Text style={tw`text-lg font-bold mb-4`}>Résumé de la commande</Text>
          
          {cartItems.map(item => {
            // Handle image source
            let imageSource;
            if (!item.image) {
              imageSource = require('../assets/dogandcat.jpeg');
            } else if (typeof item.image === 'string') {
              imageSource = { 
                uri: item.image.startsWith('http') 
                  ? item.image 
                  : `${API_BASE_URL}${item.image}` 
              };
            } else {
              imageSource = item.image;
            }
            
            return (
              <View key={item.id.toString()} style={tw`flex-row items-center mb-4 pb-4 border-b border-gray-200`}>
                <Image 
                  source={imageSource}
                  style={tw`w-16 h-16 rounded-lg`}
                  defaultSource={require('../assets/dogandcat.jpeg')}
                />
                <View style={tw`ml-4 flex-1`}>
                  <Text style={tw`font-bold`}>{item.nom}</Text>
                  <View style={tw`flex-row items-center mt-2`}>
                                            <TouchableOpacity
                      onPress={() => {
                        if (item.quantity > 1) {
                          setCartItems(cartItems.map(cartItem => 
                            cartItem.id === item.id 
                              ? { ...cartItem, quantity: cartItem.quantity - 1 } 
                              : cartItem
                          ));
                        }
                      }}
                    >
                      <Ionicons 
                        name="remove" 
                        size={20} 
                        color={item.quantity <= 1 ? "#D1D5DB" : "#8B5CF6"} 
                      />
                    </TouchableOpacity>
                    <Text style={tw`px-3 font-medium`}>{item.quantity}</Text>
                                       <TouchableOpacity
                     onPress={() => {
                       setCartItems(cartItems.map(cartItem =>
                         cartItem.id === item.id
                           ? { ...cartItem, quantity: cartItem.quantity + 1 }
                           : cartItem
                       ));
                     }}
                   >
                      <Ionicons name="add" size={20} color="#8B5CF6" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={tw`font-bold text-blue-600`}>
                  {(item.prix * item.quantity).toFixed(2)} DT
                </Text>
              </View>
            );
          })}
          
          {/* Price Breakdown */}

            <View style={tw`flex-row justify-between mt-4 pt-4 border-t border-gray-200`}>
              <Text style={tw`text-lg font-bold`}>Total</Text>
              <Text style={tw`text-lg font-bold text-blue-600`}>{getFinalTotal()} DT</Text>
            </View>
          
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white px-4 py-6 border-t border-gray-200 shadow-lg`}>
        <TouchableOpacity
           style={[
    tw`py-4 rounded-xl flex-row justify-center items-center`,
    { backgroundColor: COLORS.primary, opacity: processingOrder ? 0.7 : 1 }
  ]}
          onPress={handleSubmitOrder}
          disabled={processingOrder}
        >
          {processingOrder ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" style={tw`mr-2`} />
              <Text style={tw`text-white font-bold text-lg`}
              >Traitement en cours...</Text>
            </>
          ) : (
            <Text style={tw`text-white font-bold text-lg`}>Confirmer la commande</Text>
          )}
        </TouchableOpacity>
      </View>
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

export default CommandeScreen;