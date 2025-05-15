import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  colors: {
    text: {
      main: string;
    };
    primary: {
      main: string;
    };
  };
  initiallyOpen?: boolean;
}

const Accordion = ({ 
  title,
  children,
  colors,
  initiallyOpen = false
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={[styles.accordionTitle, { color: colors.text.main }]}>
          {title}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-down" : "chevron-forward"} 
          size={24} 
          color={colors.primary.main} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  accordionContainer: {
    marginTop: 20,
    borderRadius: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accordionContent: {
    paddingTop: 5,
  },
});

export default Accordion; 