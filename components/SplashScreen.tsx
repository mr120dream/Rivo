import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

type SplashScreenProps = {
  onFinish: () => void;
  mode?: 'launch' | 'resume';
};

const ICON_SIZE = 120;

export function SplashScreen({ onFinish, mode = 'launch' }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);

  onFinishRef.current = onFinish;

  useEffect(() => {
    void ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(1);

    const finish = () => {
      onFinishRef.current();
    };

    if (mode === 'resume') {
      const animation = Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);

      animation.start(({ finished }) => {
        if (finished) {
          finish();
        }
      });

      return () => {
        animation.stop();
      };
    }

    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        finish();
      }
    });

    return () => {
      animation.stop();
    };
  }, [mode, opacity, scale]);

  return (
    <View style={[styles.container, mode === 'resume' && styles.overlay]} pointerEvents="auto">
      <Animated.View style={[styles.iconWrap, { opacity, transform: [{ scale }] }]}>
        <Image source={require('../assets/icon.png')} style={styles.icon} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
