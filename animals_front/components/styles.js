// styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // —— Container & Background
  container: {
  flex: 1,
  backgroundColor: 'white',
  paddingBottom: 70, // Add bottom padding to prevent content from being hidden
},

  // —— Header
 // In styles.js:
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


  // —— Search & Filter
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    fontSize: 16,
    color: '#5A5560',
    borderWidth: 1,
    borderColor: '#F1E6FA',
    shadowColor: '#E8E5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    position: 'absolute',
    left: 34,
    zIndex: 1,
  },
  searchButton: {
    marginLeft: 12,
    width: 20,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C5A8FF',         // blush pink
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FSD9E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },

 // Add to styles.js
  // —— Compact Filter Styles
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FF',
    shadowColor: '#E8E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    marginRight: 10,
    height: 36,
  },
  activePill: {
    backgroundColor: '#F0E6FF',
    borderColor: '#C5A8FF',
  },
  filterPillText: {
    color: '#BFA2DB',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  clearIcon: {
    padding: 2,
  },
  
  // —— Bottom Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF5FB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    width: '100%', // Full width of screen
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E6FA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E54E9',
  },
  modalContent: {
    paddingHorizontal: 20, // Horizontal padding for content
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20, // Horizontal padding for items
    width: '100%', // Full width of parent
  },
  optionText: {
    fontSize: 16,
    color: '#5A5560',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F1E6FA',
    borderRadius: 20,
  },
  // —— Animal grid & cards
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
card: {
  flex: 1,
  margin: 8,
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  overflow: 'hidden',
  maxWidth: '47%',
  aspectRatio: 0.9,

  shadowColor: '#E8E5FF',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 3,
},

  image: {
    width: '100%',
    height: '100%',           // <-- now fills the entire card container
  },
  favoriteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 6,
  },
  info: {
    padding: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A5560',
  },
  breed: {
    fontSize: 14,
    color: '#BFA2DB',
    marginTop: 2,
  },
  
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 8,
  },

  // —— Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E54E9',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8E54E9',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#BFA2DB',
    marginTop: 4,
  },

  // —— Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF5FB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#BDDDFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A89A7',
  },
  modalFavorite: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalText: {
    fontSize: 18,
    marginLeft: 12,
    color: '#6A89A7',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A89A7',
    marginTop: 22,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6A89A7',
    lineHeight: 26,
    marginBottom: 28,
  },
  adoptButton: {
    backgroundColor: '#6A89A7',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FCE4EC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  adoptButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
 // Add to styles.js
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
  // Add to styles.js
messageModal: {
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 25,
  width: '80%',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
messageModalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
},
messageModalText: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 20,
  color: '#333',
},
messageModalButton: {
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 10,
  marginTop: 10,
},
messageModalButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
});
