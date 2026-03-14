/**
 * VideoPlayer - Full-screen video player with swipe-to-dismiss
 *
 * Supports local file playback (file:// URIs), remote URLs (https://),
 * and encrypted files (downloaded + decrypted via fileId).
 */

import { colors, spacing, typography } from '@/constants/theme';
import { useEncryptedFileView } from '@/hooks/useEncryptedFileView';
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
  /** Backend file ID for encrypted files — triggers download + decrypt */
  fileId?: string;
  /** Whether the file is known to be encrypted (controls decryption fallback behavior) */
  isEncrypted?: boolean;
  onClose: () => void;
}

export function VideoPlayer({ visible, uri, fileId, isEncrypted, onClose }: VideoPlayerProps) {
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSourceReady, setIsSourceReady] = useState(false);

  // Track if we've already loaded a source to avoid duplicate loads
  const loadedSourceRef = useRef<string | null>(null);

  // For encrypted files, download + decrypt via the E2EE hook
  const effectiveFileId = visible && fileId ? fileId : undefined;
  const {
    localUri: decryptedUri,
    error: decryptError,
  } = useEncryptedFileView(effectiveFileId, 'video/mp4', uri, isEncrypted);

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

    // For encrypted files, wait for decryption
    if (fileId) {
      if (decryptError) {
        setError(decryptError);
        setIsLoading(false);
        return;
      }
      if (!decryptedUri) {
        // Still decrypting — show loading state
        setIsLoading(true);
        return;
      }
    }

    // Determine the video source URI
    const sourceUri = fileId ? decryptedUri : uri;
    if (!sourceUri) {
      setIsSourceReady(false);
      return;
    }

    let isMounted = true;

    async function prepareAndLoadVideo() {
      setIsLoading(true);
      setError(null);

      try {
        let finalUri: string;

        // For remote URLs (http/https), use directly
        if (sourceUri!.startsWith('http://') || sourceUri!.startsWith('https://')) {
          finalUri = sourceUri!;
        }
        // For file:// URIs that are already in cache/documents, use directly
        else if (sourceUri!.startsWith('file://') &&
            (sourceUri!.includes('/Caches/') || sourceUri!.includes('/Documents/') || sourceUri!.includes('/tmp/'))) {
          finalUri = sourceUri!;
        }
        // For other URIs (ph://, assets-library://, or file:// outside our directories),
        // copy to cache directory for reliable playback
        else {
          const extension = sourceUri!.split('.').pop() || 'mp4';
          const destFileName = `video_preview_${Date.now()}.${extension}`;

          const sourceFile = new File(sourceUri!);
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
  }, [visible, uri, fileId, decryptedUri, decryptError, player]);

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
