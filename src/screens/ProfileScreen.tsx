import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfilePhotoPicker from "../components/ProfilePhotoPicker";

const { width: _screenWidth } = Dimensions.get("window");
import { useAuthStore } from "../stores/authStore";

const ProfileScreen = () => {
  const {
    user,
    userProfile,
    logout,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    updateUserPhoto,
  } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName) {
      Alert.alert("Erreur", "Le pseudo ne peut pas être vide");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(displayName);
      Alert.alert("Succès", "Profil mis à jour avec succès");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      Alert.alert("Erreur", "L'email ne peut pas être vide");
      return;
    }

    setLoading(true);
    try {
      await updateUserEmail(email);
      Alert.alert("Succès", "Email mis à jour avec succès");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(newPassword);
      Alert.alert("Succès", "Mot de passe mis à jour avec succès");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (photoUrl: string) => {
    try {
      await updateUserPhoto(photoUrl);
      Alert.alert("Succès", "Photo de profil mise à jour avec succès");
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour la photo de profil");
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert("Erreur", error.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfilePhotoPicker
        currentPhotoUrl={userProfile?.photoURL || user?.photoURL || undefined}
        onPhotoChange={handlePhotoChange}
        userId={user?.uid || ""}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="person" size={18} color="#333" /> Informations du
          profil
        </Text>

        <Text style={styles.label}>Pseudo</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Votre pseudo"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Mettre à jour le pseudo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="mail" size={18} color="#333" /> Email
        </Text>

        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Votre email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Mettre à jour l'email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="lock-closed" size={18} color="#333" /> Changer le mot
          de passe
        </Text>

        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nouveau mot de passe"
          secureTextEntry
        />

        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirmer le mot de passe"
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Mettre à jour le mot de passe</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons
          name="log-out"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
