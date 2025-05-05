import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { getThemeColors } from '@/constants/Colors';
import { BRANDS, types, subtypesByType } from '@/constants/Clothes';
import { ClothingItem } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n/useTranslation';

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
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

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
        <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            {t('clothing.existingItemFound')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.light }]}>
            {t('clothing.useExistingItemInfo')}
          </Text>
          <View style={[styles.itemPreview, { backgroundColor: colors.gray }]}>
            <Image 
              source={{ uri: existingItem.image_url }} 
              style={styles.previewImage}
            />
            <View style={styles.previewDetails}>
              <Text style={[styles.previewName, { color: colors.text.main }]}>
                {existingItem.name}
              </Text>
              <Text style={[styles.previewInfo, { color: colors.text.light }]}>
                {String(BRANDS[existingItem.brand as keyof typeof BRANDS] || existingItem.brand)} • {getTypeLabel(existingItem.type)}
              </Text>
              <Text style={[styles.previewSubtype, { color: colors.text.light }]}>
                {getSubtypeLabel(existingItem.type, existingItem.subtype)}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle2, { color: colors.primary.main }]}>
            {t('clothing.willReplaceInfo')}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.rejectButton, { backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5' }]} 
              onPress={onReject}
            >
              <Text style={[styles.rejectButtonText, { color: colors.text.light }]}>
                {t('clothing.reject')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary.main }]} 
              onPress={onAccept}
            >
              <Text style={[styles.acceptButtonText, { color: colors.white }]}>
                {t('clothing.accept')}
              </Text>
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
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle2: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemPreview: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  previewInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  previewSubtype: {
    fontSize: 14,
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
  },
  acceptButton: {
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReferenceSuggestionModal; 