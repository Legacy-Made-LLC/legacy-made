/**
 * useVideoRecorder - Encapsulates video recording state and logic
 *
 * Handles:
 * - Camera permissions (camera + microphone)
 * - Recording start/stop
 * - Timer with auto-stop at max duration
 * - Camera facing toggle (front/back)
 */

import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import type { CameraView } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DURATION_SECONDS = 180; // 3 minutes

export type RecordingState = "idle" | "recording" | "preview";

interface UseVideoRecorderOptions {
  maxDurationSeconds?: number;
}

interface UseVideoRecorderReturn {
  /** Current state of the recorder */
  state: RecordingState;
  /** Whether we have all necessary permissions */
  hasPermissions: boolean;
  /** Whether we're still checking permissions */
  isCheckingPermissions: boolean;
  /** Camera facing direction */
  facing: "front" | "back";
  /** Timer display string (MM:SS) */
  timerDisplay: string;
  /** Elapsed seconds */
  elapsedSeconds: number;
  /** URI of the recorded video (available in "preview" state) */
  videoUri: string | null;
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording */
  stopRecording: () => void;
  /** Toggle camera facing */
  toggleFacing: () => void;
  /** Retake (go back to idle) */
  retake: () => void;
  /** Request permissions */
  requestPermissions: () => Promise<void>;
  /** Ref to attach to CameraView */
  cameraRef: React.RefObject<CameraView | null>;
}

export function useVideoRecorder(
  options: UseVideoRecorderOptions = {},
): UseVideoRecorderReturn {
  const maxDuration = options.maxDurationSeconds ?? MAX_DURATION_SECONDS;

  const cameraRef = useRef<CameraView | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<RecordingState>("idle");
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const hasPermissions =
    (cameraPermission?.granted ?? false) && (micPermission?.granted ?? false);
  const isCheckingPermissions = !cameraPermission || !micPermission;

  const requestPermissions = useCallback(async () => {
    await Promise.all([requestCameraPermission(), requestMicPermission()]);
  }, [requestCameraPermission, requestMicPermission]);

  // Timer display
  const timerDisplay = formatTime(elapsedSeconds);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-stop at max duration
  useEffect(() => {
    if (state === "recording" && elapsedSeconds >= maxDuration) {
      stopRecording();
    }
  }, [elapsedSeconds, maxDuration, state]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || state !== "idle") return;

    setElapsedSeconds(0);
    setState("recording");

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration,
      });

      // Recording finished (either by user or max duration)
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (video?.uri) {
        setVideoUri(video.uri);
        setState("preview");
      } else {
        setState("idle");
      }
    } catch {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState("idle");
    }
  }, [state, maxDuration]);

  const stopRecording = useCallback(() => {
    if (state !== "recording") return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    cameraRef.current?.stopRecording();
    // The recordAsync promise will resolve and handle the state transition
  }, [state]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  }, []);

  const retake = useCallback(() => {
    setVideoUri(null);
    setElapsedSeconds(0);
    setState("idle");
  }, []);

  return {
    state,
    hasPermissions,
    isCheckingPermissions,
    facing,
    timerDisplay,
    elapsedSeconds,
    videoUri,
    startRecording,
    stopRecording,
    toggleFacing,
    retake,
    requestPermissions,
    cameraRef,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
