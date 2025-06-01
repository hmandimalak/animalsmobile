import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet, 
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons,Feather, FontAwesome5 } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
const BoutiqueScreen = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();
  const API_BASE_URL = 'http://192.168.0.132:8000';
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

  // Skeleton loader component
  const SkeletonCard = () => (
  <View style={tw`bg-white rounded-2xl shadow-md overflow-hidden`}>
    <View style={tw`h-60 bg-gray-200`} />
    <View style={tw`p-4`}>
      <View style={tw`h-5 bg-gray-200 rounded-full w-3/4 mb-3`} />
      <View style={tw`h-4 bg-gray-200 rounded-full w-5/6 mb-3`} />
      <View style={tw`h-8 bg-gray-200 rounded-full w-1/3`} />
    </View>
  </View>
);

  // Categories
  const categories = [
    { id: 'Nutrition', name: 'Nutrition', icon: 'nutrition' },
    { id: 'Accessoires', name: 'Accessoires', icon: 'paw' },
    { id: 'Hygiène', name: 'Hygiène', icon: 'water' },
    { id: '', name: 'Tous', icon: 'grid' },
  ];

  // Check auth status
  const checkAuthStatus = async () => {
    const token = await getAuthToken();
    setIsAuthenticated(!!token);
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProduits(), checkAuthStatus()])
      .finally(() => setLoading(false));
  }, []);

  // Refetch products when filters change
  useEffect(() => {
    if (!loading) fetchProduits();
  }, [filterCategory, searchTerm, sortBy]);

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchCartItems();
  }, [isAuthenticated]);

  // Fetch products
  const fetchProduits = async () => {
    try {
      let url = `${API_BASE_URL}/api/boutique/produits/`;
      const params = new URLSearchParams();
      if (filterCategory) params.append('categorie', filterCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('ordering', sortBy);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setProduits(data);
    } catch (error) {
      console.error('Error fetching produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits.');
    }
  };

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setCartItems([]);
        return;
      }
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/`, {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      const formattedCart = data.map(cartItem => {
        const product = produits.find(p => p.id === cartItem.produit_id);
        const effectivePrice = product?.is_discount_active
          ? parseFloat(product.prix_promotion)
          : parseFloat(product?.prix || cartItem.prix);

        return {
          ...cartItem,
          produit_id: cartItem.produit_id || cartItem.produit || cartItem.id,
          prix: effectivePrice,
        };
      });

      setCartItems(formattedCart);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Cart helpers
  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () =>
    cartItems.reduce((total, item) => total + item.prix * item.quantity, 0).toFixed(2);

  // Add to cart
  const handleAddToCart = async (produit) => {
    const authToken = await getAuthToken();
    if (!authToken) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter au panier');
      return;
    }

    const effectivePrice = produit.is_discount_active
      ? parseFloat(produit.prix_promotion)
      : parseFloat(produit.prix);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/boutique/panier/ajouter/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authToken },
        body: JSON.stringify({ produit_id: produit.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      // Optimistically update UI
      const existingItem = cartItems.find(item => item.produit_id === produit.id);
      if (existingItem) {
        setCartItems(
          cartItems.map(item =>
            item.produit_id === produit.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setCartItems([
          ...cartItems,
          {
            produit_id: produit.id,
            nom: produit.nom,
            prix: effectivePrice,
            image: produit.image,
            quantity: 1,
          },
        ]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Erreur', 'Impossible d’ajouter l’article au panier.');
      fetchCartItems(); // Sync with server state
    }
  };

  // Remove from cart
  const handleRemoveFromCart = async (itemId) => {
    const authToken = await getAuthToken();
    if (!authToken) return;

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/boutique/panier/supprimer/${itemId}/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': authToken },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      setCartItems(cartItems.filter(item => item.produit_id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      fetchCartItems();
      Alert.alert('Erreur', 'Impossible de supprimer cet article.');
    }
  };

  // Update quantity
 const handleUpdateQuantity = async (itemId, newQuantity) => {
  if (newQuantity < 1) return;
  
  const authToken = await getAuthToken();
  if (!authToken) return;

  try {
    // Optimistic UI update
    setCartItems(cartItems.map(item => 
      item.produit_id === itemId ? { ...item, quantity: newQuantity } : item
    ));

    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/boutique/panier/update/${itemId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Cart updated:', result);

  } catch (error) {
    console.error('Error updating quantity:', error);
    // Revert to server state on error
    fetchCartItems();
    Alert.alert('Erreur', 'Impossible de mettre à jour la quantité.');
  }
};
  // Render product
  const renderProductItem = ({ item }) => {
    const effectivePrice = item.is_discount_active
      ? parseFloat(item.prix_promotion)
      : parseFloat(item.prix);

    let imageSource;
    if (!item.image) {
      imageSource = require('../assets/dogandcat.jpeg');
    } else if (typeof item.image === 'string') {
      imageSource = {
        uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`,
      };
    } else {
      imageSource = item.image;
    }

    return (
      <View style={tw`w-1/2 p-2`}>
        <View style={tw`bg-white rounded-2xl shadow-lg p-4 relative`}>
          <Image
            source={imageSource}
            style={tw`w-full h-40 rounded-xl mb-4`}
            resizeMode="cover"
            defaultSource={require('../assets/dogandcat.jpeg')}
          />

          {item.is_discount_active && (
            <View style={tw`absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-md`}>
              <Text style={tw`text-white text-sm`}>-{item.discount_percent}%</Text>
            </View>
          )}

          <Text style={tw`text-lg font-bold mb-2`}>{item.nom}</Text>
          <Text style={tw`text-lg mb-1`}>{item.description}</Text>

          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-gray-500 text-sm`}>{item.categorie}</Text>

            {item.is_discount_active ? (
              <View style={tw`flex-col items-end`}>
                <Text style={tw`text-lg font-bold text-dark-600`}>
                  {parseFloat(item.prix_promotion).toLocaleString()} DT
                </Text>
                <Text style={tw`text-sm text-gray-500 line-through`}>
                  {parseFloat(item.prix).toLocaleString()} DT
                </Text>
              </View>
            ) : (
              <Text style={tw`text-lg font-bold text-dark-600`}>
                {parseFloat(item.prix).toLocaleString()} DT
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={tw`bg-blue-100 py-2 rounded-full flex-row justify-center items-center`}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={20} color={COLORS.dark} />
            <Text style={tw`text-dark-600 ml-2 font-bold`}>Ajouter</Text>
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
        uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`,
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
            <Text style={tw`text-dark-600 font-bold`}>
              {(item.prix * item.quantity).toLocaleString()} DT
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center`}>
          <TouchableOpacity
            onPress={() =>
              handleUpdateQuantity(item.produit_id, Math.max(1, item.quantity - 1))
            }
          >
            <Ionicons name="remove-circle-outline" size={24} color={COLORS.dark}  />
          </TouchableOpacity>
          <Text style={tw`mx-2`}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.produit_id, item.quantity + 1)}
          >
            <Ionicons name="add-circle-outline" size={24}color={COLORS.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveFromCart(item.produit_id)}
            style={tw`ml-4`}
          >
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };



return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
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
          <Text style={styles.headerTitle}>Notre boutique</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={tw`mx-4 my-2`}>
        <View style={[tw`rounded-xl px-4 py-2 flex-row items-center`, 
                     {backgroundColor: 'white'}]}>
          <Ionicons name="search" size={20} color={COLORS.dark} />
          <TextInput
            placeholder="Rechercher des produits"
            placeholderTextColor={COLORS.darkGray}
            style={[tw`flex-1 ml-2`, {color: COLORS.dark}]}
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
            onSubmitEditing={fetchProduits}
          />
        </View>
      </View>

      {/* Category Filters */}
      <View style={tw`mx-4 mb-2`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[tw`mr-3 px-4 py-2 rounded-full flex-row items-center`,
                filterCategory === category.id 
                  ? {backgroundColor: COLORS.primary} 
                  : {backgroundColor: COLORS.secondary}
              ]}
              onPress={() => setFilterCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={16}
                color={filterCategory === category.id ? 'white' : COLORS.dark}
                style={tw`mr-1`}
              />
              <Text style={[
                filterCategory === category.id 
                  ? {color: 'white'} 
                  : {color: COLORS.dark}
              ]}>
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
  {/* Cart Icon */}
      <TouchableOpacity
        style={[tw`absolute bottom-40 right-6 p-4 rounded-full shadow-lg z-10`,
               {backgroundColor: COLORS.primary}]}
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
          <View style={[tw`rounded-t-2xl p-6 h-3/4`, {backgroundColor: COLORS.white}]}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={[tw`text-xl font-bold`, {color: COLORS.dark}]}>Votre Panier</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
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
                
                 <View style={[tw`absolute bottom-0 left-0 right-0 p-6 border-t`,
                         {backgroundColor: COLORS.white, borderColor: COLORS.lightGray}]}>
                  <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={[tw`text-lg`, {color: COLORS.dark}]}>Total:</Text>
                <Text style={[tw`text-xl font-bold`, {color: COLORS.primary}]}>
                  {getTotalPrice()} DT
                </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Panier')} // ✅ Add this line
                    style={[tw`py-3 rounded-xl flex-row justify-center items-center`,
                       {backgroundColor: COLORS.primary}]}
                  >
                    <Text style={tw`text-white font-bold text-lg`}>Commander</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
       <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <Feather name="home" size={24} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Nosanimaux')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <FontAwesome5 name="paw" size={20} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Nos animaux</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Garde')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.white }]}>
            <MaterialIcons name="pets" size={22} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Garde</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Boutique')}
        >
          <View style={[styles.navIconContainer, { backgroundColor: COLORS.primary }]}>
            <Feather name="shopping-bag" size={20} color={COLORS.darkGray} />
          </View>
          <Text style={[styles.navText, { color: COLORS.darkGray }]}>Boutique</Text>
        </TouchableOpacity>
      </View>
      
      </SafeAreaView>
  );
};
const styles = StyleSheet.create({
 
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
    container: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  // —— Bottom Navigation
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1E6FA',
    paddingVertical: 10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    alignItems: 'center',
    padding: 5,
    flex: 1,
  },
  navIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

export default BoutiqueScreen;