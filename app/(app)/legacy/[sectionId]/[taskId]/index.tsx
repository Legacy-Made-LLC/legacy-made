/**
 * Legacy Task Screen - Hybrid List/Singleton
 *
 * This screen handles both patterns:
 * - Singleton tasks (messages.story): Shows a single form with auto-save (like wishes)
 * - List tasks (messages.people, messages.future): Shows entry list (like vault)
 *
 * The task's `taskType` in legacy-structure.ts determines which pattern to use.
 */

import type { AnyFormApi } from "@tanstack/form-core";
import { useQueryClient } from "@tanstack/react-query";

import type { FileAttachment } from "@/api/types";
import { apiFilesToAttachments } from "@/api/types";
import { UpgradePrompt } from "@/components/entitlements";
import { KeyboardDoneButton } from "@/components/ui/KeyboardDoneButton";
import { SavedIndicator } from "@/components/ui/SavedIndicator";
import { TaskCompletionFooter } from "@/components/ui/TaskCompletionFooter";
import {
  getLegacyListComponent,
  getLegacySingletonFormComponent,
  type LegacyFormGuidance,
  type LegacySaveData,
} from "@/components/legacy/registry";
import { colors, spacing, typography } from "@/constants/theme";
import {
  useLegacySection,
  useLegacySectionByTaskKey,
  useLegacyTask,
} from "@/constants/legacy";
import { isLegacyTaskSingleton } from "@/constants/legacy-structure";
import { usePlan } from "@/data/PlanProvider";
import {
  useCreateMessage,
  useMessagesQuery,
  useUpdateMessage,
} from "@/hooks/queries";
import { useSetProgressIfNew } from "@/hooks/queries/useProgressMutations";
import { useAutoSave } from "@/hooks/useAutoSave";
import { usePillarGuard } from "@/hooks/usePillarGuard";
import { useFileAttachments } from "@/hooks/useFileAttachments";
import { useFileUpload } from "@/hooks/useFileUpload";
import { isStorageQuotaError } from "@/lib/entitlementHelpers";
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
import { toast, UNDO_TOAST_DURATION } from "@/hooks/useToast";
import { useFormUndo } from "@/hooks/useFormUndo";
import { UndoButton } from "@/components/ui/UndoButton";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

