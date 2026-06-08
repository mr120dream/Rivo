import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet } from 'react-native';

type SkeletonCardProps = {
  width?: DimensionValue;
  height?: number;
};

export function SkeletonCard({ width = '100%', height = 80 }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { width, height, opacity }]} />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
  },
});
