import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { shadows } from '../styles/theme';

/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 40;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

const BubbleTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateX = useSharedValue(state.index * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 15,
      stiffness: 100,
    });
  }, [state.index, translateX]);

  const animatedBubbleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const getIconName = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Home':
        return isFocused ? 'home' : 'home-outline';
      case 'Revision':
        return isFocused ? 'book' : 'book-outline';
      case 'Progress':
        return isFocused ? 'stats-chart' : 'stats-chart-outline';
      case 'Ranking':
        return isFocused ? 'trophy' : 'trophy-outline';
      default:
        return 'help-outline';
    }
  };

  const getLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Home':
        return 'Accueil';
      case 'Revision':
        return 'Révision';
      case 'Progress':
        return 'Progrès';
      case 'Ranking':
        return 'Classement';
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          },
          shadows.lg,
        ]}
      >
        <Animated.View
          style={[styles.bubble, animatedBubbleStyle, { backgroundColor: colors.primary }]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon
                routeName={route.name}
                isFocused={isFocused}
                iconName={getIconName(route.name, isFocused)}
                label={getLabel(route.name)}
                colors={colors}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface TabIconProps {
  routeName: string;
  isFocused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: {
    surface: string;
    border: string;
    primary: string;
    text: string;
    textSecondary: string;
  };
}

const TabIcon: React.FC<TabIconProps> = ({ isFocused, iconName, label, colors }) => {
  const scaleValue = useSharedValue(isFocused ? 1 : 0.9);
  const opacityValue = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    scaleValue.value = withSpring(isFocused ? 1 : 0.9, {
      damping: 15,
      stiffness: 150,
    });
    opacityValue.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused, opacityValue, scaleValue]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
      transform: [
        {
          scale: interpolate(scaleValue.value, [0.9, 1], [0.85, 1]),
        },
      ],
    };
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons name={iconName} size={24} color={isFocused ? '#fff' : colors.text} />
      </Animated.View>
      <Animated.Text
        style={[styles.label, animatedTextStyle, { color: isFocused ? '#fff' : colors.text }]}
      >
        {label}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    width: TAB_BAR_WIDTH,
    height: 65,
    borderRadius: 35,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    opacity: 0.98,
  },
  bubble: {
    position: 'absolute',
    width: TAB_WIDTH - 10,
    height: 50,
    borderRadius: 25,
    top: 7.5,
    left: 5,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default BubbleTabBar;
