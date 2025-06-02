import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch } from '../android/app/authInterceptor';
import { LinearGradient } from 'expo-linear-gradient';


// Custom Colors
const colors = {
  primary: '#6A89A7',
  primaryDark: '#FF5252',
  primaryLight: '#FFA5A5',
  secondary: '#BDDDFC',
  secondaryDark: '#E5E7EB',
  textDark: '#1F2937',
  textMedium: '#4B5563',
  textLight: '#9CA3AF',
  white: '#FFFFFF',
  black: '#000000',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#D97706',
  gray: '#6B7280',
  error: '#EF4444',
  blueLight: '#DBEAFE',
  greenLight: '#D1FAE5',
  yellowLight: '#FEF3C7',
  purpleLight: '#EDE9FE',
  shadow: 'rgba(0, 0, 0, 0.1)'
};
  

// Custom Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(243, 244, 246, 0.3)', // secondary with opacity
  },
  loadingContainer: {
    flex: 1, 
    backgroundColor: 'rgba(243, 244, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'rgba(243, 244, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  errorContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.error
  },
   backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 8,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 16
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    fontSize: 15
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterScrollView: {
    paddingVertical: 8
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 30
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  filterButtonInactive: {
    backgroundColor: colors.secondaryDark,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '500'
  },
  filterTextInactive: {
    color: colors.textMedium
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionBar: {
    width: 4,
    height: 24,
    backgroundColor: colors.primary,
    marginRight: 8
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark
  },
  sectionCardContainer: {
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden'
  },
  cardImage: {
    width: '100%',
    height: 128
  },
  cardContent: {
    padding: 16
  },
  iconContainer: {
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.textDark
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textMedium
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: '500'
  },
  contentSection: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  postCardContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  postImageContainer: {
    position: 'relative'
  },
  postImage: {
    width: '100%',
    height: 160
  },
  dateLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  dateText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  postContent: {
    padding: 16
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.textDark
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  authorText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4
  },
  postExcerpt: {
    color: colors.textMedium,
    fontSize: 14,
    lineHeight: 20
  },
  blogLatestContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: 24,
    marginTop: 16
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyStateIcon: {
    opacity: 0.3,
    marginBottom: 16
  },
  emptyStateText: {
    color: colors.textMedium,
    marginBottom: 16
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 30
  },
  resetButtonText: {
    color: colors.white,
    fontWeight: '500'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4
  },
  pageButtonActive: {
    backgroundColor: colors.primary
  },
  pageButtonInactive: {
    backgroundColor: colors.secondaryDark
  },
  pageButtonText: {
    color: colors.textDark
  },
  pageButtonTextActive: {
    color: colors.white
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
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
});

// Section Card Component
const SectionCard = ({ section, onPress }) => {
  // Map section types to icon properties
  const sectionStyles = {
    garde: { bgColor: colors.blueLight, icon: 'paw', iconColor: colors.blue },
    evenement: { bgColor: colors.greenLight, icon: 'calendar', iconColor: colors.green },
    conseil: { bgColor: colors.yellowLight, icon: 'heart', iconColor: colors.yellow },
    story: { bgColor: colors.purpleLight, icon: 'comment-dots', iconColor: colors.purple }
  };
  const navigation = useNavigation();
  
  const style = sectionStyles[section.section_type] || { bgColor: colors.secondaryDark, icon: 'hashtag', iconColor: colors.gray };
  
  return (
    <TouchableOpacity 
      style={[styles.sectionCardContainer, { backgroundColor: style.bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {section.image && (
        <View style={{ height: 128 }}>
          <Image 
            source={{ uri: section.image }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name={style.icon} size={24} color={style.iconColor} />
        </View>
        <Text style={styles.cardTitle}>{section.title}</Text>
        <Text style={styles.cardDescription}>{section.content?.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.readMoreText}>Découvrir</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Post Card Component
const PostCard = ({ post, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.postCardContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.postImageContainer}>
        <Image 
          source={{ uri: post.featured_image }} 
          style={styles.postImage}
          resizeMode="cover"
        />
        <View style={styles.dateLabel}>
          <Text style={styles.dateText}>
            {new Date(post.created_at).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short'})}
          </Text>
        </View>
      </View>
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <View style={styles.authorRow}>
          <FontAwesome5 name="user" size={12} color={colors.primary} />
          <Text style={styles.authorText}>
            {post.author.first_name} {post.author.last_name}
          </Text>
        </View>
        <Text style={styles.postExcerpt} numberOfLines={3}>{post.excerpt}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.readMoreText}>Lire la suite</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
      <TouchableOpacity
        key={number}
        onPress={() => onPageChange(number)}
        style={[
          styles.pageButton,
          currentPage === number ? styles.pageButtonActive : styles.pageButtonInactive
        ]}
      >
        <Text style={currentPage === number ? styles.pageButtonTextActive : styles.pageButtonText}>
          {number}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={[
          styles.navButton,
          currentPage === 1 ? styles.pageButtonInactive : styles.pageButtonActive
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={16}
          color={currentPage === 1 ? colors.textLight : colors.white}
        />
      </TouchableOpacity>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 8 }}>
        <View style={{ flexDirection: 'row' }}>
          {renderPageNumbers()}
        </View>
      </ScrollView>
      
      <TouchableOpacity
        onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={[
          styles.navButton,
          currentPage === totalPages ? styles.pageButtonInactive : styles.pageButtonActive
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={16}
          color={currentPage === totalPages ? colors.textLight : colors.white}
        />
      </TouchableOpacity>
    </View>
  );
};

// Main Blog Page Component
export default function BlogPage() {
  const navigation = useNavigation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionType, setSelectedSectionType] = useState('all');
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(4); // Reduced for mobile screens
  
  const sectionTypes = [
    { id: 'all', name: 'All' },
    { id: 'garde', name: 'Garde' },
    { id: 'evenement', name: 'Événements' },
    { id: 'conseil', name: 'Conseils' },
    { id: 'story', name: 'Stories' }
  ];
  
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        // Using authenticatedFetch from your imports
        const sectionsResponse = await authenticatedFetch('http://192.168.0.188:8002/api/blog-content/');
        
        if (!sectionsResponse.ok) throw new Error('Failed to fetch blog sections');
        
        const sectionsData = await sectionsResponse.json();
        
        // Only use active sections
        const activeSections = sectionsData.filter(section => section.is_active);
        setSections(activeSections);
        
        const postsResponse = await authenticatedFetch('http://192.168.0.188:8002/api/blog-posts/');
        if (!postsResponse.ok) throw new Error('Failed to fetch blog posts');
        
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching blog data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogData();
  }, []);
  
  // Filter sections based on search term and section type
  const filteredSections = sections.filter(section => {
    // Match by title search
    const matchesSearch = searchTerm === '' || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase());
  
    // Match by section type
    const matchesType = selectedSectionType === 'all' || 
      section.section_type === selectedSectionType;
  
    return matchesSearch && matchesType;
  });
  
  // Calculate pagination values
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  // Handle page change
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle search submission
  const handleSearch = () => {
    // Search is handled through state
  };
  
  // Navigation to post detail
  const navigateToPostDetail = (post) => {
    navigation.navigate('BlogPostDetail', { postId: post.id, postSlug: post.slug });
  };
  
  // Navigation to section detail
  const navigateToSectionDetail = (section) => {
    navigation.navigate('SectionDetail', { sectionId: section.id });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text>Error: {error}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Blog Header */}
        <View style={styles.header}>
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
                      <Text style={styles.headerTitle}>Notre blog</Text>
                      <View style={{width: 24}} />
                    </View>
                    
                  </LinearGradient>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Rechercher une thématique..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity 
              onPress={handleSearch}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Section Type Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterScrollView}
          >
            {sectionTypes.map((section) => (
              <TouchableOpacity
                key={section.id}
                onPress={() => setSelectedSectionType(section.id)}
                style={[
                  styles.filterButton,
                  selectedSectionType === section.id 
                    ? styles.filterButtonActive 
                    : styles.filterButtonInactive
                ]}
              >
                <Text 
                  style={
                    selectedSectionType === section.id
                      ? styles.filterTextActive
                      : styles.filterTextInactive
                  }
                >
                  {section.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Content Sections */}
        <View style={styles.contentSection}>
          <View style={styles.sectionTitle}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitleText}>Thématiques</Text>
            <FontAwesome5 name="heart" size={16} color="#FF85A2" style={{ marginLeft: 8 }} />
          </View>
          
          {filteredSections.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="search" size={40} color={colors.primary} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateText}>Aucune section trouvée pour votre recherche.</Text>
              <TouchableOpacity 
                onPress={() => {setSearchTerm(''); setSelectedSectionType('all');}}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>Réinitialiser la recherche</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {filteredSections.map((section) => (
                <SectionCard 
                  key={section.id} 
                  section={section} 
                  onPress={() => navigateToSectionDetail(section)}
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Latest Articles */}
        <View style={styles.blogLatestContent}>
          <View style={styles.sectionTitle}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitleText}>Derniers Articles</Text>
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="search" size={40} color={colors.primary} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateText}>Aucun article trouvé.</Text>
            </View>
          ) : (
            <View>
              {currentPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPress={() => navigateToPostDetail(post)}
                />
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={paginate}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}