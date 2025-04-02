import React, { useEffect, useState } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';

export default function Page() {
  const { user } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const { getToken } = useAuth();
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('');

  async function handleSignOut() {
    await clerk.signOut();
    router.replace('/');
  }

  const getCustomToken = async () => {
    try {
      setIsLoading(true);
      
      // Prepare the payload for our local server
      const payload: {
        user_id: string;
        expires_in_seconds?: number;
      } = {
        user_id: user?.id || '',
      };
      
      // Add expiration if provided
      if (expiresIn && !isNaN(parseInt(expiresIn))) {
        payload.expires_in_seconds = parseInt(expiresIn);
      }
      
      // Call our local Express server instead of Clerk API directly
      console.log(`${process.env.EXPO_PUBLIC_CLERK_CUSTOM_SERVER}/generate-token`)
      const response = await fetch(`${process.env.EXPO_PUBLIC_CLERK_CUSTOM_SERVER}/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get custom token');
      }
      
      // The token could be in data.token or just data.id depending on Clerk's response format
      setCustomToken(data.token);
      Alert.alert('Success', 'Custom token generated successfully!');
    } catch (error) {
      console.error('Error getting custom token:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to get custom token');
    } finally {
      setIsLoading(false);
    }
  };

  if (user === undefined) {
    return <Text>Loading...</Text>;
  }

  if (user === null) {
    return <Text>Not signed in</Text>;
  }

  useEffect(()=>{
    getCustomToken()
  },[])

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:200}}>
      <View style={styles.header}>
        <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
        <Text style={styles.name}>{user.fullName || 'User'}</Text>
        <Text style={styles.email}>
          {user.primaryEmailAddress?.emailAddress}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <InfoItem label="Username" value={user.username || 'Not set'} />
        <InfoItem label="ID" value={user.id} />
        <InfoItem
          label="Created"
          value={new Date(user.createdAt!).toLocaleDateString()}
        />
        <InfoItem
          label="Last Updated"
          value={new Date(user.updatedAt!).toLocaleDateString()}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (!customToken) {
            Alert.alert("No Token", "Please generate a custom token first");
            return;
          }
          // Include the userId as a query parameter along with the customToken
          const baseUrl = "http://canstar.localhost:3001/";
          const queryParams = `?customToken=${customToken}&userId=${user?.id}`;
          const encodedUrl = encodeURIComponent(`${baseUrl}${queryParams}`);
          
          router.push(`/(home)/web-view?url=${encodedUrl}`);
        }}
      >
        <Text style={styles.backButtonText}>webview CTA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  infoValue: {
    color: 'gray',
  },
  inputContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
  },
  inputLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  tokenButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  backButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});
