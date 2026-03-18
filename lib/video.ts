/**
 * Video Utilities
 *
 * Shared helpers for video processing. Uses expo-video's
 * generateThumbnailsAsync (replacing the deprecated expo-video-thumbnails)
 * and expo-image-manipulator for format conversion.
 */

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { createVideoPlayer } from "expo-video";

/**
 * Generates a thumbnail for a video file
 */
export async function generateVideoThumbnail(
  videoUri: string,
): Promise<string | undefined> {
  const [result] =
    await createVideoPlayer(videoUri).generateThumbnailsAsync(1000); // 1 second into the video
  const rendered = await ImageManipulator.manipulate(result).renderAsync();
  const { uri } = await rendered.saveAsync({
    compress: 0.8,
    format: SaveFormat.JPEG,
  });
  return uri;
}
