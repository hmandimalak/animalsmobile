import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#6A89A7',    
  secondary: '#BDDDFC',   
  accent: '#88BDF2',      
  tertiary: '#E4F0FD',    
  dark: '#384959',        
  white: '#FFFFFF',
  gray: '#F7FAFC',
  darkGray: '#718096',
  lightGray: '#E2E8F0',
  danger: '#EF4444',
  success: '#48BB78',
  warning: '#ED8936',
  
  // Removed all pink-related colors
  gradientStart: '#6A89A7',
  gradientEnd: '#384959',
  cardBackground: '#FEFEFE',
  shadowColor: 'rgba(106, 137, 167, 0.15)',
  
  // Updated animal colors
  dogColor: '#A7C6E5',
  catColor: '#B5D3E7',
  birdColor: '#87CEEB',
  rabbitColor: '#98D1D1',
};

export default StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  menuButton: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 12,
    padding: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  menuIcon: {
    fontSize: 18,
    color: COLORS.dark,
    fontWeight: 'bold',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  logoImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    textShadowColor: 'rgba(255, 107, 157, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileButton: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 12,
    padding: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  profileIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
    textAlign: 'center',
  },

  welcomeSubtext: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Animal Type Selection
  animalTypeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  animalTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  animalTypeList: {
    paddingHorizontal: 5,
    gap: 10,
  },

  animalTypePill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    marginHorizontal: 5,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },

  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  searchButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Species Section
  speciesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  speciesContainer: {
    paddingHorizontal: 5,
    gap: 12,
  },

  speciesButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginHorizontal: 4,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Search Results Section
  searchResultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  resultCount: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },

  animalCardList: {
    paddingHorizontal: 5,
    gap: 15,
  },

  // Animal Card Styles
  animalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 8,
    width: width * 0.75,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },

  imageContainer: {
    position: 'relative',
    height: 200,
  },

  animalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
  },

  heartBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  heartBadgeText: {
    fontSize: 16,
  },

  animalCardContent: {
    padding: 20,
  },

  animalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },

  animalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  animalInfo: {
    flex: 1,
  },

  animalSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
    marginBottom: 5,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },

  locationText: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },

  viewButton: {
    backgroundColor: COLORS.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  viewButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Statistics Section
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },

  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statIconContainer: {
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
  },

  statEmoji: {
    fontSize: 24,
  },

  statTextContainer: {
    flex: 1,
  },

  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },

  heartDecoration: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 20,
    padding: 10,
  },

  heartEmoji: {
    fontSize: 20,
  },

  // Success Stories Section
  successStoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  viewMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  storiesContainer: {
    paddingHorizontal: 5,
    gap: 15,
  },

  storyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 8,
    width: width * 0.7,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },

  storyImageContainer: {
    position: 'relative',
    height: 140,
  },

  storyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
  },

  storyHeartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 6,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  storyHeartText: {
    fontSize: 14,
  },

  storyContent: {
    padding: 16,
  },

  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 6,
  },

  storyDescription: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 8,
  },

  storyDate: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 20,
  },

  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  navIconContainer: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  activeNavIcon: {
    fontSize: 20,
    color: COLORS.white,
  },

  navIcon: {
    fontSize: 20,
    color: COLORS.darkGray,
  },

  navText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 40,
    maxHeight: height * 0.85,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },

  closeButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },

  closeButtonText: {
    fontSize: 18,
    color: COLORS.darkGray,
    fontWeight: 'bold',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },

  modalImageContainer: {
    position: 'relative',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
  },

  modalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
  },

  modalHeartBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  modalHeartText: {
    fontSize: 20,
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  detailCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
  },

  detailValue: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: 'bold',
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },

  descriptionText: {
    fontSize: 15,
    color: COLORS.darkGray,
    lineHeight: 22,
    marginBottom: 25,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },

  favoriteButton: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  favoriteButtonText: {
    fontSize: 24,
  },

  adoptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  adoptButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});