import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ColorsTheme } from '@/constants/Colors';
import { BRANDS, types, subtypesByType } from '@/constants/Clothes';
import { ClothingItem } from '@/types';

type ReferenceSuggestionModalProps = {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  existingItem: ClothingItem | null;
};

const ReferenceSuggestionModal: React.FC<ReferenceSuggestionModalProps> = ({
  visible,
  onClose,
  onAccept,
  onReject,
  existingItem
}) => {
  if (!existingItem) return null;

  const getTypeLabel = (type: string) => {
    return String(types[type as keyof typeof types] || type);
  };

  const getSubtypeLabel = (type: string, subtype: string) => {
    const subtypes = subtypesByType[type as keyof typeof subtypesByType];
    return String(subtypes ? subtypes[subtype as keyof typeof subtypes] || subtype : subtype);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Vêtement existant trouvé</Text>
          <Text style={styles.subtitle}>
            Voulez-vous utiliser ses informations ?
          </Text>
          <View style={styles.itemPreview}>
            <Image 
              source={{ uri: existingItem.image_url }} 
              style={styles.previewImage}
            />
            <View style={styles.previewDetails}>
              <Text style={styles.previewName}>{existingItem.name}</Text>
              <Text style={styles.previewInfo}>
                {String(BRANDS[existingItem.brand as keyof typeof BRANDS] || existingItem.brand)} • {getTypeLabel(existingItem.type)}
              </Text>
              <Text style={styles.previewSubtype}>
                {getSubtypeLabel(existingItem.type, existingItem.subtype)}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle2}>
            Cela remplacera les informations que vous avez renseignées.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.rejectButton]} 
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]} 
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle2: {
    fontSize: 14,
    color: ColorsTheme.primary.main,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemPreview: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  previewInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  previewSubtype: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
  },
  acceptButton: {
    backgroundColor: ColorsTheme.primary.main,
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReferenceSuggestionModal; 