
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';

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

const PanierScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  // API base URL - make sure to use your correct IP address
  const API_BASE_URL = 'http://192.168.0.132:8000';

  // Initial data loading
  useEffect(() => {
    fetchCartItems();
  }, []);

  // Fetch cart items from the API
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

  // Save cart to AsyncStorage when it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to AsyncStorage:', error);
      }
    };
    
    if (!loading) {
      saveCart();
    }
  }, [cartItems, loading]);

  // Handle remove from cart
  const handleRemoveItem = async (productId) => {
    // Optimistically update UI
    setCartItems(cartItems.filter(item => item.id !== productId));
    
    try {
      const token = await getAuthToken();
      if (token) {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/supprimer/${productId}/`, {
          method: 'DELETE',
          headers: { 
            'Authorization': token
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert UI on error
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de supprimer cet article. Veuillez réessayer.');
    }
  };

  // Handle cart item quantity change
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
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert UI on error
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de modifier la quantité. Veuillez réessayer.');
    }
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.prix * item.quantity), 0).toFixed(2);
  };

  // Get total number of items
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

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
      <View style={tw`bg-white px-4 pt-12 pb-4 shadow-md`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={tw`p-2 mr-4`}
          >
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-bold`}>Votre Panier</Text>
        </View>
      </View>

      {/* Content */}
      {cartItems.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <View style={tw`bg-purple-100 p-4 rounded-full mb-6`}>
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
            {/* Cart Items */}
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
                <View 
                  key={item.id.toString()} 
                  style={tw`bg-white mb-4 rounded-xl shadow p-4 border border-purple-100`}
                >
                  <View style={tw`flex-row`}>
                    <Image 
                      source={imageSource}
                      style={tw`w-24 h-24 rounded-lg`}
                      defaultSource={require('../assets/dogandcat.jpeg')}
                    />
                    <View style={tw`ml-4 flex-1 justify-between`}>
                      <View>
                        <Text style={tw`text-lg font-bold`}>{item.nom}</Text>
                        <Text style={tw`text-purple-600 font-bold`}>{item.prix} DT</Text>
                      </View>
                      
                      <View style={tw`flex-row justify-between items-center mt-2`}>
                        <View style={tw`flex-row items-center border-2 border-purple-100 rounded-xl`}>
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
                        
                        <Text style={tw`font-bold text-purple-600 mr-2`}>
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
                <Text style={tw`text-2xl font-bold text-purple-600`}>{getTotalPrice()} DT</Text>
              </View>
              <Text style={tw`text-gray-500 text-sm`}>Frais de livraison calculés à la prochaine étape</Text>
            </View>
            
            <TouchableOpacity
              style={tw`bg-purple-600 py-4 rounded-xl flex-row justify-center items-center`}
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

export default PanierScreen;