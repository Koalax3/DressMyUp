import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ColorsTheme } from '@/constants/Colors';

type MatchingProgressBarProps = {
  percentage: number;
  showLabel?: boolean;
  height?: number;
  style?: any;
};

const MatchingProgressBar: React.FC<MatchingProgressBarProps> = ({
  percentage,
  showLabel = true,
  height = 8,
  style
}) => {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const getColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.progressContainer, { height }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: getColor(percentage),
            },
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Correspondance</Text>
          <Text style={[styles.percentage, { color: getColor(percentage) }]}>
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: ColorsTheme.text.bright,
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MatchingProgressBar; 