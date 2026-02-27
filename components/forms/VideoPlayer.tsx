/**
 * VideoPlayer - Full-screen video player with swipe-to-dismiss
 */

import { colors, spacing, typography } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  visible: boolean;
  uri: string;
  /** Mux playback ID for streaming videos */
  playbackId?: string;
  /** Mux authentication tokens */
  tokens?: {
    playbackToken: string;
    thumbnailToken: string;
    storyboardToken: string;
  };
  onClose: () => void;
}

export function VideoPlayer({ visible, uri, playbackId, tokens, onClose }: VideoPlayerProps) {
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSourceReady, setIsSourceReady] = useState(false);

  // Track if we've already loaded a source to avoid duplicate loads
  const loadedSourceRef = useRef<string | null>(null);

  // Animation values for swipe-to-dismiss
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Create the video player with null source initially
  const player = useVideoPlayer(null, (playerInstance) => {
    playerInstance.loop = false;
  });

  // Reset animation values
  const resetAnimations = useCallback(() => {
    translateY.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [translateY, opacity]);

  // Listen for status changes (loading, error, etc.)
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', ({ status, error: playerError }) => {
      if (status === 'readyToPlay') {
        setIsLoading(false);
        setError(null);
        // Auto-play when ready
        player.play();
      } else if (status === 'loading') {
        setIsLoading(true);
      } else if (status === 'error') {
        setError(playerError?.message || 'Failed to load video');
        setIsLoading(false);
      } else if (status === 'idle') {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Prepare and load the video source
  useEffect(() => {
    if (!visible) {
      setIsSourceReady(false);
      setError(null);
      loadedSourceRef.current = null;
      return;
    }

    // Need either a playbackId (for Mux) or a uri
    if (!playbackId && !uri) {
      setIsSourceReady(false);
      return;
    }

    let isMounted = true;

    async function prepareAndLoadVideo() {
      setIsLoading(true);
      setError(null);

      try {
        let finalUri: string;

        // For Mux videos, construct the HLS streaming URL
        if (playbackId) {
          finalUri = `https://stream.mux.com/${playbackId}.m3u8`;
          if (tokens?.playbackToken) {
            finalUri += `?token=${tokens.playbackToken}`;
          }
        }
        // For remote URLs (http/https), use directly
        else if (uri.startsWith('http://') || uri.startsWith('https://')) {
          finalUri = uri;
        }
        // For file:// URIs that are already in cache/documents, use directly
        else if (uri.startsWith('file://') &&
            (uri.includes('/Caches/') || uri.includes('/Documents/') || uri.includes('/tmp/'))) {
          finalUri = uri;
        }
        // For other URIs (ph://, assets-library://, or file:// outside our directories),
        // copy to cache directory for reliable playback
        else {
          const extension = uri.split('.').pop() || 'mp4';
          const destFileName = `video_preview_${Date.now()}.${extension}`;

          const sourceFile = new File(uri);
          const destFile = new File(Paths.cache, destFileName);

          await sourceFile.copy(destFile);
          finalUri = destFile.uri;
        }

        if (!isMounted) return;

        // Avoid reloading the same source
        if (loadedSourceRef.current === finalUri) {
          return;
        }

        loadedSourceRef.current = finalUri;
        setIsSourceReady(true);

        // Load the video source
        await player.replaceAsync({ uri: finalUri });

      } catch (err) {
        logger.error("Failed to prepare video for playback", err);
        if (isMounted) {
          setError('Unable to load video. The file may be unavailable.');
          setIsLoading(false);
        }
      }
    }

    prepareAndLoadVideo();

    return () => {
      isMounted = false;
    };
  }, [visible, uri, playbackId, tokens, player]);

  const handleClose = useCallback(async () => {
    if (player) {
      player.pause();
      await player.replaceAsync(null);
    }
    setIsSourceReady(false);
    setIsLoading(true);
    setError(null);
    loadedSourceRef.current = null;
    resetAnimations();
    onClose();
  }, [player, onClose, resetAnimations]);

  // Pan gesture for swipe-to-dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward swipe
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        // Fade out as user swipes down
        opacity.value = 1 - (event.translationY / SCREEN_HEIGHT) * 0.5;
      }
    })
    .onEnd((event) => {
      // Close if swiped far enough or fast enough
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
      } else {
        // Snap back
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Animated.View style={[styles.background, animatedBackgroundStyle]} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Video with native controls */}
            <View style={styles.videoContainer}>
              {isSourceReady && (
                <VideoView
                  player={player}
                  style={styles.video}
                  contentFit="contain"
                  nativeControls
                  fullscreenOptions={{
                    enable: false,
                  }}
                  allowsPictureInPicture
                />
              )}

              {/* Loading indicator */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}

              {/* Error state */}
              {error && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle" size={48} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>

            {/* Footer hint */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
              <Text style={styles.hint}>Swipe down to close</Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.body,
    marginTop: spacing.md,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: spacing.xl,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: typography.sizes.caption,
  },
});
