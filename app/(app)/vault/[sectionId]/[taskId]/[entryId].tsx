/**
 * Entry Screen - Create/Edit Form
 *
 * Displays the form for creating or editing an entry using the registered
 * form component for that task type.
 *
 * entryId = "new" for creating a new entry
 * entryId = <uuid> for editing an existing entry
 */

import { useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import {
  apiFileToAttachment,
  MetadataSchema,
  type FileAttachment,
} from "@/api/types";
import { UpgradePrompt } from "@/components/entitlements";
import { getFormComponent } from "@/components/vault/registry";
import { colors, spacing, typography } from "@/constants/theme";
import { getTask } from "@/constants/vault";
import { usePlan } from "@/data/PlanProvider";
import {
  QuotaExceededError,
  useCreateEntry,
  useDeleteEntry,
  useEntryQuery,
  useUpdateEntry,
} from "@/hooks/queries";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  isQuotaExceededError,
  isStorageQuotaError,
} from "@/lib/entitlementHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function EntryScreen() {
  const { sectionId, taskId, entryId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
    entryId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const task = getTask(sectionId, taskId);
  const isNew = entryId === "new";
  const [showStorageUpgradePrompt, setShowStorageUpgradePrompt] =
    useState(false);

  // Get the form component for this task
  const FormComponent = task ? getFormComponent(task.taskKey) : undefined;

  // Fetch entry data if editing (pass taskKey to enable initialData from list cache)
  const { data: entry, isLoading } = useEntryQuery(
    isNew ? undefined : entryId,
    task?.taskKey,
  );

  // API for file operations
  const { files: filesService } = useApi();

  // Mutations
  const createMutation = useCreateEntry(task?.taskKey);
  const updateMutation = useUpdateEntry(task?.taskKey);
  const deleteMutation = useDeleteEntry(task?.taskKey);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Track if a file deletion is in progress
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Track if files were deleted during this session (to invalidate cache on unmount)
  const filesDeletedRef = useRef(false);

  // File attachments state - initialized from entry.files when available
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Track if we're currently saving to prevent entry refetch from overwriting local attachments
  const isSavingRef = useRef(false);

  // Initialize attachments when entry data loads (but not during save/upload)
  useEffect(() => {
    // Don't overwrite local attachments during save - the mutation invalidates the query
    // which would cause us to lose pending file uploads
    if (isSavingRef.current) {
      return;
    }
    if (entry?.files) {
      setAttachments(entry.files.map(apiFileToAttachment));
    }
  }, [entry?.files]);

  // Refs to capture current values for unmount cleanup
  const planIdRef = useRef(planId);
  const entryIdRef = useRef(entryId);
  planIdRef.current = planId;
  entryIdRef.current = entryId;

  // Invalidate entry cache on unmount if files were deleted during this session
  // This ensures the next time the entry is viewed, it reflects the deleted files
  useEffect(() => {
    return () => {
      if (
        filesDeletedRef.current &&
        planIdRef.current &&
        entryIdRef.current &&
        entryIdRef.current !== "new"
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entries.single(
            planIdRef.current,
            entryIdRef.current,
          ),
        });
      }
    };
  }, [queryClient]);

  // Polling for processing videos - check every 5 seconds, max 5 retries
  const videoPollingRetryCount = useRef(0);
  const VIDEO_POLLING_INTERVAL = 5000; // 5 seconds
  const VIDEO_POLLING_MAX_RETRIES = 5;

  useEffect(() => {
    // Check if there are any processing videos
    const hasProcessingVideos = attachments.some(
      (a) => a.type === "video" && a.isProcessing && a.isRemote,
    );

    // If no processing videos or max retries reached, don't poll
    if (
      !hasProcessingVideos ||
      videoPollingRetryCount.current >= VIDEO_POLLING_MAX_RETRIES
    ) {
      return;
    }

    // Don't poll while saving
    if (isSavingRef.current) {
      return;
    }

    const pollTimer = setTimeout(() => {
      videoPollingRetryCount.current += 1;
      // Invalidate the entry query to refetch and check if videos are ready
      if (planId && entryId && entryId !== "new") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entries.single(planId, entryId),
        });
      }
    }, VIDEO_POLLING_INTERVAL);

    return () => clearTimeout(pollTimer);
  }, [attachments, planId, entryId, queryClient]);

  // Reset polling retry count when attachments change and no longer have processing videos
  useEffect(() => {
    const hasProcessingVideos = attachments.some(
      (a) => a.type === "video" && a.isProcessing && a.isRemote,
    );
    if (!hasProcessingVideos) {
      videoPollingRetryCount.current = 0;
    }
  }, [attachments]);

  // File upload hook
  const {
    uploadFiles,
    uploadStates,
    isUploading,
    hasStorageQuotaError,
    clearStorageQuotaError,
  } = useFileUpload({
    onFileUploaded: (file, fileId) => {
      // Update attachment with backend ID and mark as remote
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri
            ? { ...a, id: fileId, uploadStatus: "complete", isRemote: true }
            : a,
        ),
      );
    },
    onFileError: (file, error) => {
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri
            ? { ...a, uploadStatus: "error", errorMessage: error }
            : a,
        ),
      );
    },
  });

  // Show storage upgrade prompt when storage quota error occurs
  useEffect(() => {
    if (hasStorageQuotaError) {
      setShowStorageUpgradePrompt(true);
      clearStorageQuotaError();
    }
  }, [hasStorageQuotaError, clearStorageQuotaError]);

  // Merge upload states into attachments for UI display
  const attachmentsWithUploadState = attachments.map((attachment) => {
    const uploadState = uploadStates[attachment.uri];
    if (uploadState) {
      return {
        ...attachment,
        uploadStatus: uploadState.status,
        uploadProgress: uploadState.progress,
        errorMessage: uploadState.error,
      };
    }
    return attachment;
  });

  // Keep a ref to current attachments for comparison in handleAttachmentsChange
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  /**
   * Handle attachment changes from the form.
   * Detects when a remote file is being removed and shows confirmation.
   */
  const handleAttachmentsChange = useCallback(
    (newAttachments: FileAttachment[]) => {
      const currentAttachments = attachmentsRef.current;

      // Helper to get unique identifier for a file (id for remote, uri for local)
      const getFileIdentifier = (file: FileAttachment) => file.id || file.uri;

      // Find any remote files that were removed
      const removedRemoteFiles = currentAttachments.filter(
        (current) =>
          current.isRemote &&
          current.id &&
          !newAttachments.some(
            (newFile) =>
              getFileIdentifier(newFile) === getFileIdentifier(current),
          ),
      );

      // If no remote files were removed, just update state
      if (removedRemoteFiles.length === 0) {
        setAttachments(newAttachments);
        return;
      }

      // Show confirmation for remote file deletion
      const fileToDelete = removedRemoteFiles[0];
      Alert.alert(
        "Delete Attachment",
        `Are you sure you want to permanently delete "${fileToDelete.fileName}"? This cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            // Don't update state - keep the file
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (!fileToDelete.id) return;

              setIsDeletingFile(true);
              try {
                await filesService.delete(fileToDelete.id);
                // Mark that files were deleted (for cache invalidation on unmount)
                filesDeletedRef.current = true;
                // Remove from state after successful deletion (use id for remote files)
                setAttachments((prev) =>
                  prev.filter((a) => getFileIdentifier(a) !== fileToDelete.id),
                );
                // Invalidate entitlements to refresh storage quota after deletion
                queryClient.invalidateQueries({
                  queryKey: queryKeys.entitlements.current(),
                });
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to delete file";
                Alert.alert("Error", message);
              } finally {
                setIsDeletingFile(false);
              }
            },
          },
        ],
      );
    },
    [filesService, queryClient],
  );

  // Handle save
  const handleSave = useCallback(
    async (data: {
      title: string;
      notes?: string | null;
      metadata: Record<string, unknown>;
      metadataSchema: MetadataSchema;
    }) => {
      if (!task || !planId) return;

      try {
        // Prevent entry refetch from overwriting local attachments during save
        isSavingRef.current = true;

        let savedEntryId: string;
        const wasNew = isNew;

        if (isNew) {
          const createdEntry = await createMutation.mutateAsync(data);
          savedEntryId = createdEntry.id;
        } else {
          await updateMutation.mutateAsync({ entryId, data });
          savedEntryId = entryId;
        }

        // Upload any pending files
        const pendingFiles = attachments.filter(
          (f) => !f.isRemote && f.uploadStatus !== "complete",
        );
        if (pendingFiles.length > 0) {
          // Helper to handle upload failures - stays on page and shows error
          const handleUploadFailure = (errorMessage: string) => {
            // If this was a new entry, replace the route so we're now editing
            // the created entry (prevents duplicate entry creation on retry)
            if (wasNew) {
              router.replace(
                `/(app)/vault/${sectionId}/${taskId}/${savedEntryId}`,
              );
            }

            Alert.alert(
              "Upload Failed",
              `${errorMessage} Your entry has been saved. Try adding the files again.`,
            );
          };

          try {
            const uploadResults = await uploadFiles({ entryId: savedEntryId }, attachments);

            // Invalidate entry cache after uploads so it includes the new files
            await queryClient.invalidateQueries({
              queryKey: queryKeys.entries.single(planId, savedEntryId),
            });

            // Check for upload failures (excluding storage quota errors which show their own prompt)
            const failedUploads = uploadResults.filter(
              (r) => !r.success && !r.isStorageQuotaError,
            );

            if (failedUploads.length > 0) {
              const failedCount = failedUploads.length;
              handleUploadFailure(
                `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload.`,
              );
              // Don't navigate away - stay on page to show error state
              return;
            }
          } catch (uploadError) {
            // Check if it's a storage quota error thrown by uploadFiles
            if (isStorageQuotaError(uploadError)) {
              if (wasNew) {
                router.replace(
                  `/(app)/vault/${sectionId}/${taskId}/${savedEntryId}`,
                );
              }
              setShowStorageUpgradePrompt(true);
              return;
            }

            // Handle any other thrown errors from uploadFiles
            handleUploadFailure("An error occurred during file upload.");
            return;
          }
        }

        router.back();
      } catch (error) {
        // Check for storage quota exceeded error
        if (isStorageQuotaError(error)) {
          setShowStorageUpgradePrompt(true);
          return;
        }
        // Check for general quota exceeded error (entries, etc.)
        if (
          error instanceof QuotaExceededError ||
          isQuotaExceededError(error)
        ) {
          setShowUpgradePrompt(true);
          return;
        }
        // Re-throw other errors to be handled by error boundaries
        throw error;
      } finally {
        isSavingRef.current = false;
      }
    },
    [
      task,
      planId,
      isNew,
      entryId,
      sectionId,
      taskId,
      createMutation,
      updateMutation,
      attachments,
      uploadFiles,
      queryClient,
      router,
    ],
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!entryId || isNew) return;

    await deleteMutation.mutateAsync(entryId);
    router.back();
  }, [entryId, isNew, deleteMutation, router]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Task not found
  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  // No form component registered for this task
  if (!FormComponent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No form component registered for task: {task.taskKey}
        </Text>
      </View>
    );
  }

  // Loading existing entry
  if (!isNew && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <FormComponent
        taskKey={task.taskKey}
        entryId={isNew ? undefined : entryId}
        initialData={entry}
        onSave={handleSave}
        onDelete={isNew ? undefined : handleDelete}
        onCancel={handleCancel}
        isSaving={isSaving || isDeletingFile}
        attachments={attachmentsWithUploadState}
        onAttachmentsChange={handleAttachmentsChange}
        isUploading={isUploading}
        onStorageUpgradeRequired={() => setShowStorageUpgradePrompt(true)}
      />
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title="You've Reached Your Limit"
        message="You've made great progress organizing your legacy. Upgrade your plan to add more entries and unlock additional features."
      />
      <UpgradePrompt
        visible={showStorageUpgradePrompt}
        onClose={() => setShowStorageUpgradePrompt(false)}
        title="Storage Limit Reached"
        message="This file would exceed your storage limit. Upgrade your plan for more storage space to keep all your important files safe."
      />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
