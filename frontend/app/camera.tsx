import { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { compressImage } from '../utils/imageUtils';
import * as FileSystem from 'expo-file-system/legacy';

const BACKEND_URL = 'http://10.92.16.166:8000';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need camera access to capture your outfits
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

async function handleCapture() {
  if (!cameraRef.current || uploading) return;

  try {
    setUploading(true);

    // 1. Take photo
    const photo = await cameraRef.current.takePictureAsync({
      quality: 1,
      skipProcessing: true,
    });

    if (!photo) throw new Error('Failed to capture photo');

    // 2. Compress and convert to WebP
    const compressedUri = await compressImage(photo.uri);

    // 3. Read as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 4. Upload as JSON
    const response = await fetch(`${BACKEND_URL}/api/v1/closet/upload-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        mime_type: 'image/webp',
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      Alert.alert('Success', 'Item added to your closet!');
    } else {
      throw new Error(data.detail || 'Upload failed');
    }

  } catch (error: any) {
    Alert.alert('Error', error.message || 'Something went wrong');
  } finally {
    setUploading(false);
  }
}

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          {uploading ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
});