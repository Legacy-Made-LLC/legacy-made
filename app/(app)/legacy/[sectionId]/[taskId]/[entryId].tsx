/**
 * Legacy Entry Screen - Create/Edit Form (Auto-Save Orchestrator)
 *
 * Displays the form for creating or editing a legacy message entry
 * (used for list-based tasks: Messages to People, Future Moments).
 *
 * Auto-save behavior:
 * - Subscribes to form state changes and triggers debounced saves when dirty
 * - New entries: only persists when at least one field is non-empty
 * - After first create: replaces route with real entry ID
 * - Navigation away flushes pending saves (no "discard" dialog)
 * - Status toggle writes bypass debounce for immediate persistence
 *
 * entryId = "new" for creating a new entry
 * entryId = <uuid> for editing an existing entry
 */

import type { AnyFormApi } from "@tanstack/form-core";
import { useQueryClient } from "@tanstack/react-query";

import {
  apiFilesToAttachments,
  type EntryCompletionStatus,
  type FileAttachment,
} from "@/api/types";
import { UpgradePrompt } from "@/components/entitlements";
import {
  getLegacyEntryFormComponent,
  type LegacyEntrySaveData,
} from "@/components/legacy/registry";
import { EntryStatusFooter } from "@/components/ui/EntryStatusFooter";
import { KeyboardDoneButton } from "@/components/ui/KeyboardDoneButton";
import { SavedIndicator } from "@/components/ui/SavedIndicator";
import { UndoButton } from "@/components/ui/UndoButton";
import { useLegacyTask } from "@/constants/legacy";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import {
  useCreateMessage,
  useDeleteMessage,
  useMessageQuery,
  useUpdateMessage,
} from "@/hooks/queries";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormUndo } from "@/hooks/useFormUndo";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast, UNDO_TOAST_DURATION } from "@/hooks/useToast";
import { isStorageQuotaError } from "@/lib/entitlementHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

/**
 * Check if form data has any non-empty content worth saving.
 */
