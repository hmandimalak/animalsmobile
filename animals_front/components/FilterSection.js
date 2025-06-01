import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import styles from './styles';
import { Ionicons } from '@expo/vector-icons';


const speciesOptions = {
  chien: [
    "Berger Allemand", "Labrador Retriever", "Golden Retriever", "Bulldog",
    "Rottweiler", "Husky Sibérien", "Beagle", "Caniche", "Chihuahua",
    "Yorkshire Terrier", "Autre"
  ],
  chat: [
    "Persan", "Siamois", "Maine Coon", "Bengal", "British Shorthair", "Ragdoll",
    "Sphynx", "Abyssin", "Sacré de Birmanie", "Européen", "Autre"
  ]
};

const ageOptions = [
  { value: '', label: 'Tous les âges' },
  { value: 'puppy', label: 'Chiot/Chaton (<1 an)' },
  { value: 'young', label: 'Jeune (1-3 ans)' },
  { value: 'adult', label: 'Adulte (3-8 ans)' },
  { value: 'senior', label: 'Senior (8+ ans)' }
];

const FilterSection = ({
  animalType, setAnimalType,
  species, setSpecies,
  age, setAge,
  sexe, setSexe,
  fetchAnimals
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  const handleClearFilter = (filterType) => {
    switch(filterType) {
      case 'type':
        setAnimalType('');
        setSpecies('');
        break;
      case 'race':
        setSpecies('');
        break;
      case 'age':
        setAge('');
        break;
      case 'sexe':
        setSexe('');
        break;
      default:
        break;
    }
    fetchAnimals();
  };

  const getTypeDisplay = () => {
    if (!animalType) return 'Type';
    return animalType === 'chien' ? '🐶 Chien' : '🐱 Chat';
  };

  const getRaceDisplay = () => {
    if (!species) return 'Race';
    return species.length > 12 ? `${species.substring(0, 10)}...` : species;
  };

  const getAgeDisplay = () => {
    if (!age) return 'Âge';
    const option = ageOptions.find(o => o.value === age);
    return option ? option.label.replace('Tous les âges', 'Âge') : 'Âge';
  };

  const getSexeDisplay = () => {
    if (!sexe) return 'Sexe';
    return sexe === 'M' ? 'Mâle' : 'Femelle';
  };

  const renderFilterButton = (type, display) => (
    <TouchableOpacity
      style={[
        styles.filterPill,
        (type === 'type' && animalType) ||
        (type === 'race' && species) ||
        (type === 'age' && age) ||
        (type === 'sexe' && sexe) ? styles.activePill : null
      ]}
      onPress={() => {
        if (type === 'race' && !animalType) {
          setActiveFilter('type');
        } else {
          setActiveFilter(type);
        }
        setModalVisible(true);
      }}
    >
      <Text style={styles.filterPillText}>{display}</Text>
      {((type === 'type' && animalType) ||
       (type === 'race' && species) ||
       (type === 'age' && age) ||
       (type === 'sexe' && sexe)) && (
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            handleClearFilter(type);
          }}
          style={styles.clearIcon}
        >
          <Ionicons name="close" size={14} color="#8E54E9" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderOptionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeFilter === 'type' && 'Type d\'animal'}
              {activeFilter === 'race' && 'Race'}
              {activeFilter === 'age' && 'Âge'}
              {activeFilter === 'sexe' && 'Sexe'}
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#8E54E9" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {activeFilter === 'type' && (
              <>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setAnimalType('');
                    setSpecies('');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>Tous les animaux</Text>
                  {!animalType && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setAnimalType('chien');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>🐶 Chien</Text>
                  {animalType === 'chien' && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setAnimalType('chat');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>🐱 Chat</Text>
                  {animalType === 'chat' && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
              </>
            )}

            {activeFilter === 'race' && (
              <>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setSpecies('');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>Toutes les races</Text>
                  {!species && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
                
                {animalType && speciesOptions[animalType].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionItem}
                    onPress={() => {
                      setSpecies(opt);
                      setModalVisible(false);
                      fetchAnimals();
                    }}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                    {species === opt && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {activeFilter === 'age' && (
              <>
                {ageOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.optionItem}
                    onPress={() => {
                      setAge(opt.value);
                      setModalVisible(false);
                      fetchAnimals();
                    }}
                  >
                    <Text style={styles.optionText}>{opt.label}</Text>
                    {age === opt.value && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {activeFilter === 'sexe' && (
              <>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setSexe('');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>Tous</Text>
                  {!sexe && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setSexe('M');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>Mâle</Text>
                  {sexe === 'M' && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setSexe('F');
                    setModalVisible(false);
                    fetchAnimals();
                  }}
                >
                  <Text style={styles.optionText}>Femelle</Text>
                  {sexe === 'F' && <Ionicons name="checkmark" size={20} color="#8E54E9" />}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {renderFilterButton('type', getTypeDisplay())}
        {renderFilterButton('race', getRaceDisplay())}
        {renderFilterButton('age', getAgeDisplay())}
        {renderFilterButton('sexe', getSexeDisplay())}
      </ScrollView>
      
      {renderOptionsModal()}
    </>
  );
};

export default FilterSection;