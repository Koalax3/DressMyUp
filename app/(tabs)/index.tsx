import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useOutfit } from '@/contexts/OutfitContext';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingButton from '@/components/FloatingButton';
import Header from '@/components/Header';
import Button from '@/components/Button';
import EmptyWardrobeModal from '@/components/EmptyWardrobeModal';
import ClothingView from '@/components/ClothingView';
import OutfitView from '@/components/OutfitView';
import { useFilter } from '@/contexts/FilterContext';

export default function WardrobeScreen() {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { isLoading, hasOutfits } = useOutfit();
  const [viewMode, setViewMode] = useState<'clothes' | 'outfits'>('clothes');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
  };

  const addItem = () => {
    if (viewMode === 'clothes') {
      router.push('/clothing/add');
    } else {
      router.push('/(tabs)/create');
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'clothes' ? 'outfits' : 'clothes');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={{ marginTop: 10, color: colors.text.main }}>Chargement de votre garde-robe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Ma Garde-robe">
        <Button 
          onPress={toggleViewMode} 
          icon={viewMode === 'clothes' ? "body" : "shirt-outline"}
          rounded
        />
      </Header>

      {viewMode === 'clothes' ? (
        <ClothingView />
      ) : (
        <OutfitView />
      )}

      <FloatingButton 
        iconName="add" 
        label={viewMode === 'clothes' ? "Ajouter" : "Créer"} 
        onPress={addItem} 
        backgroundColor="#F97A5C"
        iconColor="#FFFFFF"
      />

      <EmptyWardrobeModal 
        visible={!hasOutfits}
        onClose={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 