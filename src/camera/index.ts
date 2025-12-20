import type { CameraOptions } from '../types';

export interface CameraStream {
  video: HTMLVideoElement;
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Request camera access and set up video stream
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  options: CameraOptions = {}
): Promise<CameraStream> {
  const {
    facingMode = 'environment',
    resolution = { width: 1280, height: 720 },
  } = options;

  const constraints: MediaStreamConstraints = {
    video: {
      facingMode,
      width: { ideal: resolution.width },
      height: { ideal: resolution.height },
    },
    audio: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // Wait for video to be ready
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(resolve).catch(reject);
      };
      videoElement.onerror = () => reject(new Error('Video element error'));
    });

    // Get actual dimensions
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    // Create offscreen canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    return {
      video: videoElement,
      stream,
      canvas,
      ctx,
      width,
      height,
    };
  } catch (error) {
    throw new Error(`Camera access denied: ${error}`);
  }
}

/**
 * Stop camera stream
 */
export function stopCamera(cameraStream: CameraStream): void {
  const { stream, video } = cameraStream;

  // Stop all tracks
  for (const track of stream.getTracks()) {
    track.stop();
  }

  // Clear video source
  video.srcObject = null;
}

/**
 * Grab current frame from video as ImageData
 */
export function grabFrame(camera: CameraStream): ImageData {
  const { video, canvas, ctx, width, height } = camera;

  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, width, height);

  // Get pixel data
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Check if camera is supported
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Get available cameras
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}
