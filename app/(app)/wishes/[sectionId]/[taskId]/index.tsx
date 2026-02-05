/**
 * Wishes Task Screen - Single Wish Form
 *
 * Each task has exactly one wish. This screen directly shows the form:
 * - If a wish exists for this task, pre-populate the form for editing
 * - If no wish exists yet, show an empty form for creation
 *
 * There's no delete functionality since every task always has one wish
 * (either created or not yet created).
 */

import { useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type { MetadataSchema, FileAttachment } from "@/api/types";
import { apiFileToAttachment } from "@/api/types";
import { UpgradePrompt } from "@/components/entitlements";
import {
  getWishesFormComponent,
  type WishFormGuidance,
} from "@/components/wishes/registry";
import { colors, spacing, typography } from "@/constants/theme";
import {
  getWishesSection,
  getWishesSectionByTaskKey,
  getWishesTask,
} from "@/constants/wishes";
import { usePlan } from "@/data/PlanProvider";
import {
  useCreateWish,
  useUpdateWish,
  useWishesQuery,
  WishQuotaExceededError,
} from "@/hooks/queries";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
  isQuotaExceededError,
  isStorageQuotaError,
} from "@/lib/entitlementHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WishesTaskScreen() {
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showStorageUpgradePrompt, setShowStorageUpgradePrompt] =
    useState(false);

  const section = getWishesSection(sectionId);
  const task = getWishesTask(sectionId, taskId);
  const sectionByKey = task ? getWishesSectionByTaskKey(task.taskKey) : null;

  // Set the header title before first render
  useLayoutEffect(() => {
    if (task) {
      navigation.setOptions({
        title: task.title,
        headerDescription: task.description,
      });
    }
  }, [task, navigation]);

  // Get the form component for this task
  const FormComponent = task ? getWishesFormComponent(task.taskKey) : undefined;

  // Fetch wishes for this task (will be 0 or 1 since each task has one wish)
  const {
    data: wishes = [],
    isLoading,
    isFetched,
  } = useWishesQuery(task?.taskKey);

  // Get the existing wish if any
  const existingWish = wishes[0];
  const isNew = !existingWish;

  // API for file operations
  const { files: filesService } = useApi();

  // Build guidance props for the form
  const guidance: WishFormGuidance | undefined = useMemo(() => {
    if (!task?.triggerText || !task?.guidance) return undefined;
    return {
      icon: task.ionIcon ?? sectionByKey?.ionIcon,
      triggerText: task.triggerText,
      heading: task.guidanceHeading,
      detail: task.guidance,
      tips: task.tips,
      pacingNote: task.pacingNote,
    };
  }, [task, sectionByKey]);

  // Mutations
  const createMutation = useCreateWish(task?.taskKey);
  const updateMutation = useUpdateWish(task?.taskKey);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Track if a file deletion is in progress
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Track if files were deleted during this session (to invalidate cache on unmount)
  const filesDeletedRef = useRef(false);

  // File attachments state - initialized from wish.files when available
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Track if we're currently saving to prevent wish refetch from overwriting local attachments
  const isSavingRef = useRef(false);

  // Initialize attachments when wish data loads (but not during save/upload)
  useEffect(() => {
    // Don't overwrite local attachments during save - the mutation invalidates the query
    // which would cause us to lose pending file uploads
    if (isSavingRef.current) {
      return;
    }
    if (existingWish?.files) {
      setAttachments(existingWish.files.map(apiFileToAttachment));
    }
  }, [existingWish?.files]);

  // Refs to capture current values for unmount cleanup
  const planIdRef = useRef(planId);
  const taskKeyRef = useRef(task?.taskKey);
  planIdRef.current = planId;
  taskKeyRef.current = task?.taskKey;

  // Invalidate wish cache on unmount if files were deleted during this session
  useEffect(() => {
    return () => {
      if (filesDeletedRef.current && planIdRef.current && taskKeyRef.current) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.wishes.byTaskKey(planIdRef.current, taskKeyRef.current),
        });
      }
    };
  }, [queryClient]);

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
        // Prevent wish refetch from overwriting local attachments during save
        isSavingRef.current = true;

        let savedWishId: string;

        if (isNew) {
          const createdWish = await createMutation.mutateAsync(data);
          savedWishId = createdWish.id;
        } else {
          await updateMutation.mutateAsync({ wishId: existingWish.id, data });
          savedWishId = existingWish.id;
        }

        // Upload any pending files
        const pendingFiles = attachments.filter(
          (f) => !f.isRemote && f.uploadStatus !== "complete",
        );
        if (pendingFiles.length > 0) {
          // Helper to handle upload failures - stays on page and shows error
          const handleUploadFailure = (errorMessage: string) => {
            Alert.alert(
              "Upload Failed",
              `${errorMessage} Your wish has been saved. Try adding the files again.`,
            );
          };

          try {
            const uploadResults = await uploadFiles(savedWishId, attachments);

            // Invalidate wish cache after uploads so it includes the new files
            await queryClient.invalidateQueries({
              queryKey: queryKeys.wishes.byTaskKey(planId, task.taskKey),
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
        // Check for general quota exceeded error (wishes, etc.)
        if (
          error instanceof WishQuotaExceededError ||
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
      existingWish,
      createMutation,
      updateMutation,
      attachments,
      uploadFiles,
      queryClient,
      router,
    ],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Section or task not found
  if (!section || !task) {
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

  // Show loading state while fetching
  if (isLoading || !isFetched) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.featureWishes} />
      </View>
    );
  }

  return (
    <>
      <FormComponent
        taskKey={task.taskKey}
        wishId={isNew ? undefined : existingWish.id}
        initialData={existingWish}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving || isDeletingFile}
        guidance={guidance}
        attachments={attachmentsWithUploadState}
        onAttachmentsChange={handleAttachmentsChange}
        isUploading={isUploading}
        onStorageUpgradeRequired={() => setShowStorageUpgradePrompt(true)}
      />
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title="You've Reached Your Limit"
        message="You've made great progress sharing your wishes. Upgrade your plan to add more and unlock additional features."
      />
      <UpgradePrompt
        visible={showStorageUpgradePrompt}
        onClose={() => setShowStorageUpgradePrompt(false)}
        title="Storage Limit Reached"
        message="This file would exceed your storage limit. Upgrade your plan for more storage space to keep all your important documents safe."
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
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
});
