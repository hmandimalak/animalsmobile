import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { useNavigation } from '@react-navigation/native';

const BoutiqueScreen = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();
  
  // API base URL - make sure to use your correct IP address
  const API_BASE_URL = 'http://192.168.0.132:8000';
  
  // Get authentication token
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
  
  // React Native skeleton component
  const SkeletonCard = () => (
    <View style={tw`bg-white rounded-2xl shadow-md overflow-hidden`}>
      <View style={tw`h-60 bg-gray-200`} />
      <View style={tw`p-4 space-y-3`}>
        <View style={tw`h-5 bg-gray-200 rounded-full w-3/4`} />
        <View style={tw`h-4 bg-gray-200 rounded-full w-5/6`} />
        <View style={tw`h-8 bg-gray-200 rounded-full w-1/3 mt-4`} />
      </View>
    </View>
  );

  // Category filters with icons
  const categories = [
    { id: 'Nutrition', name: 'Nutrition', icon: 'nutrition' },
    { id: 'Accessoires', name: 'Accessoires', icon: 'paw' },
    { id: 'Hygiène', name: 'Hygiène', icon: 'water' },
    { id: '', name: 'Tous', icon: 'grid' }
  ];
  
  // Check authentication status
  const checkAuthStatus = async () => {
    const token = await getAuthToken();
    setIsAuthenticated(!!token);
  };

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    // Load products and check authentication
    Promise.all([
      fetchProduits(),
      checkAuthStatus()
    ])
    .finally(() => {
      setLoading(false);
    });
  }, []);
  
  // Fetch products based on filters
  useEffect(() => {
    if (!loading) {
      fetchProduits();
    }
  }, [filterCategory, searchTerm, sortBy]);

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    }
  }, [isAuthenticated]);

  // Fetch products from the API
  const fetchProduits = async () => {
    try {
      let url = `${API_BASE_URL}/api/boutique/produits/`;
      const params = new URLSearchParams();
      if (filterCategory) params.append('categorie', filterCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('ordering', sortBy);
      if (params.toString()) url += `?${params.toString()}`;
      
      console.log('Fetching products from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response body:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products fetched successfully:', data.length);
      setProduits(data);
    } catch (error) {
      console.error('Error fetching produits:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les produits. Veuillez vérifier votre connexion internet.'
      );
    }
  };
  
  // Fetch cart items from the API
  const fetchCartItems = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setCartItems([]);
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
      
      // Format cart items with product details
      const formattedCart = data.map(cartItem => {
        // Ensure the cart item has a produit_id property
        if (!cartItem.produit_id && cartItem.produit) {
          cartItem.produit_id = cartItem.produit;
        }
        
        const product = produits.find(p => p.id === cartItem.produit_id);
        const effectivePrice = product?.is_discount_active
          ? parseFloat(product.prix_promotion)
          : parseFloat(product?.prix || cartItem.prix);
          
        return {
          ...cartItem,
          produit_id: cartItem.produit_id || cartItem.produit || cartItem.id || Date.now().toString(),
          prix: effectivePrice
        };
      });
      
      setCartItems(formattedCart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Cart calculations
  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () => cartItems.reduce((total, item) => total + item.prix * item.quantity, 0).toFixed(2);

  // Handle add to cart
  const handleAddToCart = async (produit) => {
    const authToken = await getAuthToken();
    if (!authToken) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter au panier');
      return;
    }

    const effectivePrice = produit.is_discount_active
      ? parseFloat(produit.prix_promotion)
      : parseFloat(produit.prix);

    const existingItem = cartItems.find(item => item.produit_id === produit.id);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    // Optimistically update UI
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.produit_id === produit.id 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    } else {
      setCartItems([...cartItems, { 
        produit_id: produit.id,
        nom: produit.nom,
        prix: effectivePrice,
        image: produit.image,
        quantity: 1
      }]);
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/ajouter/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ produit_id: produit.id, quantity: 1 }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      // Refresh cart after successful addition
      fetchCartItems();
      
    } catch (error) {
      console.error('Network error:', error);
      // Revert UI on error
      fetchCartItems(); // Re-fetch to sync with server state
      Alert.alert('Erreur', 'Erreur de connexion. Veuillez vérifier votre connexion internet.');
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = async (itemId) => {
    const authToken = await getAuthToken();
    if (!authToken) return;
    
    try {
      // Optimistically update UI
      setCartItems(cartItems.filter(item => item.produit_id !== itemId));
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/supprimer/${itemId}/`, {
        method: 'DELETE',
        headers: { 
          'Authorization': authToken
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert UI on error
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de supprimer cet article. Veuillez réessayer.');
    }
  };

  // Handle cart item quantity change
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const authToken = await getAuthToken();
    if (!authToken) return;
    
    // Optimistically update UI
    setCartItems(cartItems.map(item => 
      item.produit_id === itemId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
    
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/modifier/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ produit_id: itemId, quantity: newQuantity }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert UI on error
      fetchCartItems();
    }
  };

  // Render product item
  const renderProductItem = ({ item }) => {
    // Handle case where image might be a URL string or require() object or null
    let imageSource;
    if (!item.image) {
      // Fallback image if none provided
      imageSource = require('../assets/dogandcat.jpeg');
    } else if (typeof item.image === 'string') {
      imageSource = { uri: item.image.startsWith('http') 
        ? item.image 
        : `${API_BASE_URL}${item.image}` 
      };
    } else {
      imageSource = item.image;
    }
      
    return (
      <View style={tw`w-1/2 p-2`}>
        <View style={tw`bg-white rounded-2xl shadow-lg p-4`}>
          <Image 
            source={imageSource}
            style={tw`w-full h-40 rounded-xl mb-4`}
            resizeMode="cover"
            defaultSource={require('../assets/dogandcat.jpeg')}
          />
          
          {item.is_discount_active && (
            <View style={tw`absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-md`}>
              <Text style={tw`text-white text-sm`}>-{item.discount_percent || 20}%</Text>
            </View>
          )}

          <Text style={tw`text-lg font-bold mb-2`}>{item.nom}</Text>
           <Text style={tw`text-lg  mb-1`}>{item.description}</Text>
          
          
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-gray-500 text-sm`}>{item.categorie}</Text>
            {item.is_discount_active ? (
              <View style={tw`flex-col items-end`}>
                <Text style={tw`text-lg font-bold text-purple-600`}>
                  {item.prix_promotion ? parseFloat(item.prix_promotion).toLocaleString() : '--'} DT
                </Text>
                <Text style={tw`text-sm text-gray-500 line-through`}>
                  {item.prix ? parseFloat(item.prix).toLocaleString() : '--'} DT
                </Text>
              </View>
            ) : (
              <Text style={tw`text-lg font-bold text-purple-600`}>
                {item.prix ? parseFloat(item.prix).toLocaleString() : '--'} DT
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={tw`bg-purple-100 py-2 rounded-full flex-row justify-center items-center`}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={20} color="purple" />
            <Text style={tw`text-purple-600 ml-2 font-bold`}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render cart item
  const renderCartItem = ({ item }) => {
    let imageSource;
    if (!item.image) {
      imageSource = require('../assets/dogandcat.jpeg');
    } else if (typeof item.image === 'string') {
      imageSource = {
        uri: item.image.startsWith('http')
          ? item.image
          : `${API_BASE_URL}${item.image}`,
      };
    } else {
      imageSource = item.image;
    }
        
    return (
      <View style={tw`flex-row justify-between items-center py-4 border-b`}>
        <View style={tw`flex-row items-center`}>
          <Image source={imageSource} style={tw`w-16 h-16 rounded-lg`} />
          <View style={tw`ml-4`}>
            <Text style={tw`font-bold text-base`}>{item.nom}</Text>
            <Text style={tw`text-purple-600 font-bold`}>
              {(item.prix * item.quantity).toLocaleString()} DT
            </Text>
          </View>
        </View>
        <View style={tw`flex-row items-center`}>
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
            <Ionicons name="remove-circle-outline" size={24} color="purple" />
          </TouchableOpacity>
          <Text style={tw`mx-2`}>{item.quantity}</Text>
         <TouchableOpacity
  onPress={() => {
    setCartItems(cartItems.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    ));
  }}
>
            <Ionicons name="add-circle-outline" size={24} color="purple" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRemoveFromCart(item.produit_id)} style={tw`ml-4`}>
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header Section */}
      <View style={tw`bg-white px-4 pt-8 pb-4 shadow-md`}>
          
        <Text style={tw`text-2xl font-bold mb-4`}> Notre Boutique</Text>
        
        {/* Search Bar */}
        <View style={tw`bg-gray-100 rounded-xl px-4 py-2 flex-row items-center`}>
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Rechercher des produits"
            style={tw`flex-1 ml-2`}
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
            onSubmitEditing={fetchProduits}
          />
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`mt-4`}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={tw`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                filterCategory === category.id ? 'bg-purple-600' : 'bg-gray-100'
              }`}
              onPress={() => setFilterCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={filterCategory === category.id ? 'white' : 'gray'} 
                style={tw`mr-1`}
              />
              <Text style={tw`${
                filterCategory === category.id ? 'text-white' : 'text-gray-600'
              }`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Area */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => item.toString()}
          numColumns={2}
          contentContainerStyle={tw`p-2`}
        />
      ) : (
        <FlatList
          data={produits}
          renderItem={renderProductItem}
          keyExtractor={item => item.id ? item.id.toString() : `product-${Math.random()}`}
          numColumns={2}
          contentContainerStyle={tw`p-2 pb-24`}
          ListHeaderComponent={
            <Text style={tw`text-xl font-bold px-4 py-2`}>
              {filterCategory ? filterCategory : 'Tous les produits'}
            </Text>
          }
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center p-8`}>
              <Text style={tw`text-gray-500 text-center`}>
                Aucun produit trouvé. Essayez de modifier vos filtres.
              </Text>
            </View>
          }
          onRefresh={fetchProduits}
          refreshing={loading}
        />
      )}

      {/* Cart Icon */}
      <TouchableOpacity
        style={tw`absolute bottom-6 right-6 bg-purple-600 p-4 rounded-full shadow-lg`}
        onPress={() => {
          if (isAuthenticated) {
            setCartVisible(true);
          } else {
            Alert.alert('Connexion requise', 'Veuillez vous connecter pour voir votre panier');
          }
        }}
      >
        <Ionicons name="cart" size={28} color="white" />
        {cartItems.length > 0 && (
          <View style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center`}>
            <Text style={tw`text-white font-bold`}>{getTotalItems()}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Cart Modal */}
      <Modal
        visible={cartVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCartVisible(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View style={tw`bg-white rounded-t-2xl p-6 h-3/4`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-xl font-bold`}>Votre Panier</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={tw`flex-1 justify-center items-center`}>
                <Ionicons name="cart-outline" size={64} color="lightgray" />
                <Text style={tw`text-gray-500 text-lg mt-4`}>Votre panier est vide</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={cartItems}
                  keyExtractor={item => {
                    // Ensure we always have a valid key by providing fallbacks
                    return item.produit_id ? 
                      item.produit_id.toString() : 
                      (item.id ? 
                        item.id.toString() : 
                        `cart-item-${Math.random().toString(36).substr(2, 9)}`
                      );
                  }}
                  renderItem={renderCartItem}
                  contentContainerStyle={tw`pb-24`}
                />
                
                <View style={tw`absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-gray-200`}>
                  <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-lg`}>Total:</Text>
                    <Text style={tw`text-xl font-bold text-purple-600`}>{getTotalPrice()} DT</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Panier')} // ✅ Add this line
                    style={tw`bg-purple-600 py-3 rounded-xl flex-row justify-center items-center`}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>Commander</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BoutiqueScreen;