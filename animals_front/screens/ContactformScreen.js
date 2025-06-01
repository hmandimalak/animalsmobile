import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'tailwind-react-native-classnames';
import { MaterialIcons } from '@expo/vector-icons';

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    console.log('[DEBUG] Retrieved token:', token ? 'Token exists' : 'No token');
    return token ? `Bearer ${token}` : null;
  } catch (error) {
    console.error('[ERROR] Error retrieving auth token:', error);
    return null;
  }
};

const ContactPage = ({ visible, onClose }) => {
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    loading: true,
  });

  // 🔁 Fetch user email when modal opens
  useEffect(() => {
    const fetchEmail = async () => {
      const token = await getAuthToken();
      if (!token) {
        setStatus((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch('http://192.168.0.132:8000/api/auth/user/', {
          method: 'GET',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUserEmail(userData.email || '');
        } else {
          console.warn('[WARN] Failed to fetch user email');
        }
      } catch (error) {
        console.error('[ERROR] Fetch user email failed:', error);
      } finally {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    if (visible) {
      fetchEmail();
    }
  }, [visible]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setStatus({ ...status, submitting: true, error: null });

    try {
      const token = await getAuthToken();
      const response = await fetch('http://192.168.0.132:8000/api/auth/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          ...formData,
          email: userEmail || 'utilisateur@exemple.com',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Erreur lors de l’envoi');
      }

      setStatus({ submitting: false, submitted: true, error: null });
      setFormData({ name: '', message: '' });

      setTimeout(() => {
        onClose();
        setStatus({ submitting: false, submitted: false, error: null });
      }, 3000);
    } catch (err) {
      setStatus({ ...status, submitting: false, error: err.message });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-11/12 rounded-xl p-6`}>
          <TouchableOpacity onPress={onClose} style={tw`absolute top-2 right-2`}>
            <MaterialIcons name="close" size={24} color="gray" />
          </TouchableOpacity>

          <Text style={tw`text-xl font-bold text-pastel-blue text-center mb-4`}>
            Contactez-nous
          </Text>

          {status.loading ? (
            <ActivityIndicator size="large" color="#4a90e2" />
          ) : status.submitted ? (
            <View style={tw`py-8 items-center`}>
              <Text style={tw`text-lg text-pastel-green font-semibold mb-2`}>
                Message envoyé !
              </Text>
              <Text>Merci de nous avoir contacté. Nous vous répondrons rapidement.</Text>
            </View>
          ) : (
            <ScrollView>
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 mb-1`}>Nom</Text>
                <TextInput
                  style={tw`border border-gray-300 rounded px-4 py-2`}
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Votre nom"
                />
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 mb-1`}>Email</Text>
                <TextInput
                  style={tw`border border-gray-300 rounded px-4 py-2 bg-gray-100`}
                  value={userEmail || 'utilisateur@exemple.com'}
                  editable={false}
                />
                <Text style={tw`text-xs text-gray-500 mt-1`}>
                  Email associé à votre compte
                </Text>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 mb-1`}>Votre question</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={tw`border border-gray-300 rounded px-4 py-2 h-28 text-left text-base`}
                  value={formData.message}
                  onChangeText={(text) => handleChange('message', text)}
                  placeholder="Votre message"
                />
              </View>

              {status.error && (
                <Text style={tw`text-red-500 mb-4 text-sm`}>{status.error}</Text>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={status.submitting}
                style={tw`bg-pastel-green py-3 rounded-full items-center`}
              >
                {status.submitting ? (
                  <ActivityIndicator color="#F5F5DC" />
                ) : (
                  <Text style={tw`text-black font-bold`}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ContactPage;
