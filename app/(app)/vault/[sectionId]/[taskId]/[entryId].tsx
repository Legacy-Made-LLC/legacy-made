/**
 * Entry Screen - Create/Edit Form (Auto-Save Orchestrator)
 *
 * Displays the form for creating or editing an entry using the registered
 * form component for that task type.
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
import { EntryStatusFooter } from "@/components/ui/EntryStatusFooter";
import { KeyboardDoneButton } from "@/components/ui/KeyboardDoneButton";
import { SavedIndicator } from "@/components/ui/SavedIndicator";
import { UndoButton } from "@/components/ui/UndoButton";
import {
  getFormComponent,
  type EntrySaveData,
} from "@/components/vault/registry";
import { colors, spacing, typography } from "@/constants/theme";
import { useVaultTask } from "@/constants/vault";
import { usePlan } from "@/data/PlanProvider";
import {
  useCreateEntry,
  useDeleteEntry,
  useEntryQuery,
  useUpdateEntry,
} from "@/hooks/queries";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormUndo } from "@/hooks/useFormUndo";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useTrackSectionActivity } from "@/hooks/useReminderPrompt";
import { toast, UNDO_TOAST_DURATION } from "@/hooks/useToast";
import { isStorageQuotaError } from "@/lib/entitlementHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

/**
 * Check if form data has any non-empty content worth saving.
 * Prevents creating empty entries when user taps "+" then navigates away.
 */
function isFormNonEmpty(data: EntrySaveData): boolean {
  // Check title (excluding default "Draft" placeholder)
  if (data.title && data.title !== "Draft" && data.title.trim() !== "") {
    return true;
  }
  // Check notes
  if (data.notes && data.notes.trim() !== "") return true;
  // Check metadata fields
  for (const value of Object.values(data.metadata)) {
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    return true;
  }
  return false;
}

