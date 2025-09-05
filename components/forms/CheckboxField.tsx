import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';


interface CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  error?: string | undefined;
  required?: boolean;
}

export default function CheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  error,
  required = false,
}: CheckboxFieldProps<TFieldValues, TName>) {
  return (
    <View style={styles.container}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => onChange(!value)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  label: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  required: {
    color: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 32,
  },
});
