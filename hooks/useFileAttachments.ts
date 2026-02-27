/**
 * useFileAttachments - Shared hook for managing file attachments
 *
 * Handles the common logic for file attachment management across entry and wish screens:
 * - Tracking which files are being deleted (for UI feedback)
 * - Deleting remote files from the server
 * - Updating attachment state after successful deletions
 * - Showing error alerts for failed deletions
 * - Cache invalidation for entitlements
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { useApi } from "@/api";
import { toast } from "@/hooks/useToast";
import type { FileAttachment } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";

interface UseFileAttachmentsOptions {
  /** Callback when files are successfully deleted (for cache invalidation) */
  onFilesDeleted?: () => void;
}

interface UseFileAttachmentsResult {
  /** Current file attachments */
  attachments: FileAttachment[];
  /** Set the attachments state directly */
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  /** Set of file IDs currently being deleted (for UI feedback) */
  deletingFileIds: Set<string>;
  /**
   * Handle attachment changes from the form.
   * Detects removed remote files and deletes them from the server.
   * Returns the new attachments array after processing deletions.
   */
  handleRemoteFileDeletions: (
    newAttachments: FileAttachment[]
  ) => Promise<{
    /** Whether any remote files were removed and processed */
    hadRemoteDeletions: boolean;
    /** Whether any files were successfully deleted */
    hadSuccessfulDeletions: boolean;
    /** The final attachments array after processing */
    finalAttachments: FileAttachment[];
  }>;
}

/**
 * Helper to get unique identifier for a file (id for remote, uri for local)
 */
function getFileIdentifier(file: FileAttachment): string {
  return file.id || file.uri;
}

export function useFileAttachments(
  options: UseFileAttachmentsOptions = {}
): UseFileAttachmentsResult {
  const { onFilesDeleted } = options;
  const queryClient = useQueryClient();
  const { files: filesService } = useApi();

  // File attachments state
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Track which files are currently being deleted (for UI feedback)
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(
    new Set()
  );

  // Keep a ref to current attachments for comparison
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  /**
   * Handle remote file deletions.
   * Detects removed remote files and deletes them from the server.
   */
  const handleRemoteFileDeletions = useCallback(
    async (
      newAttachments: FileAttachment[]
    ): Promise<{
      hadRemoteDeletions: boolean;
      hadSuccessfulDeletions: boolean;
      finalAttachments: FileAttachment[];
    }> => {
      const currentAttachments = attachmentsRef.current;

      // Find any remote files that were removed
      const removedRemoteFiles = currentAttachments.filter(
        (current) =>
          current.isRemote &&
          current.id &&
          !newAttachments.some(
            (newFile) =>
              getFileIdentifier(newFile) === getFileIdentifier(current)
          )
      );

      // If no remote files were removed, just return
      if (removedRemoteFiles.length === 0) {
        return {
          hadRemoteDeletions: false,
          hadSuccessfulDeletions: false,
          finalAttachments: newAttachments,
        };
      }

      // Add all file IDs to deleting set for visual feedback
      setDeletingFileIds((prev) => {
        const next = new Set(prev);
        removedRemoteFiles.forEach((f) => {
          if (f.id) next.add(f.id);
        });
        return next;
      });

      // Delete all removed files from the server
      const deleteResults = await Promise.allSettled(
        removedRemoteFiles.map(async (fileToDelete) => {
          if (!fileToDelete.id) return;
          await filesService.delete(fileToDelete.id);
          return fileToDelete.id;
        })
      );

      // Track which files were successfully deleted
      const successfullyDeletedIds = new Set<string>();
      const failedCount = deleteResults.filter((r) => {
        if (r.status === "fulfilled" && r.value) {
          successfullyDeletedIds.add(r.value);
          return false;
        }
        return r.status === "rejected";
      }).length;

      // Calculate final attachments after removing successfully deleted files
      let finalAttachments = attachmentsRef.current;
      const hadSuccessfulDeletions = successfullyDeletedIds.size > 0;

      // Update state to remove successfully deleted files
      if (hadSuccessfulDeletions) {
        finalAttachments = finalAttachments.filter(
          (a) => !a.id || !successfullyDeletedIds.has(a.id)
        );
        setAttachments(finalAttachments);

        // Invalidate all entitlements (storage indicators read from plan entitlements)
        queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });

        // Notify caller that files were deleted
        onFilesDeleted?.();
      }

      // Clear deleting state
      setDeletingFileIds((prev) => {
        const next = new Set(prev);
        removedRemoteFiles.forEach((f) => {
          if (f.id) next.delete(f.id);
        });
        return next;
      });

      // Show error if any deletions failed
      if (failedCount > 0) {
        toast.error({
          message: `${failedCount} file${failedCount > 1 ? "s" : ""} could not be deleted. Please try again.`,
        });
      }

      return { hadRemoteDeletions: true, hadSuccessfulDeletions, finalAttachments };
    },
    [filesService, queryClient, onFilesDeleted]
  );

  return {
    attachments,
    setAttachments,
    deletingFileIds,
    handleRemoteFileDeletions,
  };
}