export default function EntryScreen() {
  useTrackSectionActivity();

  const { sectionId, taskId, entryId, isNew: isNewParam } =
    useLocalSearchParams<{
      sectionId: string;
      taskId: string;
      entryId: string;
      isNew?: string;
    }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { planId, isReadOnly, isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showStorageUpgradePrompt, setShowStorageUpgradePrompt] =
    useState(false);

  const task = useVaultTask(sectionId, taskId);
  const isNew = isNewParam === "1";

  // Form and save data refs
  const formRef = useRef<AnyFormApi | null>(null);
  const getSaveDataRef = useRef<(() => EntrySaveData | null) | null>(null);
  const attachmentsRef = useRef<FileAttachment[]>([]);

  // Track completion status locally (initialized from entry data or "draft" for new)
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
  const FormComponent = task ? getFormComponent(task.taskKey) : undefined;

  // Fetch entry data if editing (pass taskKey to enable initialData from list cache)
  const { data: entry, isLoading } = useEntryQuery(
    isNew ? undefined : entryId,
    task?.taskKey,
  );

  // Initialize completion status from entry data
  useEffect(() => {
    if (entry?.completionStatus) {
      setCompletionStatus(entry.completionStatus);
    }
  }, [entry?.completionStatus]);

  // Mutations
  const createMutation = useCreateEntry(task?.taskKey);
  const updateMutation = useUpdateEntry(task?.taskKey);
  const deleteMutation = useDeleteEntry(task?.taskKey);

  // Guard against concurrent file uploads
  const isUploadingRef = useRef(false);

  // File attachments management (shared hook for deletion logic)
  const {
    attachments,
    setAttachments,
    deletingFileIds,
    handleRemoteFileDeletions,
  } = useFileAttachments();
  attachmentsRef.current = attachments;

  // Track if we're currently saving to prevent entry refetch from overwriting local attachments
  const isSavingRef = useRef(false);

  // Track if files were deleted during this session (for cache invalidation on unmount)
  const filesDeletedRef = useRef(false);

  // Initialize attachments when entry data loads (but not during save/upload)
  useEffect(() => {
    if (isSavingRef.current) return;
    if (entry?.files) {
      setAttachments(apiFilesToAttachments(entry.files));
    }
  }, [entry?.files, setAttachments]);

  // Refs to capture current values for unmount cleanup
  const planIdRef = useRef(planId);
  const entryIdRef = useRef(entryId);
  const taskKeyRef = useRef(task?.taskKey);
  planIdRef.current = planId;
  entryIdRef.current = entryId;
  taskKeyRef.current = task?.taskKey;

  // Remove stale cache on unmount if files were deleted.
  // We use removeQueries (not invalidateQueries) because invalidation marks
  // queries as stale but leaves data in place — initialData in useEntryQuery
  // would still return the stale entry with deleted file references.
  useEffect(() => {
    return () => {
      if (
        filesDeletedRef.current &&
        planIdRef.current &&
        entryIdRef.current &&
        entryIdRef.current !== "new"
      ) {
        queryClient.removeQueries({
          queryKey: queryKeys.entries.single(
            planIdRef.current,
            entryIdRef.current,
          ),
        });
        if (taskKeyRef.current) {
          queryClient.removeQueries({
            queryKey: queryKeys.entries.byTaskKey(
              planIdRef.current,
              taskKeyRef.current,
            ),
          });
        }
      }
    };
  }, [queryClient]);

  // Polling for processing videos - check every 5 seconds, max 5 retries
  const videoPollingRetryCount = useRef(0);
  const VIDEO_POLLING_INTERVAL = 5000;
  const VIDEO_POLLING_MAX_RETRIES = 5;

  useEffect(() => {
    const hasProcessingVideos = attachments.some(
      (a) => a.type === "video" && a.isProcessing && a.isRemote,
    );

    if (
      !hasProcessingVideos ||
      videoPollingRetryCount.current >= VIDEO_POLLING_MAX_RETRIES
    ) {
      return;
    }

    if (isSavingRef.current) return;

    const pollTimer = setTimeout(() => {
      videoPollingRetryCount.current += 1;
      if (planId && entryId && entryId !== "new") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.entries.single(planId, entryId),
        });
      }
    }, VIDEO_POLLING_INTERVAL);

    return () => clearTimeout(pollTimer);
  }, [attachments, planId, entryId, queryClient]);

  useEffect(() => {
    const hasProcessingVideos = attachments.some(
      (a) => a.type === "video" && a.isProcessing && a.isRemote,
    );
    if (!hasProcessingVideos) {
      videoPollingRetryCount.current = 0;
    }
  }, [attachments]);

  // ============================================================================
  // Auto-Save Integration
  // ============================================================================

  const autoSave = useAutoSave<EntrySaveData & { completionStatus?: EntryCompletionStatus }>({
    debounceMs: 600,
    savedDurationMs: 1500,
    initialId: isNew ? undefined : entryId,
    onCreate: async (data) => {
      isSavingRef.current = true;
      try {
        const created = await createMutation.mutateAsync({
          id: entryId,
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
          entryId: id,
          data: {
            ...data,
            completionStatus: data.completionStatus ?? completionStatusRef.current,
          },
        });
      } finally {
        isSavingRef.current = false;
      }
    },
    onSaveComplete: async (savedEntryId) => {
      // Upload any pending files
      if (isUploadingRef.current) return;
      const pendingFiles = attachmentsRef.current.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      if (pendingFiles.length > 0 && planId && task) {
        try {
          isUploadingRef.current = true;
          const uploadResults = await uploadFiles(
            { entryId: savedEntryId },
            attachmentsRef.current,
          );

          await queryClient.invalidateQueries({
            queryKey: queryKeys.entries.single(planId, savedEntryId),
          });

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
          // For new entries, don't persist until the form has content
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

    return () => unsubscribe.unsubscribe();
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

  // Navigation protection: flush pending save on navigate (no "discard" dialog)
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

      // Flush save, then allow navigation
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

    // Write immediately (bypass debounce)
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
          // Revert on failure
          setCompletionStatus(completionStatus);
          const message =
            error instanceof Error ? error.message : "Failed to update status";
          toast.error({ message });
        }
      }
    }
  }, [completionStatus, autoSave]);

  // ============================================================================
  // Undo Support
  // ============================================================================

  const formUndo = useFormUndo<Record<string, unknown>>();
  const isUndoingRef = useRef(false);

  // Seed the undo stack with the initial form values so the very first
  // edit has a baseline to revert to.
  const initialSnapshotTaken = useRef(false);
  useEffect(() => {
    if (initialSnapshotTaken.current) return;
    const form = formRef.current;
    if (form) {
      initialSnapshotTaken.current = true;
      formUndo.archive(form.state.values as Record<string, unknown>);
    }
  });

  // When a discrete field changes (toggle, select, pill), save immediately
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

  // Set undo button in header
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
    onFileUploaded: (file, fileId, downloadUrl, isEncrypted) => {
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri
            ? {
                ...a,
                id: fileId,
                uri: downloadUrl || a.uri,
                uploadStatus: "complete",
                isRemote: true,
                isEncrypted,
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

  /**
   * Handle attachment changes from the form.
   * For removed files: Deletes remote files from the server.
   * For added files: Triggers upload after ensuring entry is saved.
   */
  const handleAttachmentsChange = useCallback(
    async (newAttachments: FileAttachment[]) => {
      const { hadRemoteDeletions, hadSuccessfulDeletions, finalAttachments } =
        await handleRemoteFileDeletions(newAttachments);

      if (hadSuccessfulDeletions) {
        filesDeletedRef.current = true;
        // Immediately clear stale cache so deleted file references aren't
        // served via initialData if the user navigates away and back
        if (planId && entryId && entryId !== "new") {
          queryClient.removeQueries({
            queryKey: queryKeys.entries.single(planId, entryId),
          });
          if (task?.taskKey) {
            queryClient.removeQueries({
              queryKey: queryKeys.entries.byTaskKey(planId, task.taskKey),
            });
          }
        }
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

        // If entry hasn't been created yet, flush save first
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
          uploadFiles({ entryId: savedId }, newAttachments).finally(() => {
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
      planId,
      entryId,
      task,
      queryClient,
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
        initialData={entry}
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
          pillarColor={colors.featureInformation}
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
          accentColor={colors.featureInformation}
        />
      )}
      {!isReadOnly && (
        <KeyboardDoneButton accentColor={colors.featureInformation} />
      )}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title={
          isViewingSharedPlan ? "Limit Reached" : "You've Reached Your Limit"
        }
        message={
          isViewingSharedPlan
            ? `This plan has reached its entry limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
            : "You've made great progress organizing your legacy. Upgrade your plan to add more entries and unlock additional features."
        }
        hideUpgradeAction={isViewingSharedPlan}
        placement="info_limit_reached"
      />
      <UpgradePrompt
        visible={showStorageUpgradePrompt}
        onClose={() => setShowStorageUpgradePrompt(false)}
        title="Storage Limit Reached"
        message={
          isViewingSharedPlan
            ? `This plan has reached its storage limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
            : "This file would exceed your storage limit. Upgrade your plan for more storage space to keep all your important files safe."
        }
        hideUpgradeAction={isViewingSharedPlan}
        placement="storage_limit"
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
