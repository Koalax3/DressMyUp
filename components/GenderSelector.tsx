import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { genders } from '@/constants/Outfits';

type GenderSelectorProps = {
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  containerStyle?: object;
};

const GenderSelector: React.FC<GenderSelectorProps> = ({
  selectedGender,
  onGenderChange,
  containerStyle
}) => {
  return (
    <View style={[styles.genderContainer, containerStyle]}>
      <TouchableOpacity
        style={[styles.genderButton, selectedGender === 'male' && styles.genderButtonActive]}
        onPress={() => onGenderChange('male')}
      >
        <Ionicons name="male-outline" size={18} color={selectedGender === 'male' ? "#fff" : "#666"} />
        <Text style={[styles.genderButtonText, selectedGender === 'male' && styles.genderButtonTextActive]}>
          {genders['male']}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.genderButton, selectedGender === 'female' && styles.genderButtonActive]}
        onPress={() => onGenderChange('female')}
      >
        <Ionicons name="female-outline" size={18} color={selectedGender === 'female' ? "#fff" : "#666"} />
        <Text style={[styles.genderButtonText, selectedGender === 'female' && styles.genderButtonTextActive]}>
          {genders['female']}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.genderButton, selectedGender === 'unisex' && styles.genderButtonActive]}
        onPress={() => onGenderChange('unisex')}
      >
        <Ionicons name="people-outline" size={18} color={selectedGender === 'unisex' ? "#fff" : "#666"} />
        <Text style={[styles.genderButtonText, selectedGender === 'unisex' && styles.genderButtonTextActive]}>
          {genders['unisex']}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '31%',
    marginHorizontal: '1%',
  },
  genderButtonActive: {
    backgroundColor: '#F97A5C',
  },
  genderButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  genderButtonTextActive: {
    color: '#fff',
  },
});

export default GenderSelector; 