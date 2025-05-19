import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SidebarScreen from '../screens/SidebarScreen';
import NosAnimauxScreen from '../screens/NosanimauxScreen';
import CreateAnimalScreen from '../screens/CreateAnimalScreen';
import BoutiqueScreen from '../screens/BoutiqueScreen';
import PanierScreen from '../screens/PanierScreen';
import CommandeScreen from '../screens/CommandeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TemporaireScreen from '../screens/TemporaireScreen';
import DefinitiveScreen from '../screens/DefinitiveScreen';
import AdoptionsScreen from '../screens/AdoptionsScreen';
import MescommandesScreen from '../screens/MescommandesScreen';



const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Nosanimaux" 
          component={NosAnimauxScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Sidebar" 
          component={SidebarScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Garde" 
          component={CreateAnimalScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Boutique" 
          component={BoutiqueScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Panier" 
          component={PanierScreen} 
          options={{ headerShown: false }} 
        />
           <Stack.Screen 
          name="Commande" 
          component={CommandeScreen} 
          options={{ headerShown: false }} 
        />
           <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Temporaire" 
          component={TemporaireScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Definitive" 
          component={DefinitiveScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Adoptions" 
          component={AdoptionsScreen} 
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="Mescommandes" 
          component={MescommandesScreen} 
          options={{ headerShown: false }} 
        />



      </Stack.Navigator>
    </NavigationContainer>
  );
}
