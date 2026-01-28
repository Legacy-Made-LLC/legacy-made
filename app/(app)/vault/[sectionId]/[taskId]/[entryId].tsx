/**
 * Entry Screen - Create/Edit Form
 *
 * Displays the form for creating or editing an entry using the registered
 * form component for that task type.
 *
 * entryId = "new" for creating a new entry
 * entryId = <uuid> for editing an existing entry
 */

import { apiFileToAttachment, type FileAttachment } from '@/api/types';
import { getFormComponent } from '@/components/vault/registry';
import { colors, spacing, typography } from '@/constants/theme';
import { getTask } from '@/constants/vault';
import { useCreateEntry, useDeleteEntry, useEntryQuery, useUpdateEntry } from '@/hooks/queries';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useApi } from '@/api';

export default function EntryScreen() {
  const { sectionId, taskId, entryId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
    entryId: string;
  }>();
  const router = useRouter();

  const task = getTask(sectionId, taskId);
  const isNew = entryId === 'new';

  // Get the form component for this task
  const FormComponent = task ? getFormComponent(task.taskKey) : undefined;

  // Fetch entry data if editing
  const { data: entry, isLoading } = useEntryQuery(isNew ? undefined : entryId);

  // API for file operations
  const { files: filesService } = useApi();

  // Mutations
  const createMutation = useCreateEntry(task?.taskKey);
  const updateMutation = useUpdateEntry(task?.taskKey);
  const deleteMutation = useDeleteEntry(task?.taskKey);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Track if a file deletion is in progress
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // File attachments state - initialized from entry.files when available
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  // Initialize attachments when entry data loads
  useEffect(() => {
    if (entry?.files) {
      setAttachments(entry.files.map(apiFileToAttachment));
    }
  }, [entry?.files]);

  // File upload hook
  const { uploadFiles, uploadStates, isUploading } = useFileUpload({
    onFileUploaded: (file, fileId) => {
      // Update attachment with backend ID and mark as remote
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri ? { ...a, id: fileId, uploadStatus: 'complete', isRemote: true } : a
        )
      );
    },
    onFileError: (file, error) => {
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === file.uri ? { ...a, uploadStatus: 'error', errorMessage: error } : a
        )
      );
    },
  });

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

      // Find any remote files that were removed
      const removedRemoteFiles = currentAttachments.filter(
        (current) =>
          current.isRemote &&
          current.id &&
          !newAttachments.some((newFile) => newFile.uri === current.uri)
      );

      // If no remote files were removed, just update state
      if (removedRemoteFiles.length === 0) {
        setAttachments(newAttachments);
        return;
      }

      // Show confirmation for remote file deletion
      const fileToDelete = removedRemoteFiles[0];
      Alert.alert(
        'Delete Attachment',
        `Are you sure you want to permanently delete "${fileToDelete.fileName}"? This cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            // Don't update state - keep the file
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              if (!fileToDelete.id) return;

              setIsDeletingFile(true);
              try {
                await filesService.delete(fileToDelete.id);
                // Remove from state after successful deletion
                setAttachments((prev) =>
                  prev.filter((a) => a.uri !== fileToDelete.uri)
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : 'Failed to delete file';
                Alert.alert('Error', message);
              } finally {
                setIsDeletingFile(false);
              }
            },
          },
        ]
      );
    },
    [filesService]
  );

  // Handle save
  const handleSave = useCallback(
    async (data: { title: string; notes?: string; metadata: Record<string, unknown> }) => {
      if (!task) return;

      let savedEntryId: string;

      if (isNew) {
        const createdEntry = await createMutation.mutateAsync(data);
        savedEntryId = createdEntry.id;
      } else {
        await updateMutation.mutateAsync({ entryId, data });
        savedEntryId = entryId;
      }

      // Upload any pending files
      const pendingFiles = attachments.filter((f) => !f.isRemote && f.uploadStatus !== 'complete');
      if (pendingFiles.length > 0) {
        await uploadFiles(savedEntryId, attachments);
      }

      router.back();
    },
    [task, isNew, entryId, createMutation, updateMutation, attachments, uploadFiles, router]
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
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
