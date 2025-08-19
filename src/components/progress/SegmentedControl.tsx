import React, { /* eslint-disable react-hooks/exhaustive-deps */ useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../constants/styleConstants';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}

const SLIDER_PADDING = 3;

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onIndexChange,
}) => {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  React.useEffect(() => {
    if (containerWidth > 0) {
      const segmentWidth = (containerWidth - SLIDER_PADDING * 2) / segments.length;
      translateX.value = withSpring(selectedIndex * segmentWidth, {
        damping: 20,
        stiffness: 150,
      });
    }
  }, [selectedIndex, segments.length, containerWidth]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: containerWidth > 0 ? (containerWidth - SLIDER_PADDING * 2) / segments.length : 0,
  }));

  return (
    <View style={styles.wrapper}>
      <View
        onLayout={handleLayout}
        style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      >
        <Animated.View
          style={[
            styles.slider,
            sliderStyle,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        />
        {segments.map((segment, index) => (
          <TouchableOpacity
            key={segment}
            style={styles.segment}
            onPress={() => onIndexChange(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                selectedIndex === index
                  ? styles.segmentTextSelected
                  : isDark
                    ? { color: colors.text }
                    : { color: colors.textSecondary },
              ]}
            >
              {segment}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  container: {
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    padding: SLIDER_PADDING,
    position: 'relative',
    borderWidth: 1,
  },
  slider: {
    position: 'absolute',
    height: 34,
    borderRadius: 17,
    top: SLIDER_PADDING,
    left: SLIDER_PADDING,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  segmentTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  containerDark: {
    backgroundColor: COLORS.backgroundDarkSubtle,
    borderColor: COLORS.borderDarkSubtle,
  },
  containerLight: {
    backgroundColor: COLORS.backgroundLightSubtle,
    borderColor: COLORS.borderLightSubtle,
  },
});
