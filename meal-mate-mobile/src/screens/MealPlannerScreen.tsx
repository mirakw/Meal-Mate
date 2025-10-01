import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { MealPlanWithRecipe, Recipe } from '../types/database';

interface MealPlannerScreenProps {
  navigation: any;
}

export const MealPlannerScreen: React.FC<MealPlannerScreenProps> = ({ navigation }) => {
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mealPlansResponse, recipesResponse] = await Promise.all([
        supabase
          .from('meal_plans')
          .select('*, recipe:recipes(*)')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date'),
        supabase.from('recipes').select('*').order('title'),
      ]);

      if (mealPlansResponse.error) throw mealPlansResponse.error;
      if (recipesResponse.error) throw recipesResponse.error;

      setMealPlans(mealPlansResponse.data as any || []);
      setRecipes(recipesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMealPlan = async (recipeId: string) => {
    try {
      const { error } = await supabase.from('meal_plans').insert({
        recipe_id: recipeId,
        date: selectedDate,
        meal_type: selectedMealType,
      });

      if (error) throw error;

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const removeMealPlan = async (mealPlanId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealPlans.filter((mp) => mp.date === dateStr);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const openAddMealModal = (date: Date, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedMealType(mealType);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  const days = getNextDays(7);

  return (
    <View style={styles.container}>
      <ScrollView>
        {days.map((day) => {
          const meals = getMealsForDate(day);
          const breakfast = meals.find((m) => m.meal_type === 'breakfast');
          const lunch = meals.find((m) => m.meal_type === 'lunch');
          const dinner = meals.find((m) => m.meal_type === 'dinner');

          return (
            <View key={day.toISOString()} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{formatDate(day)}</Text>

              <View style={styles.mealSlot}>
                <Text style={styles.mealType}>Breakfast</Text>
                {breakfast ? (
                  <TouchableOpacity
                    style={styles.mealItem}
                    onLongPress={() => removeMealPlan(breakfast.id)}
                  >
                    <Text style={styles.mealName}>{breakfast.recipe.title}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addMealButton}
                    onPress={() => openAddMealModal(day, 'breakfast')}
                  >
                    <Text style={styles.addMealText}>+ Add meal</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.mealSlot}>
                <Text style={styles.mealType}>Lunch</Text>
                {lunch ? (
                  <TouchableOpacity
                    style={styles.mealItem}
                    onLongPress={() => removeMealPlan(lunch.id)}
                  >
                    <Text style={styles.mealName}>{lunch.recipe.title}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addMealButton}
                    onPress={() => openAddMealModal(day, 'lunch')}
                  >
                    <Text style={styles.addMealText}>+ Add meal</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.mealSlot}>
                <Text style={styles.mealType}>Dinner</Text>
                {dinner ? (
                  <TouchableOpacity
                    style={styles.mealItem}
                    onLongPress={() => removeMealPlan(dinner.id)}
                  >
                    <Text style={styles.mealName}>{dinner.recipe.title}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addMealButton}
                    onPress={() => openAddMealModal(day, 'dinner')}
                  >
                    <Text style={styles.addMealText}>+ Add meal</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Recipe</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recipeOption}
                  onPress={() => addMealPlan(item.id)}
                >
                  <Text style={styles.recipeOptionText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No recipes available. Add recipes first!
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  mealSlot: {
    marginBottom: 12,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 6,
  },
  mealItem: {
    backgroundColor: '#e6fffa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38b2ac',
  },
  mealName: {
    fontSize: 16,
    color: '#2d3748',
  },
  addMealButton: {
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addMealText: {
    fontSize: 14,
    color: '#3182ce',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    fontSize: 16,
    color: '#3182ce',
  },
  recipeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  recipeOptionText: {
    fontSize: 16,
    color: '#2d3748',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 40,
    fontSize: 16,
  },
});
