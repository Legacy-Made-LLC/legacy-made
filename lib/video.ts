/**
 * Video Utilities
 *
 * Shared helpers for video processing. Uses expo-video-thumbnails for
 * generating thumbnail file URIs from video files.
 *
 * Note: expo-video-thumbnails is deprecated and will be removed in SDK 56.
 * The intended replacement (expo-video's generateThumbnailsAsync +
 * expo-image-manipulator) has a native interop bug in SDK 55 where
 * ImageManipulator.manipulate() rejects the VideoThumbnail SharedRef.
 * Revisit this when upgrading to SDK 56.
 */

import * as VideoThumbnails from "expo-video-thumbnails";

/**
 * Generates a thumbnail for a video file.
 * Returns a local file:// URI suitable for display and upload.
 */
export async function generateVideoThumbnail(
  videoUri: string,
): Promise<string> {
  const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
    time: 1000, // 1 second into the video (milliseconds)
    quality: 0.7,
  });
  return uri;
}
