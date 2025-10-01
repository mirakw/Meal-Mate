import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddRecipeScreenProps {
  navigation: any;
}

export const AddRecipeScreen: React.FC<AddRecipeScreenProps> = ({ navigation }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('4');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const { user } = useAuth();

  const extractFromUrl = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a recipe URL');
      return;
    }

    setExtracting(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/extract-recipe`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract recipe');
      }

      setTitle(data.name || '');
      if (data.serving_size) {
        const match = data.serving_size.match(/\d+/);
        if (match) setServings(match[0]);
      }
      setIngredients(data.ingredients || ['']);
      setInstructions(data.instructions || ['']);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    const validIngredients = ingredients.filter((i) => i.trim());
    const validInstructions = instructions.filter((i) => i.trim());

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (validInstructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('recipes').insert({
        user_id: user!.id,
        title,
        url: url || null,
        servings: parseInt(servings) || 4,
        ingredients: validIngredients,
        instructions: validInstructions,
      });

      if (error) throw error;

      Alert.alert('Success', 'Recipe saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const addInstruction = () => setInstructions([...instructions, '']);

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extract from URL</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste recipe URL here"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.extractButton, extracting && styles.buttonDisabled]}
          onPress={extractFromUrl}
          disabled={extracting}
        >
          {extracting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Extract Recipe</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipe Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Recipe Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Servings"
          value={servings}
          onChangeText={setServings}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <TouchableOpacity onPress={addIngredient}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder={`Ingredient ${index + 1}`}
              value={ingredient}
              onChangeText={(value) => updateIngredient(index, value)}
            />
            {ingredients.length > 1 && (
              <TouchableOpacity onPress={() => removeIngredient(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <TouchableOpacity onPress={addInstruction}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, styles.textArea]}
              placeholder={`Step ${index + 1}`}
              value={instruction}
              onChangeText={(value) => updateInstruction(index, value)}
              multiline
            />
            {instructions.length > 1 && (
              <TouchableOpacity onPress={() => removeInstruction(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Recipe</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputFlex: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  extractButton: {
    backgroundColor: '#48bb78',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addText: {
    color: '#3182ce',
    fontSize: 14,
    fontWeight: '600',
  },
  removeText: {
    color: '#f56565',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
});
