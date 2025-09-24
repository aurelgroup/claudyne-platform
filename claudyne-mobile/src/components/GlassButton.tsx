/**
 * GlassButton - Bouton glassmorphism pour Claudyne Mobile
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const buttonStyle = [
    styles.baseButton,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyleCombined = [
    styles.baseText,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={textStyleCombined}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  baseText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Variants
  primary: {
    backgroundColor: THEME_CONSTANTS.COLORS.ACCENT_1,
    borderColor: THEME_CONSTANTS.COLORS.ACCENT_1,
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_1,
  },
  secondary: {
    backgroundColor: THEME_CONSTANTS.COLORS.ACCENT_2,
    borderColor: THEME_CONSTANTS.COLORS.ACCENT_2,
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_2,
  },
  accent: {
    backgroundColor: THEME_CONSTANTS.COLORS.ACCENT_3,
    borderColor: THEME_CONSTANTS.COLORS.ACCENT_3,
    shadowColor: THEME_CONSTANTS.COLORS.ACCENT_3,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: THEME_CONSTANTS.COLORS.GLASS_BORDER,
    shadowColor: '#000',
  },

  // Text colors
  primaryText: {
    color: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  secondaryText: {
    color: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  accentText: {
    color: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  outlineText: {
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
  },

  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },

  // Text sizes
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },
});

export default GlassButton;