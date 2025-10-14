import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AddressStackParamList } from "../types/navigation";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";

const { width: _screenWidth } = Dimensions.get("window");

type ReviewScreenRouteProp = RouteProp<AddressStackParamList, "Reviews">;

const ReviewScreen = () => {
  const route = useRoute<ReviewScreenRouteProp>();
  const { address } = route.params;
  const { createReview } = useAddressStore();
  const { user } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Erreur", "Veuillez sélectionner une note");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Erreur", "Veuillez ajouter un commentaire");
      return;
    }

    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour laisser un avis");
      return;
    }

    setLoading(true);
    try {
      await createReview({
        addressId: address.id,
        rating,
        comment: comment.trim(),
        userId: user.uid,
        userDisplayName: user.displayName || "Utilisateur",
        userPhotoURL: user.photoURL || undefined,
        photos: [],
      });

      Alert.alert("Succès", "Votre avis a été ajouté avec succès", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setRating(0);
            setComment("");
          },
        },
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding review:", error);
      Alert.alert("Erreur", "Impossible d'ajouter votre avis");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f39c12" : "#bdc3c7"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="star" size={18} color="#333" /> Notez cette adresse
          </Text>

          <Text style={styles.addressName}>{address.name}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.label}>Votre note *</Text>
            <View style={styles.starsContainer}>{renderStars()}</View>
            <Text style={styles.ratingText}>
              {rating > 0
                ? `${rating} étoile${rating > 1 ? "s" : ""}`
                : "Sélectionnez une note"}
            </Text>
          </View>

          <Text style={styles.label}>Votre commentaire *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Text style={styles.characterCount}>
            {comment.length}/500 caractères
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Publier l'avis</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 16,
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
  addressName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2ecc71",
    marginBottom: 20,
    textAlign: "center",
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ReviewScreen;
