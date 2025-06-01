import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import Collapsible from 'react-native-collapsible';
import ContactPage from './ContactformScreen';
const colors = {
  primary: '#e899a3', // pastel pink from the design
  secondary: '#f6e6e8', // light pink background
  dark: '#333333',
  white: '#FFFFFF',
  gray: '#AAAAAA',
  lightGray: '#EEEEEE',
  error: '#FF6B6B',
  success: '#4CAF50',
};

// Mock FAQ Data
const faqCategories = [
  {
    title: "Adoption Gratuite",
    icon: "paw",
    questions: [
      {
        question: "Comment fonctionne l'adoption gratuite ?",
        answer:
          "Notre modèle unique est financé par la boutique. Vous payez seulement les frais vétérinaires de base (vaccins). L'adoption elle-même est totalement gratuite !",
      },
      {
        question: "Puis-je adopter si je vis en appartement ?",
        answer:
          "Oui ! Nous sélectionnons des animaux adaptés à chaque mode de vie. Nos conseillers vous aideront à trouver le compagnon idéal pour votre logement.",
      },
    ],
  },
  {
    title: "Soins en Refuge",
    icon: "favorite",
    questions: [
      {
        question: "Comment sont soignés les animaux dans le refuge ?",
        answer:
          "Nos protocoles incluent :\n• Bilan santé complet à l'arrivée\n• Vermifuge/parasitage systématique\n• Alimentation premium adaptée\n• Enrichissement environnemental quotidien",
      },
      {
        question: "Puis-je venir rendre visite à un animal spécifique ?",
        answer:
          "Absolument ! Contactez-nous pour prendre rendez-vous. Nous encourageons les rencontres multiples avant l'adoption.",
      },
    ],
  },
  {
    title: "Boutique Solidaire",
    icon: "local-shipping",
    questions: [
      {
        question: "Où va l'argent des achats ?",
        answer:
          "100% des bénéfices sont répartis ainsi :\n• 70% nourriture et soins animaux\n• 20% amélioration des refuges\n• 10% campagnes de stérilisation",
        link: {
          text: "Voir notre rapport financier",
          url: "/transparence",
        },
      },
      {
        question: "Livrez-vous dans toute la Tunisie ?",
        answer:
          "Oui ! Nous livrons partout en Tunisie continentale sous 3-5 jours ouvrables. Les frais de port sont fixes à 7 TND quel que soit le poids.",
      },
    ],
  },
  {
    title: "Événements & Activités",
    icon: "directions-walk",
    questions: [
      {
        question: "Les enfants peuvent-ils participer aux marches canines ?",
        answer:
          "À partir de 6 ans, sous supervision parentale. Nous fournissons des harnais adaptés et organisons des ateliers éducatifs.",
      },
    ],
  },
  {
    title: "Dons & Bénévolat",
    icon: "volunteer-activity",
    questions: [
      {
        question: "Comment aider sans adopter ?",
        answer:
          "Plusieurs options :\n• Parrainage d'un animal\n• Don de matériel\n• Bénévolat ponctuel\n• Achat en boutique",
      },
    ],
  },
  {
    title: "Support Émotionnel",
    icon: "heart-broken",
    questions: [
      {
        question: "Proposez-vous un suivi post-adoption ?",
        answer:
          "Oui, notre équipe reste disponible 24h/24 via notre hotline dédiée pendant les 3 premiers mois.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const navigation = useNavigation();

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

<ContactPage
  visible={showContactForm}
  onClose={() => setShowContactForm(false)}
  
/>


  return (
    <SafeAreaView style={tw`flex-1 bg-gradient-to-b from-pastel-blue via-pastel-blue/30 to-white`}>
           
      <View style={tw`p-4 bg-white shadow-md`}>
         <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
        <Text style={tw`text-2xl font-bold text-pastel-blue text-center`}>Foire Aux Questions</Text>
      </View>

      <View style={tw`absolute top-20 right-4 opacity-10`}>
        <MaterialIcons name="pets" size={60} color="#4a90e2" />
      </View>
      <View style={tw`absolute bottom-40 left-5 opacity-10`}>
        <MaterialIcons name="cat" size={80} color="#1F2937" />
      </View>
      <View style={tw`absolute top-60 right-1/4 opacity-10`}>
        <MaterialIcons name="paw-print" size={50} color="#4a90e2" />
      </View>

      <ScrollView style={tw`flex-1 p-4`}>
        {faqCategories.map((category, catIndex) => (
          <View
            key={catIndex}
            style={tw`bg-white rounded-xl shadow-lg p-4 mb-4`}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <MaterialIcons name={category.icon} size={24} color="#4a90e2" />
              <Text style={tw`ml-2 text-lg font-bold text-pastel-blue`}>{category.title}</Text>
            </View>
            {category.questions.map((q, idx) => (
              <View key={idx}>
                <TouchableOpacity
                  onPress={() => toggleAnswer(idx)}
                  style={tw`flex-row justify-between items-center py-3 border-b border-gray-200`}
                >
                  <Text style={tw`font-medium text-gray-800`}>{q.question}</Text>
                  <MaterialIcons
                    name={openIndex === idx ? 'expand-less' : 'expand-more'}
                    size={20}
                    color="#4a90e2"
                  />
                </TouchableOpacity>
                <Collapsible collapsed={openIndex !== idx}>
                  <Text style={tw`py-2 text-gray-600 ml-4`}>{q.answer}</Text>
                </Collapsible>
              </View>
            ))}
          </View>
        ))}

        <View style={tw`bg-pastel-blue/20 p-6 rounded-xl my-6`}>
          <Text style={tw`text-lg font-bold text-pastel-blue text-center mb-2`}>
            Vous avez une autre question ?
          </Text>
          <Text style={tw`text-center mb-4`}>Notre équipe répond sous 24h !</Text>
          <TouchableOpacity
            onPress={() => setShowContactForm(true)}
            style={tw`bg-gradient-to-r from-pastel-green to-white py-3 px-6 rounded-full self-center flex-row items-center`}
          >
            <Text style={tw`text-pastel-blue font-bold`}>Contacter nous</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ContactPage visible={showContactForm} onClose={() => setShowContactForm(false)} userEmail={"utilisateur@exemple.com"} />

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({

  backButton: {
    padding: 4,
  },})
