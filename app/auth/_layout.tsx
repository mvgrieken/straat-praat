import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Inloggen',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{
          title: 'Registreren',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{
          title: 'Wachtwoord Vergeten',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="update-password" 
        options={{
          title: 'Wachtwoord Bijwerken',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="callback" 
        options={{
          title: 'Authenticatie',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}