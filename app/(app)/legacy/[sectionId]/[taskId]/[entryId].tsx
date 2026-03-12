/**
 * Legacy Entry Screen - Create/Edit Form
 *
 * Displays the form for creating or editing a legacy message entry
 * (used for list-based tasks: Messages to People, Future Moments).
 *
 * entryId = "new" for creating a new entry
 * entryId = <uuid> for editing an existing entry
 *
 * Follows the vault [entryId].tsx pattern.
 */

import type { AnyFormApi } from "@tanstack/form-core";
import { useQueryClient } from "@tanstack/react-query";

import {
  apiFilesToAttachments,
  type EntryCompletionStatus,
  type FileAttachment,
  type MetadataSchema,
} from "@/api/types";
import { UpgradePrompt } from "@/components/entitlements";
import { getLegacyEntryFormComponent } from "@/components/legacy/registry";
import { KeyboardDoneButton } from "@/components/ui/KeyboardDoneButton";
import { useLegacyTask } from "@/constants/legacy";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import {
  MessageQuotaExceededError,
  useCreateMessage,
  useDeleteMessage,
  useMessageQuery,
  useUpdateMessage,
} from "@/hooks/queries";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "@/hooks/useToast";
import {
  isQuotaExceededError,
  isStorageQuotaError,
} from "@/lib/entitlementHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function LegacyEntryScreen() {
  const { sectionId, taskId, entryId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
    entryId: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { planId, isReadOnly, isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showStorageUpgradePrompt, setShowStorageUpgradePrompt] =
    useState(false);

  // Unsaved-changes guard refs
  const formRef = useRef<AnyFormApi | null>(null);
  const allowNavigationRef = useRef(false);
  const attachmentsRef = useRef<FileAttachment[]>([]);

  const handleFormReady = useCallback((form: AnyFormApi) => {
    formRef.current = form;
  }, []);

  const task = useLegacyTask(sectionId, taskId);
  const isNew = entryId === "new";

  // Redirect back if trying to create new entry on a read-only plan
  useEffect(() => {
    if (isReadOnly && isNew) {
      router.back();
    }
  }, [isReadOnly, isNew, router]);

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (allowNavigationRef.current) return;
      if (isReadOnly) return;
      // Check for pending file attachments (added but not yet saved/uploaded)
      const hasPendingFiles = attachmentsRef.current.some(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      // Allow navigation if form has no unsaved changes and no pending files
      if (!formRef.current?.state.isDirty && !hasPendingFiles) return;

      e.preventDefault();

      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, isReadOnly]);

  // Get the form component for this task
  const FormComponent = task
    ? getLegacyEntryFormComponent(task.taskKey)
    : undefined;

  // Fetch message data if editing
  const { data: message, isLoading } = useMessageQuery(
    isNew ? undefined : entryId,
    task?.taskKey,
  );

  // Mutations
  const createMutation = useCreateMessage(task?.taskKey);
  const updateMutation = useUpdateMessage(task?.taskKey);
  const deleteMutation = useDeleteMessage(task?.taskKey);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Track the saved message ID so subsequent saves use update instead of create
  const savedMessageIdRef = useRef<string | null>(null);

  // File attachments management
  const {
    attachments,
    setAttachments,
    deletingFileIds,
    handleRemoteFileDeletions,
  } = useFileAttachments();
  attachmentsRef.current = attachments;

  const isSavingRef = useRef(false);
  const filesDeletedRef = useRef(false);
  const attachmentsDirtyRef = useRef(false);

  // Initialize attachments when message data loads
  useEffect(() => {
    if (isSavingRef.current) return;
    if (message?.files) {
      setAttachments(apiFilesToAttachments(message.files));
    }
  }, [message?.files, setAttachments]);

  // Refs for cleanup
  const planIdRef = useRef(planId);
  const entryIdRef = useRef(entryId);
  planIdRef.current = planId;
  entryIdRef.current = entryId;

  // Invalidate cache on unmount if files were deleted
  useEffect(() => {
    return () => {
      if (
        filesDeletedRef.current &&
        planIdRef.current &&
        entryIdRef.current &&
        entryIdRef.current !== "new"
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.single(
            planIdRef.current,
            entryIdRef.current,
          ),
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
    onFileUploaded: (file, fileId, downloadUrl) => {
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri
            ? {
                ...a,
                id: fileId,
                uri: downloadUrl || a.uri,
                uploadStatus: "complete",
                isRemote: true,
              }
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

  useEffect(() => {
    if (hasStorageQuotaError) {
      setShowStorageUpgradePrompt(true);
      clearStorageQuotaError();
    }
  }, [hasStorageQuotaError, clearStorageQuotaError]);

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

  const handleAttachmentsChange = useCallback(
    async (newAttachments: FileAttachment[]) => {
      attachmentsDirtyRef.current = true;

      const { hadRemoteDeletions, hadSuccessfulDeletions, finalAttachments } =
        await handleRemoteFileDeletions(newAttachments);

      if (hadSuccessfulDeletions) {
        filesDeletedRef.current = true;
      }

      if (!hadRemoteDeletions) {
        setAttachments(newAttachments);
      } else {
        // Remote deletions were processed — finalAttachments only has the old
        // files minus the deleted ones. Merge in any new local files from
        // newAttachments that aren't already present (e.g. a re-recorded video).
        const finalIds = new Set(
          finalAttachments.map((a) => a.id || a.uri),
        );
        const newLocalFiles = newAttachments.filter(
          (a) => !a.isRemote && !finalIds.has(a.id || a.uri),
        );
        if (newLocalFiles.length > 0) {
          setAttachments([...finalAttachments, ...newLocalFiles]);
        }
      }
    },
    [handleRemoteFileDeletions, setAttachments],
  );

  // Handle save
  const handleSave = useCallback(
    async (data: {
      title: string;
      notes?: string | null;
      metadata: Record<string, unknown>;
      metadataSchema: MetadataSchema;
      completionStatus?: EntryCompletionStatus;
    }) => {
      if (!task || !planId) return;

      try {
        isSavingRef.current = true;

        let savedMessageId: string;

        if (isNew && !savedMessageIdRef.current) {
          const created = await createMutation.mutateAsync(data);
          savedMessageId = created.id;
          savedMessageIdRef.current = savedMessageId;
        } else {
          const existingId = savedMessageIdRef.current ?? entryId;
          await updateMutation.mutateAsync({
            messageId: existingId,
            data,
          });
          savedMessageId = existingId;
        }

        // Upload any pending files
        const pendingFiles = attachments.filter(
          (f) => !f.isRemote && f.uploadStatus !== "complete",
        );
        if (pendingFiles.length > 0) {
          const handleUploadFailure = (errorMessage: string) => {
            toast.error({
              title: "Upload failed",
              message: `${errorMessage} Your message has been saved. Try adding the files again.`,
            });
          };

          try {
            const uploadResults = await uploadFiles(
              { messageId: savedMessageId },
              attachments,
            );

            // Invalidate both the single message cache and the list cache
            // so that initialData in useMessageQuery returns fresh data with files
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: queryKeys.messages.single(planId, savedMessageId),
              }),
              queryClient.invalidateQueries({
                queryKey: queryKeys.messages.byTaskKey(planId, task.taskKey),
              }),
            ]);

            const failedUploads = uploadResults.filter(
              (r) => !r.success && !r.isStorageQuotaError,
            );

            if (failedUploads.length > 0) {
              handleUploadFailure(
                `${failedUploads.length} file${failedUploads.length > 1 ? "s" : ""} failed to upload.`,
              );
              return;
            }
          } catch (uploadError) {
            if (isStorageQuotaError(uploadError)) {
              setShowStorageUpgradePrompt(true);
              return;
            }
            handleUploadFailure("An error occurred during file upload.");
            return;
          }
        }

        allowNavigationRef.current = true;
        router.back();
      } catch (error) {
        if (isStorageQuotaError(error)) {
          setShowStorageUpgradePrompt(true);
          return;
        }
        if (
          error instanceof MessageQuotaExceededError ||
          isQuotaExceededError(error)
        ) {
          setShowUpgradePrompt(true);
          return;
        }
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
    allowNavigationRef.current = true;
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
        initialData={message}
        onSave={handleSave}
        onDelete={isNew ? undefined : handleDelete}
        onCancel={handleCancel}
        isSaving={isSaving || deletingFileIds.size > 0}
        attachments={attachmentsWithUploadState}
        onAttachmentsChange={handleAttachmentsChange}
        isUploading={isUploading}
        deletingFileIds={deletingFileIds}
        onStorageUpgradeRequired={() => setShowStorageUpgradePrompt(true)}
        readOnly={isReadOnly}
        onFormReady={handleFormReady}
      />
      {!isReadOnly && <KeyboardDoneButton accentColor={colors.featureLegacy} />}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title={
          isViewingSharedPlan ? "Limit Reached" : "You've Reached Your Limit"
        }
        message={
          isViewingSharedPlan
            ? `This plan has reached its message limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
            : "You've made great progress with your legacy messages. Upgrade your plan to add more."
        }
        hideUpgradeAction={isViewingSharedPlan}
      />
      <UpgradePrompt
        visible={showStorageUpgradePrompt}
        onClose={() => setShowStorageUpgradePrompt(false)}
        title="Storage Limit Reached"
        message={
          isViewingSharedPlan
            ? `This plan has reached its storage limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
            : "This file would exceed your storage limit. Upgrade your plan for more storage space."
        }
        hideUpgradeAction={isViewingSharedPlan}
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
