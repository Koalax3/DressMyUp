import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ColorsTheme } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type MatchingPieChartProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
};

const MatchingPieChart: React.FC<MatchingPieChartProps> = ({
  percentage,
  size = 40,
  strokeWidth = 3,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
  };
  if (percentage === 0) return null;
  return (
    <View style={styles.container}>
      { percentage < 100 && <Svg width={size} height={size}>
        {/* Arc de progression */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>}
      {showLabel && (
        <View style={styles.labelContainer}>
        </View>
      )}
      {percentage === 100 && <Ionicons style={styles.check} name="checkmark-circle" size={24} color="#2ecc71" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  check: {

  },
});

export default MatchingPieChart; 