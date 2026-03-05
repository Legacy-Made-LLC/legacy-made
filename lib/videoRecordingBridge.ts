/**
 * Video Recording Bridge
 *
 * Simple callback bridge to pass recorded video URIs from the
 * recording screen back to the form that initiated it.
 *
 * Flow:
 * 1. Form sets a callback via setVideoRecordedCallback()
 * 2. Form navigates to the recording screen
 * 3. Recording screen calls emitVideoRecorded(uri) when user confirms
 * 4. Form's callback receives the URI and creates a FileAttachment
 */

import type { FileAttachment } from "@/api/types";
import { logger } from "@/lib/logger";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";

type VideoRecordedCallback = (attachment: FileAttachment) => void;

let _callback: VideoRecordedCallback | null = null;
let _isEmitting = false;

/**
 * Set the callback that will receive the recorded video.
 * Called by the form before navigating to the recording screen.
 */
export function setVideoRecordedCallback(cb: VideoRecordedCallback) {
  _callback = cb;
}

/**
 * Emit the recorded video URI. Creates a FileAttachment and
 * calls the registered callback.
 * Called by the recording screen when the user taps "Use Video".
 *
 * Guarded against re-entrancy — concurrent calls are ignored while
 * a previous emission is still in progress (async thumbnail generation).
 */
export async function emitVideoRecorded(videoUri: string) {
  if (!_callback || _isEmitting) return;

  const cb = _callback;
  _callback = null;
  _isEmitting = true;

  try {
    // Get file size
    let fileSize = 0;
    try {
      const info = new FileSystem.File(videoUri).info();
      if (info.exists && "size" in info) {
        fileSize = info.size ?? 0;
      } else {
        throw new Error("File does not exist");
      }
    } catch (error) {
      logger.warn("Failed to get video file size", { error: String(error) });
    }

    // Generate thumbnail
    let thumbnailUri: string | undefined;
    try {
      const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
        quality: 0.7,
      });
      thumbnailUri = result.uri;
    } catch (error) {
      logger.warn("Failed to generate video thumbnail", { error: String(error) });
    }

    const attachment: FileAttachment = {
      uri: videoUri,
      fileName: `video_${Date.now()}.mp4`,
      fileSize,
      mimeType: "video/mp4",
      type: "video",
      thumbnailUri,
      uploadStatus: "pending",
    };

    cb(attachment);
  } finally {
    _isEmitting = false;
  }
}

/**
 * Clear any pending callback (e.g., if the user cancels).
 */
export function clearVideoRecordedCallback() {
  _callback = null;
}
