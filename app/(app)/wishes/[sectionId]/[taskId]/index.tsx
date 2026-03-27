/**
 * Wishes Task Screen - Single Wish Form with Auto-Save
 *
 * Each task has exactly one wish. This screen directly shows the form:
 * - If a wish exists for this task, pre-populate the form for editing
 * - If no wish exists yet, show an empty form for creation
 *
 * Auto-save behavior:
 * - Changes are automatically saved after 600ms of inactivity
 * - A floating indicator shows save status (saving/saved/error)
 * - Navigation protection ensures pending saves complete before leaving
 *
 * There's no delete functionality since every task always has one wish
 * (either created or not yet created).
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
  getWishesFormComponent,
  type WishFormGuidance,
  type WishSaveData,
} from "@/components/wishes/registry";
import { colors, spacing, typography } from "@/constants/theme";
import {
  useWishesSection,
  useWishesSectionByTaskKey,
  useWishesTask,
} from "@/constants/wishes";
import { usePlan } from "@/data/PlanProvider";
import { useCreateWish, useUpdateWish, useWishesQuery } from "@/hooks/queries";
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

export default function WishesTaskScreen() {
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
    pillar: "wishes",
    featureName: "Wishes & Guidance",
    lockedDescription: "Share your personal wishes, values, and guidance for your loved ones.",
    restrictedDescription: "Your access level doesn't include Wishes & Guidance for this plan.",
  });

  const section = useWishesSection(sectionId);
  const task = useWishesTask(sectionId, taskId);
  const sectionByKey = useWishesSectionByTaskKey(task?.taskKey ?? "");

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

  // Backwards compatibility: auto-set progress to "in_progress" when a wish
  // exists but no progress record has been created yet (pre-progress-feature data)
  const { setIfNew } = useSetProgressIfNew();
  useEffect(() => {
    if (isFetched && existingWish && task?.taskKey) {
      setIfNew(task.taskKey);
    }
  }, [isFetched, existingWish, task?.taskKey, setIfNew]);

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

  // Track if files were changed during this session (to invalidate cache on unmount)
  const filesChangedRef = useRef(false);
  const attachmentsRef = useRef<FileAttachment[]>([]);

  // File attachments management (shared hook for deletion logic)
  const {
    attachments,
    setAttachments,
    deletingFileIds,
    handleRemoteFileDeletions,
  } = useFileAttachments();
  attachmentsRef.current = attachments;

  // Form reference for auto-save integration
  const formRef = useRef<AnyFormApi | null>(null);

  // Function to get current save data from form - set by child form
  const getSaveDataRef = useRef<(() => WishSaveData) | null>(null);

  // ============================================================================
  // Undo / Redo
  // ============================================================================

  const formUndo = useFormUndo<Record<string, unknown>>();
  const isUndoingRef = useRef(false);

  // ============================================================================
  // Auto-Save Integration
  // ============================================================================

  const autoSave = useAutoSave<WishSaveData>({
    debounceMs: 600,
    savedDurationMs: 1500,
    initialId: existingWish?.id,
    onCreate: async (data) => {
      const createdWish = await createMutation.mutateAsync(data);
      return createdWish.id;
    },
    onUpdate: async (id, data) => {
      await updateMutation.mutateAsync({ wishId: id, data });
    },
    onSaveComplete: async (wishId) => {
      // Upload any pending files after save completes
      const pendingFiles = attachments.filter(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      if (pendingFiles.length > 0 && planId && task) {
        try {
          const uploadResults = await uploadFiles({ wishId }, attachments);

          // Invalidate all wish caches after uploads so they include the new files
          // Must invalidate all related caches to prevent stale data from being re-seeded
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: queryKeys.wishes.byTaskKey(planId, task.taskKey),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.wishes.all(planId),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.wishes.counts(planId),
            }),
          ]);

          // Check for upload failures
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

  // Update autoSave when existingWish changes (e.g., after initial load)
  useEffect(() => {
    if (existingWish?.id && autoSave.recordId !== existingWish.id) {
      autoSave.reset(existingWish.id);
    }
  }, [existingWish?.id, autoSave]);

  // Handle form ready callback from child form
  const handleFormReady = useCallback((form: AnyFormApi) => {
    formRef.current = form;
  }, []);

  // Set up form value subscription for auto-save
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Subscribe to form state changes
    const unsubscribe = form.store.subscribe(() => {
      if (isReadOnly) return;
      const state = form.store.state;
      const getSaveData = getSaveDataRef.current;

      if (state.isDirty && getSaveData) {
        const saveData = getSaveData();
        autoSave.triggerSave(saveData, state.isDirty);
      }
    });

    return () => unsubscribe.unsubscribe();
  }, [autoSave, isReadOnly]);

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

  // Set undo button in header
  useEffect(() => {
    if (isReadOnly) return;
    navigation.setOptions({
      headerRight: () => (
        <UndoButton canUndo={formUndo.canUndo} onUndo={handleUndo} />
      ),
    });
  }, [navigation, isReadOnly, formUndo.canUndo, handleUndo]);

  // Navigation protection - ensure pending saves complete before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const form = formRef.current;
      const hasPendingSave =
        autoSave.status === "pending" || autoSave.status === "saving";
      const isDirty = form?.state.isDirty ?? false;

      // Check for pending file attachments (added but not yet uploaded)
      const hasPendingFiles = attachmentsRef.current.some(
        (f) => !f.isRemote && f.uploadStatus !== "complete",
      );
      // Allow navigation if nothing to save and no pending files
      if (!hasPendingSave && !isDirty && !hasPendingFiles) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Flush pending save, then allow navigation
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
  }, [navigation, autoSave]);

  // Handle auto-save errors
  useEffect(() => {
    if (autoSave.status === "error") {
      // Check for quota errors
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
  // File Attachments
  // ============================================================================

  // Initialize attachments when wish data loads
  useEffect(() => {
    if (existingWish?.files) {
      setAttachments(apiFilesToAttachments(existingWish.files));
    }
  }, [existingWish?.files, setAttachments]);

  // Refs to capture current values for unmount cleanup
  const planIdRef = useRef(planId);
  const taskKeyRef = useRef(task?.taskKey);
  planIdRef.current = planId;
  taskKeyRef.current = task?.taskKey;

  // Invalidate wish caches on unmount if files were changed during this session
  // This ensures fresh data is fetched when navigating back
  useEffect(() => {
    return () => {
      if (filesChangedRef.current && planIdRef.current && taskKeyRef.current) {
        // Invalidate all related caches to prevent stale data
        queryClient.invalidateQueries({
          queryKey: queryKeys.wishes.byTaskKey(
            planIdRef.current,
            taskKeyRef.current,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.wishes.all(planIdRef.current),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.wishes.counts(planIdRef.current),
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
    onFileUploaded: (file, fileId, downloadUrl, isEncrypted) => {
      // Mark that files changed (for cache invalidation on unmount)
      filesChangedRef.current = true;
      // Update attachment with backend ID, download URL, and mark as remote
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri
            ? {
                ...a,
                id: fileId,
                // Use the download URL if available (for documents/images)
                // Videos don't have a download URL until processed
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
   * Handle attachment changes from the form.
   * For new files: If no wishId exists yet, flush save to create one first, then upload.
   * For removed files: Deletes remote files from the server (confirmation is handled by FilePicker).
   */
  const handleAttachmentsChange = useCallback(
    async (newAttachments: FileAttachment[]) => {
      // Helper to get unique identifier for a file (id for remote, uri for local)
      const getFileIdentifier = (file: FileAttachment) => file.id || file.uri;

      // Handle remote file deletions using the shared hook
      const { hadRemoteDeletions, hadSuccessfulDeletions } =
        await handleRemoteFileDeletions(newAttachments);

      // Track if files were changed for cache invalidation on unmount
      if (hadSuccessfulDeletions) {
        filesChangedRef.current = true;
        // Immediately clear stale cache so deleted file references aren't
        // served via initialData if the user navigates away and back
        if (planId && task?.taskKey) {
          queryClient.removeQueries({
            queryKey: queryKeys.wishes.byTaskKey(planId, task.taskKey),
          });
          queryClient.removeQueries({
            queryKey: queryKeys.wishes.all(planId),
          });
        }
      }

      // If remote files were deleted, the hook already updated state
      if (hadRemoteDeletions) {
        return;
      }

      // Find any new local files that were added
      const addedLocalFiles = newAttachments.filter(
        (newFile) =>
          !newFile.isRemote &&
          !attachments.some(
            (current) =>
              getFileIdentifier(current) === getFileIdentifier(newFile)
          )
      );

      // Update attachments state
      setAttachments(newAttachments);

      // If new local files were added, trigger upload after ensuring wish exists
      if (addedLocalFiles.length > 0) {
        let wishId = autoSave.recordId;

        // If no wish exists yet, flush save to create one
        if (!wishId) {
          const getSaveData = getSaveDataRef.current;
          if (getSaveData) {
            const saveData = getSaveData();
            autoSave.triggerSave(saveData, true);
            try {
              wishId = await autoSave.flushSave();
            } catch {
              toast.error({
                message: "Could not save your wish before uploading files. Please try again.",
              });
              return;
            }
          }
        }

        // Upload the new files
        if (wishId) {
          uploadFiles({ wishId }, newAttachments);
        }
      }
    },
    [attachments, handleRemoteFileDeletions, setAttachments, autoSave, uploadFiles, planId, task, queryClient]
  );

  // ============================================================================
  // Render
  // ============================================================================

  // Show guard overlay if pillar is locked or access is restricted
  if (guardOverlay) {
    return guardOverlay;
  }

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
        wishId={
          autoSave.recordId ?? (existingWish ? existingWish.id : undefined)
        }
        initialData={existingWish}
        onFormReady={handleFormReady}
        registerGetSaveData={(fn: () => WishSaveData) => {
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
      {(existingWish || autoSave.recordId) && task && !isReadOnly && (
        <TaskCompletionFooter
          taskKey={task.taskKey}
          pillarColor={colors.featureWishes}
          pillarTint={colors.featureWishesTint}
          onComeBackLater={() => router.back()}
        />
      )}
      {!isReadOnly && (
        <SavedIndicator
          status={autoSave.status}
          errorMessage={autoSave.errorMessage}
          onDismissError={autoSave.dismissError}
          accentColor={colors.featureWishes}
        />
      )}
      {!isReadOnly && <KeyboardDoneButton accentColor={colors.featureWishes} />}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title={isViewingSharedPlan ? "Limit Reached" : "You've Reached Your Limit"}
        message={
          isViewingSharedPlan
            ? `This plan has reached its limit. Contact ${sharedPlanInfo?.ownerFirstName ?? "the plan owner"} for more information.`
            : "You've made great progress sharing your wishes. Upgrade your plan to add more and unlock additional features."
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
            : "This file would exceed your storage limit. Upgrade your plan for more storage space to keep all your important documents safe."
        }
        hideUpgradeAction={isViewingSharedPlan}
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
