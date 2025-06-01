// NotificationPopup.js
import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native'; // ✅ Added Text import
import { FontAwesome } from '@expo/vector-icons';
import NotificationsScreen from './NotificationsScreen';
import tw from 'tailwind-react-native-classnames';

export default function NotificationPopup() {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      {/* Bell icon */}
      <TouchableOpacity onPress={() => setVisible(true)}>
        <FontAwesome name="bell" size={24} color="#333" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View style={[tw`bg-white rounded-t-3xl p-6 pb-10`, { maxHeight: '80%' }]}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center mb-6 px-4`}>
              <Text style={tw`text-xl font-bold`}>Notifications</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <FontAwesome name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Notification content */}
            <NotificationsScreen />
          </View>
        </View>
      </Modal>
    </View>
  );
}
  