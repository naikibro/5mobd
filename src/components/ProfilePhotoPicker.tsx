import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAddress } from "../context/AddressContext";

interface ProfilePhotoPickerProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string) => void;
  userId: string;
}

const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  currentPhotoUrl,
  onPhotoChange,
  userId,
}) => {
  const [uploading, setUploading] = useState(false);
  const { uploadPhoto } = useAddress();

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Nous avons besoin de votre permission pour accéder à vos photos."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processAndUploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processAndUploadImage(result.assets[0].uri);
    }
  };

  const processAndUploadImage = async (imageUri: string) => {
    try {
      setUploading(true);

      // Resize and compress the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log("Manipulated image URI:", manipulatedImage.uri);

      // Create a proper file name and path
      const fileName = `profile_${Date.now()}.jpg`;
      const storagePath = `profile-photos/${userId}/${fileName}`;

      console.log("Storage path:", storagePath);

      // For React Native, we need to convert the URI to a blob properly
      const response = await fetch(manipulatedImage.uri);
      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      console.log("Blob size:", blob.size, "Blob type:", blob.type);

      if (blob.size === 0) {
        throw new Error("Blob is empty");
      }

      const downloadURL = await uploadPhoto(blob, storagePath);
      console.log("Upload successful, download URL:", downloadURL);
      onPhotoChange(downloadURL);
    } catch (error: any) {
      console.error("Detailed error uploading image:", error);

      // Check if this might be a simulator issue
      if (
        error.message.includes("unknown error") ||
        error.message.includes("storage/unknown")
      ) {
        Alert.alert(
          "Problème de simulateur",
          "L'upload d'image peut ne pas fonctionner sur le simulateur. Veuillez tester sur un appareil réel ou utiliser une image de test.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Utiliser image de test",
              onPress: () => {
                const testImageUrl = "https://avatar.iran.liara.run/public";
                onPhotoChange(testImageUrl);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Erreur",
          `Impossible de télécharger la photo: ${error.message}`
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Changer la photo de profil",
      "Comment souhaitez-vous ajouter une photo ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Prendre une photo", onPress: takePhoto },
        { text: "Choisir dans la galerie", onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoContainer}>
        {currentPhotoUrl ? (
          <Image source={{ uri: currentPhotoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person" size={40} color="#bdc3c7" />
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.changeButton}
        onPress={showImageOptions}
        disabled={uploading}
      >
        <Ionicons name="camera" size={16} color="#2ecc71" />
        <Text style={styles.changeButtonText}>
          {currentPhotoUrl ? "Changer" : "Ajouter une photo"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  changeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#2ecc71",
    fontWeight: "500",
  },
});

export default ProfilePhotoPicker;
