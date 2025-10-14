import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AddressWithReviews } from "../types/address";
import { useAuthStore } from "../stores/authStore";
import { useAddressStore } from "../stores/addressStore";
import FullsizeImageCarousel from "./FullsizeImageCarousel";

const { width: _screenWidth, height: _screenHeight } = Dimensions.get("window");

interface AddressDetailsModalProps {
  visible: boolean;
  address: AddressWithReviews | null;
  onClose: () => void;
  loading?: boolean;
  onReviewAdded?: () => void;
}

const AddressDetailsModal: React.FC<AddressDetailsModalProps> = ({
  visible,
  address,
  onClose,
  loading = false,
  onReviewAdded,
}) => {
  const { user } = useAuthStore();
  const { createReview } = useAddressStore();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!address) return null;

  const canAddReview = user && address.userId !== user.uid;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Erreur", "Veuillez sélectionner une note");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Erreur", "Veuillez ajouter un commentaire");
      return;
    }

    setSubmittingReview(true);
    try {
      await createReview({
        addressId: address.id,
        rating,
        comment: comment.trim(),
        userId: user!.uid,
        userDisplayName: user!.displayName || "Utilisateur",
        userPhotoURL: user!.photoURL || undefined,
        photos: [],
      });

      Alert.alert("Succès", "Votre avis a été ajouté avec succès", [
        {
          text: "OK",
          onPress: () => {
            setShowReviewModal(false);
            setRating(0);
            setComment("");
            onReviewAdded?.();
          },
        },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter votre avis");
    } finally {
      setSubmittingReview(false);
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

  const renderPhotos = () => {
    return (
      <FullsizeImageCarousel
        photos={address.photos || []}
        isLoading={false}
        error={false}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{address.name}</Text>
            <View style={styles.privacyContainer}>
              <Ionicons
                name={address.isPublic ? "globe" : "lock-closed"}
                size={16}
                color={address.isPublic ? "#2ecc71" : "#e74c3c"}
              />
              <Text style={styles.privacyText}>
                {address.isPublic ? "Public" : "Privé"}
              </Text>
              {user?.uid === address.userId && user?.photoURL && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.userPhoto}
                  />
                </>
              )}
              {address.reviewCount > 0 && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.ratingText}>
                    {"★".repeat(Math.round(address.averageRating))}{" "}
                    {address.averageRating.toFixed(1)} ({address.reviewCount})
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View>{renderPhotos()}</View>
          <View style={styles.wrapper}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{address.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localisation</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.coordinates}>
                  {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Avis</Text>
                {canAddReview && (
                  <TouchableOpacity
                    style={styles.addReviewButton}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Ionicons name="add" size={20} color="#2ecc71" />
                    <Text style={styles.addReviewText}>Ajouter un avis</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.reviewsContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2ecc71" />
                    <Text style={styles.loadingText}>
                      Chargement des avis...
                    </Text>
                  </View>
                ) : address.reviews && address.reviews.length > 0 ? (
                  address.reviews.map((review, index) => (
                    <View key={index} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          {review.userPhotoURL && (
                            <Image
                              source={{ uri: review.userPhotoURL }}
                              style={styles.reviewerPhoto}
                            />
                          )}
                          <View style={styles.reviewRatingAndDate}>
                            <Text style={styles.reviewRating}>
                              {"★".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)}
                            </Text>
                            <Text style={styles.reviewDate}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noReviewsText}>
                    Aucun avis pour le moment
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.reviewModalContainer}>
          <View style={styles.reviewModalHeader}>
            <TouchableOpacity
              style={styles.reviewModalCloseButton}
              onPress={() => setShowReviewModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.reviewModalTitle}>Ajouter un avis</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.reviewModalContent}>
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>Note</Text>
              <View style={styles.starsContainer}>{renderStars()}</View>

              <Text style={styles.reviewFormLabel}>Commentaire</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Partagez votre expérience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submittingReview && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Publier l'avis</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  wrapper: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  privacyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  separator: {
    fontSize: 14,
    color: "#999",
    marginHorizontal: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#ffa500",
    fontWeight: "500",
  },
  userPhoto: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coordinates: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontFamily: "monospace",
  },
  reviewsContainer: {
    marginTop: 8,
  },
  reviewItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: {
    marginBottom: 4,
  },
  reviewUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewerPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reviewRatingAndDate: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewRating: {
    fontSize: 16,
    color: "#ffa500",
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  addReviewText: {
    fontSize: 14,
    color: "#2ecc71",
    marginLeft: 4,
    fontWeight: "500",
  },
  starButton: {
    padding: 4,
  },
  reviewModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  reviewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  reviewModalCloseButton: {
    padding: 8,
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  reviewModalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewForm: {
    paddingVertical: 20,
  },
  reviewFormLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  submitButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddressDetailsModal;