function isFormNonEmpty(data: LegacyEntrySaveData): boolean {
  if (data.title && data.title !== "Draft" && data.title.trim() !== "") {
    return true;
  }
  if (data.notes && data.notes.trim() !== "") return true;
  for (const value of Object.values(data.metadata)) {
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return true;
  }
  return false;
}

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

  const task = useLegacyTask(sectionId, taskId);
  const isNew = entryId === "new";

  // Form and save data refs
  const formRef = useRef<AnyFormApi | null>(null);
  const getSaveDataRef = useRef<(() => LegacyEntrySaveData | null) | null>(null);
  const attachmentsRef = useRef<FileAttachment[]>([]);

  // Track completion status locally
  const [completionStatus, setCompletionStatus] =
    useState<EntryCompletionStatus>("draft");
  const completionStatusRef = useRef(completionStatus);
  completionStatusRef.current = completionStatus;

  // Track if the entry has been created (for new entries)
  const hasCreatedRef = useRef(!isNew);

  const handleFormReady = useCallback((form: AnyFormApi) => {
    formRef.current = form;
  }, []);

  // Redirect back if trying to create new entry on a read-only plan
  useEffect(() => {
    if (isReadOnly && isNew) {
      router.back();
    }
  }, [isReadOnly, isNew, router]);

  // Get the form component for this task
  const FormComponent = task
    ? getLegacyEntryFormComponent(task.taskKey)
    : undefined;

  // Fetch message data if editing
  const { data: message, isLoading } = useMessageQuery(
    isNew ? undefined : entryId,
    task?.taskKey,
  );

  // Initialize completion status from message data
  useEffect(() => {
    if (message?.completionStatus) {
      setCompletionStatus(message.completionStatus);
    }
  }, [message?.completionStatus]);

  // Mutations
  const createMutation = useCreateMessage(task?.taskKey);
  const updateMutation = useUpdateMessage(task?.taskKey);
  const deleteMutation = useDeleteMessage(task?.taskKey);

  // Guard against concurrent file uploads
  const isUploadingRef = useRef(false);

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

  // ============================================================================
  // Auto-Save Integration
  // ============================================================================

  const autoSave = useAutoSave<LegacyEntrySaveData & { completionStatus?: EntryCompletionStatus }>({
    debounceMs: 600,
    savedDurationMs: 1500,
    initialId: isNew ? undefined : entryId,
    onCreate: async (data) => {
      isSavingRef.current = true;
      try {
        const created = await createMutation.mutateAsync({
          ...data,
          completionStatus: data.completionStatus ?? completionStatusRef.current,
        });
        hasCreatedRef.current = true;
        return created.id;
      } finally {
        isSavingRef.current = false;
      }
    },
    onUpdate: async (id, data) => {
      isSavingRef.current = true;
      try {
        await updateMutation.mutateAsync({
          messageId: id,
          data: {
            ...data,
            completionStatus: data.completionStatus ?? completionStatusRef.current,
          },
        });
      } finally {
        isSavingRef.current = false;
      }
    },
    onSaveComplete: async (savedMessageId) => {
      // After first create for a "new" entry, replace the route
      if (isNew && hasCreatedRef.current && entryId === "new") {
        router.replace(
          `/(app)/legacy/${sectionId}/${taskId}/${savedMessageId}`,
        );
      }

      // Upload any pending files
      if (isUploadingRef.current) return;
      const pendingFiles = attachmentsRef.current.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      if (pendingFiles.length > 0 && planId && task) {
        try {
          isUploadingRef.current = true;
          const uploadResults = await uploadFiles(
            { messageId: savedMessageId },
            attachmentsRef.current,
          );

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
            toast.error({
              title: "Upload failed",
              message: `${failedUploads.length} file${failedUploads.length > 1 ? "s" : ""} failed to upload. Try adding them again.`,
            });
          }
        } catch (uploadError) {
          if (isStorageQuotaError(uploadError)) {
            setShowStorageUpgradePrompt(true);
          } else {
            toast.error({
              title: "Upload error",
              message: "An error occurred during file upload.",
            });
          }
        } finally {
          isUploadingRef.current = false;
        }
      }
    },
    onSaveInitiated: () => {
      const form = formRef.current;
      if (form) {
        formUndo.archive(form.state.values as Record<string, unknown>);
      }
    },
  });

  // Set up form value subscription for auto-save
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    if (isReadOnly) return;

    const unsubscribe = form.store.subscribe(() => {
      const state = form.store.state;
      const getSaveData = getSaveDataRef.current;

      if (state.isDirty && getSaveData) {
        const saveData = getSaveData();
        if (saveData) {
          if (!hasCreatedRef.current && !isFormNonEmpty(saveData)) {
            return;
          }
          autoSave.triggerSave(
            { ...saveData, completionStatus: completionStatusRef.current },
            state.isDirty,
          );
        }
      }
    });

    return unsubscribe;
  }, [autoSave, isReadOnly]);

  // Handle auto-save errors (quota exceeded)
  useEffect(() => {
    if (autoSave.status === "error") {
      const error = autoSave.errorMessage;
      if (error?.includes("quota") || error?.includes("limit")) {
        if (error.toLowerCase().includes("storage")) {
          setShowStorageUpgradePrompt(true);
        } else {
          setShowUpgradePrompt(true);
        }
        autoSave.dismissError();
      }
    }
  }, [autoSave]);

  // Navigation protection: flush pending save on navigate
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isReadOnly) return;

      const form = formRef.current;
      const hasPendingSave =
        autoSave.status === "pending" || autoSave.status === "saving";
      const isDirty = form?.state.isDirty ?? false;
      const hasPendingFiles = attachmentsRef.current.some(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );

      if (!hasPendingSave && !isDirty && !hasPendingFiles) {
        return;
      }

      e.preventDefault();

      autoSave
        .flushSave()
        .then(() => {
          navigation.dispatch(e.data.action);
        })
        .catch(() => {
          Alert.alert(
            "Could Not Save",
            "Your changes could not be saved. Discard them?",
            [
              { text: "Stay", style: "cancel" },
              {
                text: "Discard",
                style: "destructive",
                onPress: () => navigation.dispatch(e.data.action),
              },
            ],
          );
        });
    });

    return unsubscribe;
  }, [navigation, isReadOnly, autoSave]);

  // ============================================================================
  // Status Toggle
  // ============================================================================

  const handleToggleStatus = useCallback(async () => {
    const newStatus: EntryCompletionStatus =
      completionStatus === "draft" ? "complete" : "draft";
    setCompletionStatus(newStatus);

    const getSaveData = getSaveDataRef.current;
    if (getSaveData) {
      const saveData = getSaveData();
      if (saveData) {
        try {
          autoSave.triggerSave(
            { ...saveData, completionStatus: newStatus },
            true,
            { immediate: true },
          );
        } catch (error) {
          setCompletionStatus(completionStatus);
          const msg =
            error instanceof Error ? error.message : "Failed to update status";
          toast.error({ message: msg });
        }
      }
    }
  }, [completionStatus, autoSave]);

  // ============================================================================
  // Undo Support
  // ============================================================================

  const formUndo = useFormUndo<Record<string, unknown>>();
  const isUndoingRef = useRef(false);

  // Seed the undo stack with initial form values as baseline
  const initialSnapshotTaken = useRef(false);
  useEffect(() => {
    if (initialSnapshotTaken.current) return;
    const form = formRef.current;
    if (form) {
      initialSnapshotTaken.current = true;
      formUndo.archive(form.state.values as Record<string, unknown>);
    }
  });

  const handleDiscreteChange = useCallback(() => {
    const getSaveData = getSaveDataRef.current;
    if (!getSaveData) return;
    const saveData = getSaveData();
    if (!saveData) return;
    if (!hasCreatedRef.current && !isFormNonEmpty(saveData)) return;
    autoSave.triggerSave(
      { ...saveData, completionStatus: completionStatusRef.current },
      true,
      { immediate: true },
    );
  }, [autoSave]);

  /** Apply a snapshot to the form and trigger a save */
  const applySnapshot = useCallback(
    (snapshot: Record<string, unknown>) => {
      const form = formRef.current;
      if (!form) return;

      isUndoingRef.current = true;
      for (const [key, value] of Object.entries(snapshot)) {
        form.setFieldValue(key, value);
      }
      isUndoingRef.current = false;

      const getSaveData = getSaveDataRef.current;
      if (getSaveData) {
        const saveData = getSaveData();
        if (saveData) {
          autoSave.triggerSave(
            { ...saveData, completionStatus: completionStatusRef.current },
            true,
          );
        }
      }
    },
    [autoSave],
  );

  const handleRedo = useCallback(() => {
    if (!formUndo.canRedo) return;
    const restored = formUndo.redo();
    if (!restored) return;
    applySnapshot(restored);
    toast.info({ message: "Redid change", duration: UNDO_TOAST_DURATION });
  }, [formUndo, applySnapshot]);

  const handleUndo = useCallback(() => {
    const form = formRef.current;
    if (!form || !formUndo.canUndo) return;

    const reverted = formUndo.undo();
    if (!reverted) return;
    applySnapshot(reverted);

    toast.undo({
      message: "Undid last change",
      duration: UNDO_TOAST_DURATION,
      actionLabel: "Redo",
      onAction: handleRedo,
    });
  }, [formUndo, applySnapshot, handleRedo]);

  useEffect(() => {
    if (isReadOnly) return;
    navigation.setOptions({
      headerRight: () => (
        <UndoButton canUndo={formUndo.canUndo} onUndo={handleUndo} />
      ),
    });
  }, [navigation, isReadOnly, formUndo.canUndo, handleUndo]);

  // ============================================================================
  // File Upload
  // ============================================================================

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
      const { hadRemoteDeletions, hadSuccessfulDeletions, finalAttachments } =
        await handleRemoteFileDeletions(newAttachments);

      if (hadSuccessfulDeletions) {
        filesDeletedRef.current = true;
      }

      if (!hadRemoteDeletions) {
        setAttachments(newAttachments);
      } else {
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

      // If there are new local files, ensure entry is saved first then upload
      const addedLocalFiles = newAttachments.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      if (addedLocalFiles.length > 0 && !isUploadingRef.current) {
        let savedId = autoSave.recordId;

        if (!savedId) {
          const getSaveData = getSaveDataRef.current;
          if (getSaveData) {
            const saveData = getSaveData();
            if (saveData) {
              autoSave.triggerSave(
                { ...saveData, completionStatus: completionStatusRef.current },
                true,
              );
              try {
                savedId = await autoSave.flushSave();
              } catch {
                toast.error({
                  message:
                    "Could not save before uploading files. Please try again.",
                });
                return;
              }
            }
          }
        }

        if (savedId) {
          isUploadingRef.current = true;
          uploadFiles({ messageId: savedId }, newAttachments).finally(() => {
            isUploadingRef.current = false;
          });
        }
      }
    },
    [
      handleRemoteFileDeletions,
      setAttachments,
      autoSave,
      uploadFiles,
    ],
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!entryId || isNew) return;

    await deleteMutation.mutateAsync(entryId);
    router.back();
  }, [entryId, isNew, deleteMutation, router]);

  // ============================================================================
  // Render
  // ============================================================================

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  if (!FormComponent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No form component registered for task: {task.taskKey}
        </Text>
      </View>
    );
  }

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
        registerGetSaveData={(fn) => {
          getSaveDataRef.current = fn;
        }}
        completionStatus={completionStatus}
        onDelete={isNew && !hasCreatedRef.current ? undefined : handleDelete}
        attachments={attachmentsWithUploadState}
        onAttachmentsChange={handleAttachmentsChange}
        isUploading={isUploading}
        deletingFileIds={deletingFileIds}
        onStorageUpgradeRequired={() => setShowStorageUpgradePrompt(true)}
        readOnly={isReadOnly}
        onFormReady={handleFormReady}
        onDiscreteChange={handleDiscreteChange}
      />
      {!isReadOnly && (
        <EntryStatusFooter
          status={completionStatus}
          onToggleStatus={handleToggleStatus}
          autoSaveStatus={autoSave.status}
          pillarColor={colors.featureLegacy}
          errorMessage={autoSave.errorMessage}
          onDismissError={autoSave.dismissError}
          readOnly={isReadOnly}
        />
      )}
      {!isReadOnly && (
        <SavedIndicator
          status={autoSave.status}
          errorMessage={autoSave.errorMessage}
          onDismissError={autoSave.dismissError}
          accentColor={colors.featureLegacy}
        />
      )}
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