export default function LegacyTaskScreen() {
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { planId, isReadOnly, isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showStorageUpgradePrompt, setShowStorageUpgradePrompt] =
    useState(false);

  const { guardOverlay } = usePillarGuard({
    pillar: "messages",
    featureName: "Legacy Messages",
    lockedDescription: "Record video messages and memories to share with your loved ones when the time is right.",
    restrictedDescription: "Your access level doesn't include Legacy Messages for this plan.",
  });

  const section = useLegacySection(sectionId);
  const task = useLegacyTask(sectionId, taskId);
  const sectionByKey = useLegacySectionByTaskKey(task?.taskKey ?? "");

  const isSingleton = task ? isLegacyTaskSingleton(task.taskKey) : false;

  // Set the header title before first render
  useLayoutEffect(() => {
    if (task) {
      navigation.setOptions({
        title: task.title,
        headerDescription: task.description,
      });
    }
  }, [task, navigation]);

  // Get components for this task
  const FormComponent = task ? getLegacySingletonFormComponent(task.taskKey) : undefined;
  const ListComponent = task ? getLegacyListComponent(task.taskKey) : undefined;

  // Fetch messages for this task
  const {
    data: messages = [],
    isLoading,
    isFetched,
  } = useMessagesQuery(task?.taskKey);

  // Get the existing message if singleton
  const existingMessage = isSingleton ? messages[0] : undefined;

  // Backwards compatibility: auto-set progress to "in_progress" when a message
  // exists but no progress record has been created yet
  const { setIfNew } = useSetProgressIfNew();
  useEffect(() => {
    if (isFetched && messages.length > 0 && task?.taskKey) {
      setIfNew(task.taskKey);
    }
  }, [isFetched, messages.length, task?.taskKey, setIfNew]);

  // Build guidance props for singleton form
  const guidance: LegacyFormGuidance | undefined = useMemo(() => {
    if (!isSingleton || !task?.triggerText || !task?.guidance) return undefined;
    return {
      icon: task.ionIcon ?? sectionByKey?.ionIcon,
      triggerText: task.triggerText,
      heading: task.guidanceHeading,
      detail: task.guidance,
      tips: task.tips,
      pacingNote: task.pacingNote,
    };
  }, [task, sectionByKey, isSingleton]);

  // Mutations
  const createMutation = useCreateMessage(task?.taskKey);
  const updateMutation = useUpdateMessage(task?.taskKey);

  // Track if files were changed during this session
  const filesChangedRef = useRef(false);

  // Guard against concurrent file uploads (onSaveComplete + handleAttachmentsChange race)
  const isUploadingRef = useRef(false);
  const attachmentsRef = useRef<FileAttachment[]>([]);

  // File attachments management
  const {
    attachments,
    setAttachments,
    deletingFileIds,
    handleRemoteFileDeletions,
  } = useFileAttachments();
  attachmentsRef.current = attachments;

  // Form reference for auto-save integration (singleton only)
  const formRef = useRef<AnyFormApi | null>(null);
  const getSaveDataRef = useRef<(() => LegacySaveData) | null>(null);

  // ============================================================================
  // Undo / Redo (Singleton Only)
  // ============================================================================

  const formUndo = useFormUndo<Record<string, unknown>>();
  const isUndoingRef = useRef(false);

  // ============================================================================
  // Auto-Save Integration (Singleton Only)
  // ============================================================================

  const autoSave = useAutoSave<LegacySaveData>({
    debounceMs: 600,
    savedDurationMs: 1500,
    initialId: existingMessage?.id,
    onCreate: async (data) => {
      const created = await createMutation.mutateAsync(data);
      return created.id;
    },
    onUpdate: async (id, data) => {
      await updateMutation.mutateAsync({ messageId: id, data });
    },
    onSaveComplete: async (messageId) => {
      if (isUploadingRef.current) return;

      const pendingFiles = attachments.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      if (pendingFiles.length > 0 && planId && task) {
        try {
          isUploadingRef.current = true;
          const uploadResults = await uploadFiles({ messageId }, attachments);

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: queryKeys.messages.byTaskKey(planId, task.taskKey),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.messages.all(planId),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.messages.counts(planId),
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

  // Update autoSave when existingMessage changes
  useEffect(() => {
    if (existingMessage?.id && autoSave.recordId !== existingMessage.id) {
      autoSave.reset(existingMessage.id);
    }
  }, [existingMessage?.id, autoSave]);

  // Handle form ready callback from child form
  const handleFormReady = useCallback((form: AnyFormApi) => {
    formRef.current = form;
  }, []);

  // Set up form value subscription for auto-save (singleton only)
  useEffect(() => {
    if (!isSingleton) return;
    const form = formRef.current;
    if (!form) return;

    const unsubscribe = form.store.subscribe(() => {
      if (isReadOnly) return;
      const state = form.store.state;
      const getSaveData = getSaveDataRef.current;

      if (state.isDirty && getSaveData) {
        const saveData = getSaveData();
        autoSave.triggerSave(saveData, state.isDirty);
      }
    });

    return unsubscribe;
  }, [autoSave, isReadOnly, isSingleton]);

  // Seed the undo stack with initial form values as baseline (singleton only)
  const initialSnapshotTaken = useRef(false);
  useEffect(() => {
    if (!isSingleton || initialSnapshotTaken.current) return;
    const form = formRef.current;
    if (form) {
      initialSnapshotTaken.current = true;
      formUndo.archive(form.state.values as Record<string, unknown>);
    }
  });

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
        autoSave.triggerSave(saveData, true);
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

  // Set undo button in header (singleton only)
  useEffect(() => {
    if (!isSingleton || isReadOnly) return;
    navigation.setOptions({
      headerRight: () => (
        <UndoButton canUndo={formUndo.canUndo} onUndo={handleUndo} />
      ),
    });
  }, [navigation, isReadOnly, isSingleton, formUndo.canUndo, handleUndo]);

  // Navigation protection for singleton (ensure pending saves complete before leaving)
  useEffect(() => {
    if (!isSingleton) return;

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const form = formRef.current;
      const hasPendingSave =
        autoSave.status === "pending" || autoSave.status === "saving";
      const isDirty = form?.state.isDirty ?? false;

      // Check for pending file attachments (added but not yet uploaded)
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
  }, [navigation, autoSave, isSingleton]);

  // Handle auto-save errors
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

  // ============================================================================
  // File Attachments (Singleton Only)
  // ============================================================================

  // Initialize attachments when message data loads
  useEffect(() => {
    if (isSingleton && existingMessage?.files) {
      setAttachments(apiFilesToAttachments(existingMessage.files));
    }
  }, [existingMessage?.files, setAttachments, isSingleton]);

  // Refs to capture current values for unmount cleanup
  const planIdRef = useRef(planId);
  const taskKeyRef = useRef(task?.taskKey);
  planIdRef.current = planId;
  taskKeyRef.current = task?.taskKey;

  // Invalidate message caches on unmount if files were changed
  useEffect(() => {
    return () => {
      if (filesChangedRef.current && planIdRef.current && taskKeyRef.current) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.byTaskKey(
            planIdRef.current,
            taskKeyRef.current,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.all(planIdRef.current),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.counts(planIdRef.current),
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
      filesChangedRef.current = true;
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

  /**
   * Handle attachment changes from the singleton form.
   */
  const handleAttachmentsChange = useCallback(
    async (newAttachments: FileAttachment[]) => {
      const getFileIdentifier = (file: FileAttachment) => file.id || file.uri;

      const { hadRemoteDeletions, hadSuccessfulDeletions } =
        await handleRemoteFileDeletions(newAttachments);

      if (hadSuccessfulDeletions) {
        filesChangedRef.current = true;
      }

      if (hadRemoteDeletions) {
        return;
      }

      const addedLocalFiles = newAttachments.filter(
        (newFile) =>
          !newFile.isRemote &&
          !attachments.some(
            (current) =>
              getFileIdentifier(current) === getFileIdentifier(newFile)
          )
      );

      setAttachments(newAttachments);

      if (addedLocalFiles.length > 0) {
        let messageId = autoSave.recordId;

        if (!messageId) {
          const getSaveData = getSaveDataRef.current;
          if (getSaveData) {
            const saveData = getSaveData();
            autoSave.triggerSave(saveData, true);
            try {
              messageId = await autoSave.flushSave();
            } catch {
              toast.error({
                message: "Could not save before uploading files. Please try again.",
              });
              return;
            }
          }
        }

        if (messageId && !isUploadingRef.current) {
          isUploadingRef.current = true;
          uploadFiles({ messageId }, newAttachments).finally(() => {
            isUploadingRef.current = false;
          });
        }
      }
    },
    [attachments, handleRemoteFileDeletions, setAttachments, autoSave, uploadFiles]
  );

  // ============================================================================
  // List Handlers (List tasks only)
  // ============================================================================

  const handleEntryPress = (entryId: string) => {
    router.push(`/legacy/${sectionId}/${taskId}/${entryId}`);
  };

  const handleAddPress = () => {
    router.push(`/legacy/${sectionId}/${taskId}/new`);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (guardOverlay) {
    return guardOverlay;
  }

  if (!section || !task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  if (isLoading || !isFetched) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.featureLegacy} />
      </View>
    );
  }

  // ============================================================================
  // Singleton Rendering (Your Story)
  // ============================================================================
  if (isSingleton && FormComponent) {
    return (
      <>
        <FormComponent
          taskKey={task.taskKey}
          messageId={
            autoSave.recordId ?? (existingMessage ? existingMessage.id : undefined)
          }
          initialData={existingMessage}
          onFormReady={handleFormReady}
          registerGetSaveData={(fn: () => LegacySaveData) => {
            getSaveDataRef.current = fn;
          }}
          guidance={guidance}
          attachments={attachmentsWithUploadState}
          onAttachmentsChange={isReadOnly ? undefined : handleAttachmentsChange}
          isUploading={isUploading}
          deletingFileIds={deletingFileIds}
          onStorageUpgradeRequired={() => setShowStorageUpgradePrompt(true)}
          readOnly={isReadOnly}
        />
        {(existingMessage || autoSave.recordId) && task && !isReadOnly && (
          <TaskCompletionFooter
            taskKey={task.taskKey}
            pillarColor={colors.featureLegacy}
            pillarTint={colors.featureLegacyTint}
            onComeBackLater={() => router.back()}
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
          title={isViewingSharedPlan ? "Limit Reached" : "You've Reached Your Limit"}
          message={
            isViewingSharedPlan
              ? `This plan has reached its limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
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

  // ============================================================================
  // List Rendering (Messages to People, Future Moments)
  // ============================================================================
  if (!isSingleton && ListComponent) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.listContainer}>
          <ListComponent
            taskKey={task.taskKey}
            messages={messages}
            isLoading={isLoading}
            onEntryPress={handleEntryPress}
            onAddPress={handleAddPress}
            readOnly={isReadOnly}
          />
        </View>
        {messages.length > 0 && !isReadOnly && (
          <TaskCompletionFooter
            taskKey={task.taskKey}
            pillarColor={colors.featureLegacy}
            pillarTint={colors.featureLegacyTint}
            onComeBackLater={() => router.back()}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        No component registered for task: {task.taskKey}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
  },
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
