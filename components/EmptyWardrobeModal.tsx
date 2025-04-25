import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type EmptyWardrobeModalProps = {
  visible: boolean;
  onClose: () => void;
  closeable?: boolean;
};

const EmptyWardrobeModal = ({ visible, onClose, closeable = false }: EmptyWardrobeModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.emptyModalOverlay}>
        <View style={styles.emptyModalContainer}>
          <View style={styles.emptyModalHeader}>
            <Text style={styles.emptyModalTitle}>Votre garde-robe est vide</Text>
            {closeable && <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>}
          </View>
          <View style={styles.emptyModalContent}>
            <Ionicons name="shirt-outline" size={80} color="#F97A5C" />
            <Text style={styles.emptyModalText}>
              Pour créer une tenue, vous devez d'abord ajouter des vêtements à votre garde-robe.
            </Text>
            <TouchableOpacity 
              style={styles.emptyModalButton}
              onPress={() => {
                onClose();
                router.replace('/clothing/add');
              }}
            >
              <Text style={styles.emptyModalButtonText}>Ajouter un vêtement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  emptyModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  emptyModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyModalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },
  emptyModalButton: {
    backgroundColor: '#F97A5C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptyWardrobeModal; 