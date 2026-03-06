/**
 * FilePreviewModal - Wrapper that shows the appropriate viewer based on file type
 */

import { FileAttachment } from "@/api/types";
import React from "react";
import { VideoPlayer } from "./VideoPlayer";

interface FilePreviewModalProps {
  /** The file to preview, or null if no preview is active */
  file: FileAttachment | null;
  /** Callback when the modal is closed */
  onClose: () => void;
}

/**
 * Modal for previewing files (images, videos)
 * Automatically selects the appropriate viewer based on file type
 */
export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null;

  // For videos, use the VideoPlayer
  if (file.type === "video") {
    return (
      <VideoPlayer
        visible
        uri={file.uri}
        fileId={file.isEncrypted ? file.id : undefined}
        onClose={onClose}
      />
    );
  }

  // Documents are not previewable in-app (would need WebView or external app)
  // For now, just return null - could add a document viewer later
  return null;
}
