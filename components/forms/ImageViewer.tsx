/**
 * ImageViewer - Full-screen image viewer with pinch-to-zoom
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Text,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageViewerProps {
  visible: boolean;
  uri: string;
  fileName?: string;
  onClose: () => void;
}

export function ImageViewer({ visible, uri, fileName, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset transforms when closing
  const resetTransforms = () => {
    scale.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetTransforms();
    onClose();
  };

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        // When not zoomed, allow vertical drag to close
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value > 1) {
        // Limit panning based on scale
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        if (Math.abs(translateX.value) > maxTranslateX) {
          translateX.value = withSpring(
            translateX.value > 0 ? maxTranslateX : -maxTranslateX
          );
        }
        if (Math.abs(translateY.value) > maxTranslateY) {
          translateY.value = withSpring(
            translateY.value > 0 ? maxTranslateY : -maxTranslateY
          );
        }

        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Close on swipe down when not zoomed
        if (Math.abs(event.translationY) > 100 || Math.abs(event.velocityY) > 500) {
          runOnJS(handleClose)();
        } else {
          translateY.value = withSpring(0);
        }
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  // Animated styles
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.background}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            {fileName && (
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName}
              </Text>
            )}
            <View style={styles.headerSpacer} />
          </View>

          {/* Image */}
          <GestureDetector gesture={composedGesture}>
            <AnimatedImage
              source={{ uri }}
              style={[styles.image, animatedImageStyle]}
              contentFit="contain"
            />
          </GestureDetector>

          {/* Footer hint */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
            <Text style={styles.hint}>Pinch to zoom · Swipe down to close</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 44,
  },
  image: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: typography.sizes.caption,
  },
});
