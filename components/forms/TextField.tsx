import React, { forwardRef } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';

interface TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: TName;
  control: Control<TFieldValues>;
  label?: string;
  error?: string | undefined;
  required?: boolean;
}

function TextFieldComponent<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  {
    name,
    control,
    label,
    error,
    required = false,
    style,
    ...textInputProps
  }: TextFieldProps<TFieldValues, TName>,
  ref: React.Ref<TextInput>
) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={ref}
            style={[
              styles.input,
              error ? styles.inputError : null,
              style,
            ]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor="#9CA3AF"
            {...textInputProps}
          />
        )}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const TextField = forwardRef(TextFieldComponent) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: TextFieldProps<TFieldValues, TName> & { ref?: React.Ref<TextInput> }
) => React.ReactElement;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TextField;