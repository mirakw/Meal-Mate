import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import { AuthScreen } from '../screens/AuthScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { AddRecipeScreen } from '../screens/AddRecipeScreen';
import { FoldersScreen } from '../screens/FoldersScreen';
import { MealPlannerScreen } from '../screens/MealPlannerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const RecipesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="RecipesList"
      component={RecipesScreen}
      options={{ title: 'Recipes' }}
    />
    <Stack.Screen
      name="RecipeDetail"
      component={RecipeDetailScreen}
      options={{ title: 'Recipe Details' }}
    />
    <Stack.Screen
      name="AddRecipe"
      component={AddRecipeScreen}
      options={{ title: 'Add Recipe' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { signOut } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: '#718096',
      }}
    >
      <Tab.Screen
        name="RecipesTab"
        component={RecipesStack}
        options={{
          title: 'Recipes',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Folders"
        component={FoldersScreen}
        options={{
          title: 'Folders',
        }}
      />
      <Tab.Screen
        name="MealPlanner"
        component={MealPlannerScreen}
        options={{
          title: 'Meal Planner',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePlaceholder}
        options={{
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
              <Text style={{ color: '#3182ce', fontSize: 16 }}>Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const ProfilePlaceholder = () => {
  const { user } = useAuth();
  return (
    <Text style={{ padding: 20, fontSize: 16 }}>
      Logged in as: {user?.email}
    </Text>
  );
};

export const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
};
