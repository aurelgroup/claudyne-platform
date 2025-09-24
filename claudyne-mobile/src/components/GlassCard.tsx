/**
 * GlassCard - Composant glassmorphism pour Claudyne Mobile
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  touchable?: boolean;
  variant?: 'default' | 'accent1' | 'accent2' | 'accent3';
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  touchable = false,
  variant = 'default',
  ...touchableProps
}) => {
  const cardStyle = [
    styles.glassCard,
    styles[variant],
    style,
  ];

  if (touchable) {
    return (
      <TouchableOpacity
        style={cardStyle}
        activeOpacity={0.8}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.GLASS_BG,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    borderWidth: 1,
    borderColor: THEME_CONSTANTS.COLORS.GLASS_BORDER,
    padding: THEME_CONSTANTS.SPACING.MD,
    // React Native ne supporte pas backdrop-filter, on simule avec l'opacity
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  default: {
    borderColor: THEME_CONSTANTS.COLORS.GLASS_BORDER,
  },
  accent1: {
    borderColor: `${THEME_CONSTANTS.COLORS.ACCENT_1}40`, // 25% opacity
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_1,
  },
  accent2: {
    borderColor: `${THEME_CONSTANTS.COLORS.ACCENT_2}40`, // 25% opacity
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_2,
  },
  accent3: {
    borderColor: `${THEME_CONSTANTS.COLORS.ACCENT_3}40`, // 25% opacity
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_3,
  },
});

export default GlassCard;