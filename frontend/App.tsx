import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BACKEND_URL = 'http://10.0.2.2:8000';
// 10.0.2.2 is a special Android emulator address that maps to your laptop's localhost

export default function App() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setStatus('✅ Backend connected');
        } else {
          setStatus('⚠️ Backend error');
        }
      })
      .catch(() => setStatus('❌ Could not reach backend'));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Closet AI</Text>
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});