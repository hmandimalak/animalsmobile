import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import api from '../android/app/api';
const colors = {
  primary: '#4DB6AC',  // Teal color from the image
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#333333',
  lightGray: '#EAEAEA',
  mediumGray: '#9E9E9E',
  red: '#FF5252',
};


export default function CommandesScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    api.fetchOrders()
      .then(data => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      {orders.length
        ? orders.map(o => <OrderCard key={o.id} order={o} />)
        : <Text>Aucune commande trouvée.</Text>
      }
    </ScrollView>
  );
}
