import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

type EmptyWardrobeModalProps = {
  visible: boolean;
  onClose: () => void;
  closeable?: boolean;
};

const EmptyWardrobeModal = ({ visible, onClose, closeable = false }: EmptyWardrobeModalProps) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.emptyModalOverlay}>
        <View style={[styles.emptyModalContainer, { backgroundColor: colors.background.main }]}>
          <View style={styles.emptyModalHeader}>
            <Text style={[styles.emptyModalTitle, { color: colors.text.main }]}>
              {t('wardrobe.emptyWardrobe')}
            </Text>
            {closeable && <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.main} />
            </TouchableOpacity>}
          </View>
          <View style={styles.emptyModalContent}>
            <Ionicons name="shirt-outline" size={80} color={colors.primary.main} />
            <Text style={[styles.emptyModalText, { color: colors.text.light }]}>
              {t('wardrobe.addFirstItemDescription')}
            </Text>
            <TouchableOpacity 
              style={[styles.emptyModalButton, { backgroundColor: colors.primary.main }]}
              onPress={() => {
                onClose();
                router.replace('/clothing/add');
              }}
            >
              <Text style={[styles.emptyModalButtonText, { color: colors.white }]}>
                {t('clothing.add')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.emptyModalButton, { backgroundColor: colors.primary.main }]}
              onPress={() => {
                onClose();
                router.replace('/explore');
              }}
            >
              <Text style={[styles.emptyModalButtonText, { color: colors.white }]}>
              {t('wardrobe.explore')}
              </Text>
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
  },
  emptyModalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },
  emptyModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptyWardrobeModal; 