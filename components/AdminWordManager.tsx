import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Word, ApiResponse } from '@/types';
import { WordService } from '@/services/wordService';
import { supabase } from '@/services/supabase';

interface WordFormData {
  slang_word: string;
  dutch_meaning: string;
  example_sentence: string;
  category: string;
  difficulty_level: number;
}

export default function AdminWordManager() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState<WordFormData>({
    slang_word: '',
    dutch_meaning: '',
    example_sentence: '',
    category: 'general',
    difficulty_level: 1,
  });

  const categories = [
    'all',
    'general',
    'gaming',
    'social',
    'fashion',
    'music',
    'sports',
    'school',
    'technology',
  ];

  useEffect(() => {
    loadWords();
  }, [selectedCategory, searchQuery]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const response = await WordService.getWords({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        limit: 100,
      });

      if (response.success && response.data) {
        setWords(response.data.data);
      }
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Error', 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    try {
      if (!formData.slang_word || !formData.dutch_meaning) {
        Alert.alert('Error', 'Slang word and Dutch meaning are required');
        return;
      }

      const { error } = await supabase
        .from('words')
        .insert([{
          ...formData,
          is_active: true,
        }]);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Word added successfully');
      setShowAddModal(false);
      resetForm();
      loadWords();
    } catch (error) {
      console.error('Error adding word:', error);
      Alert.alert('Error', 'Failed to add word');
    }
  };

  const handleEditWord = async () => {
    try {
      if (!editingWord || !formData.slang_word || !formData.dutch_meaning) {
        Alert.alert('Error', 'Slang word and Dutch meaning are required');
        return;
      }

      const { error } = await supabase
        .from('words')
        .update(formData)
        .eq('id', editingWord.id);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Word updated successfully');
      setEditingWord(null);
      resetForm();
      loadWords();
    } catch (error) {
      console.error('Error updating word:', error);
      Alert.alert('Error', 'Failed to update word');
    }
  };

  const handleDeleteWord = async (word: Word) => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to delete "${word.slang_word}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('words')
                .update({ is_active: false })
                .eq('id', word.id);

              if (error) {
                throw error;
              }

              Alert.alert('Success', 'Word deleted successfully');
              loadWords();
            } catch (error) {
              console.error('Error deleting word:', error);
              Alert.alert('Error', 'Failed to delete word');
            }
          },
        },
      ]
    );
  };

  const startEdit = (word: Word) => {
    setEditingWord(word);
    setFormData({
      slang_word: word.slang_word,
      dutch_meaning: word.dutch_meaning,
      example_sentence: word.example_sentence || '',
      category: word.category,
      difficulty_level: word.difficulty_level,
    });
  };

  const resetForm = () => {
    setFormData({
      slang_word: '',
      dutch_meaning: '',
      example_sentence: '',
      category: 'general',
      difficulty_level: 1,
    });
  };

  const renderWordItem = (word: Word) => (
    <View key={word.id} style={styles.wordItem}>
      <View style={styles.wordHeader}>
        <Text style={styles.slangWord}>{word.slang_word}</Text>
        <View style={styles.wordActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => startEdit(word)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteWord(word)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.dutchMeaning}>{word.dutch_meaning}</Text>
      {word.example_sentence && (
        <Text style={styles.example}>Example: {word.example_sentence}</Text>
      )}
      <View style={styles.wordMeta}>
        <Text style={styles.category}>{word.category}</Text>
        <Text style={styles.difficulty}>Level {word.difficulty_level}</Text>
      </View>
    </View>
  );

  const renderWordForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingWord ? 'Edit Word' : 'Add New Word'}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Slang Word *"
        value={formData.slang_word}
        onChangeText={(text) => setFormData({ ...formData, slang_word: text })}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Dutch Meaning *"
        value={formData.dutch_meaning}
        onChangeText={(text) => setFormData({ ...formData, dutch_meaning: text })}
      />
      
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Example Sentence"
        value={formData.example_sentence}
        onChangeText={(text) => setFormData({ ...formData, example_sentence: text })}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.slice(1).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                formData.category === category && styles.selectedCategoryChip,
              ]}
              onPress={() => setFormData({ ...formData, category })}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.category === category && styles.selectedCategoryChipText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Difficulty Level:</Text>
        <View style={styles.difficultyContainer}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                formData.difficulty_level === level && styles.selectedDifficultyButton,
              ]}
              onPress={() => setFormData({ ...formData, difficulty_level: level })}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  formData.difficulty_level === level && styles.selectedDifficultyButtonText,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.formButton, styles.cancelButton]}
          onPress={() => {
            setShowAddModal(false);
            setEditingWord(null);
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formButton, styles.saveButton]}
          onPress={editingWord ? handleEditWord : handleAddWord}
        >
          <Text style={styles.saveButtonText}>
            {editingWord ? 'Update' : 'Add'} Word
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Word Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Word</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.selectedFilterChip,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.selectedFilterChipText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Words List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading words...</Text>
        </View>
      ) : (
        <ScrollView style={styles.wordsList}>
          {words.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No words found</Text>
            </View>
          ) : (
            words.map(renderWordItem)
          )}
        </ScrollView>
      )}

      {/* Add Word Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {renderWordForm()}
        </View>
      </Modal>

      {/* Edit Word Modal */}
      <Modal
        visible={editingWord !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {renderWordForm()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filters: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  selectedFilterChip: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  wordsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
  },
  wordItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slangWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  wordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dutchMeaning: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  example: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  wordMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 12,
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  difficulty: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  selectedCategoryChip: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDifficultyButton: {
    backgroundColor: '#3B82F6',
  },
  difficultyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedDifficultyButtonText: {
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
