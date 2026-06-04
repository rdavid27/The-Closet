import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1024;
const COMPRESS_QUALITY = 0.8;
const SIZE_THRESHOLD_BYTES = 200 * 1024; // 200kb

export async function compressImage(uri: string): Promise<string> {
  // First get the image dimensions without manipulating
  const preview = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.WEBP,
  });

  const { width, height } = preview;

  // Calculate new dimensions maintaining aspect ratio
  let resizeOptions = {};
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      resizeOptions = { width: MAX_DIMENSION };
    } else {
      resizeOptions = { height: MAX_DIMENSION };
    }
  }

  // Apply resize and compression
  const result = await ImageManipulator.manipulateAsync(
    uri,
    Object.keys(resizeOptions).length > 0 ? [{ resize: resizeOptions }] : [],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.WEBP,
    }
  );

  return result.uri;
}

export async function shouldCompress(uri: string): Promise<boolean> {
  // Expo doesn't give file size directly, so we compress regardless
  // The size gate is enforced on the backend
  return true;
}