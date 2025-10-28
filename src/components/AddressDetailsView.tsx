import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import FullsizeImageCarousel from "./FullsizeImageCarousel";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { useFavorites } from "../hooks/useFavorites";
import { Address } from "../types/address";

interface AddressDetailsViewProps {
  selectedAddress: Address | null;
  addressWithReviews: any;
  detailsLoading: boolean;
  streetAddress: string | null;
  onBackToList: () => void;
  onRefresh?: () => Promise<void>;
}

const AddressDetailsView: React.FC<AddressDetailsViewProps> = ({
  selectedAddress,
  addressWithReviews,
  detailsLoading,
  streetAddress,
  onBackToList,
  onRefresh,
}) => {
  const { user } = useAuthStore();
  const { deleteAddress, createReview } = useAddressStore();
  const { toggleFavorite, isFavoriteLocal } = useFavorites();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#f39c12"
        />
      );
    }
    return stars;
  };

  const renderReviewStars = () => {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const handleFavoritePress = useCallback(
    async (addressId: string) => {
      try {
        const wasFavorite = isFavoriteLocal(addressId);
        await toggleFavorite(addressId);

        if (!wasFavorite) {
          Alert.alert("Adresse ajoutée aux favoris⭐️", "", [], {
            cancelable: true,
          });
        } else {
          Alert.alert("Adresse retirée des favoris", "", [], {
            cancelable: true,
          });
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [toggleFavorite, isFavoriteLocal]
  );

  const handleDeleteAddress = () => {
    if (!selectedAddress) return;

    Alert.alert(
      "Supprimer l'adresse",
      `Êtes-vous sûr de vouloir supprimer "${selectedAddress.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(selectedAddress.id);
              Alert.alert("Succès", "Adresse supprimée avec succès", [
                {
                  text: "OK",
                  onPress: () => {
                    onBackToList();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

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

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (selectedImages.length >= 5) {
      Alert.alert("Limite atteinte", "Vous pouvez ajouter jusqu'à 5 images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - selectedImages.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (selectedImages.length >= 5) {
      Alert.alert("Limite atteinte", "Vous pouvez ajouter jusqu'à 5 images.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      "Ajouter des photos",
      "Comment souhaitez-vous ajouter des photos ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Prendre une photo", onPress: takePhoto },
        { text: "Choisir dans la galerie", onPress: pickImages },
      ]
    );
  };

  const uploadReviewImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const imageUri of selectedImages) {
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const fileName = `review_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.jpg`;
        const storagePath = `reviews/${selectedAddress?.id}/${fileName}`;

        const response = await fetch(manipulatedImage.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error("Blob is empty");
        }

        const { uploadPhoto } = useAddressStore.getState();
        const downloadURL = await uploadPhoto(blob, storagePath);
        uploadedUrls.push(downloadURL);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmitReview = async () => {
    if (!selectedAddress || !user) return;

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
      let photoUrls: string[] = [];

      if (selectedImages.length > 0) {
        setUploadingImages(true);
        photoUrls = await uploadReviewImages();
        setUploadingImages(false);
      }

      await createReview({
        addressId: selectedAddress.id,
        rating,
        comment: comment.trim(),
        userId: user.uid,
        userDisplayName: user.displayName || "Utilisateur",
        userPhotoURL: user.photoURL || undefined,
        photos: photoUrls,
      });

      const wasFavorite = isFavoriteLocal(selectedAddress.id);
      if (!wasFavorite) {
        try {
          await toggleFavorite(selectedAddress.id);
        } catch (error) {
          console.error("Error adding to favorites:", error);
        }
      }

      if (onRefresh) {
        await onRefresh();
      }

      Alert.alert(
        "Succès",
        wasFavorite
          ? "Votre avis a été ajouté avec succès"
          : "Votre avis a été ajouté avec succès et l'adresse a été ajoutée à vos favoris",
        [
          {
            text: "OK",
            onPress: () => {
              setShowReviewModal(false);
              setRating(0);
              setComment("");
              setSelectedImages([]);
            },
          },
        ]
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter votre avis");
    } finally {
      setSubmittingReview(false);
      setUploadingImages(false);
    }
  };

  if (!selectedAddress) return null;

  if (detailsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.detailsContainer}
        contentContainerStyle={styles.detailsContent}
      >
        {selectedAddress.photos && selectedAddress.photos.length > 0 && (
          <FullsizeImageCarousel photos={selectedAddress.photos} />
        )}

        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={onBackToList} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleFavoritePress(selectedAddress.id)}
            style={styles.favoriteToggleButton}
            testID={`favorite-toggle-button-${selectedAddress.id}`}
          >
            <Ionicons
              name={
                isFavoriteLocal(selectedAddress.id) ? "star" : "star-outline"
              }
              size={24}
              color={isFavoriteLocal(selectedAddress.id) ? "#ffd700" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsWrapper}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsTitleContainer}>
              <Text style={styles.detailsName}>{selectedAddress.name}</Text>
              <View style={styles.detailsVisibilityContainer}>
                <Ionicons
                  name={selectedAddress.isPublic ? "globe" : "lock-closed"}
                  size={20}
                  color={selectedAddress.isPublic ? "#2ecc71" : "#e74c3c"}
                />
                <Text style={styles.detailsVisibilityText}>
                  {selectedAddress.isPublic ? "Public" : "Privé"}
                </Text>
              </View>
            </View>
            {addressWithReviews && addressWithReviews.averageRating > 0 && (
              <View style={styles.detailsRatingContainer}>
                <View style={styles.detailsStarsContainer}>
                  {renderStars(Math.round(addressWithReviews.averageRating))}
                </View>
                <Text style={styles.detailsRatingText}>
                  {addressWithReviews.averageRating.toFixed(1)} (
                  {addressWithReviews.reviewCount} avis)
                </Text>
              </View>
            )}
          </View>

          {selectedAddress.description && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Description</Text>
              <Text style={styles.detailsDescription}>
                {selectedAddress.description}
              </Text>
            </View>
          )}

          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Informations</Text>

            <View style={styles.detailsAddressRow}>
              <Text style={styles.detailsInfoLabel}>Adresse:</Text>
              <Text style={styles.detailsAddressValue}>
                {streetAddress ||
                  `${selectedAddress.latitude.toFixed(
                    4
                  )}, ${selectedAddress.longitude.toFixed(4)}`}
              </Text>
            </View>
            <View style={styles.detailsInfoRow}>
              <Text style={styles.detailsInfoLabel}>Latitude:</Text>
              <Text style={styles.detailsInfoValue}>
                {selectedAddress.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailsInfoRow}>
              <Text style={styles.detailsInfoLabel}>Longitude:</Text>
              <Text style={styles.detailsInfoValue}>
                {selectedAddress.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailsInfoRow}>
              <Text style={styles.detailsInfoLabel}>Créé le:</Text>
              <Text style={styles.detailsInfoValue}>
                {formatDate(selectedAddress.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailsSectionHeader}>
              <Text style={styles.detailsSectionTitle}>
                Avis ({addressWithReviews?.reviews?.length || 0})
              </Text>
              {user &&
                selectedAddress &&
                user.uid !== selectedAddress.userId && (
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
              {addressWithReviews &&
              addressWithReviews.reviews &&
              addressWithReviews.reviews.length > 0 ? (
                addressWithReviews.reviews.map((review: any) => (
                  <View key={review.id} style={styles.detailsReviewItem}>
                    <View style={styles.detailsReviewHeader}>
                      <View style={styles.detailsReviewUser}>
                        {review.userPhotoURL && (
                          <Image
                            source={{ uri: review.userPhotoURL }}
                            style={styles.reviewerPhoto}
                          />
                        )}
                        <View style={styles.reviewRatingAndDate}>
                          <Text style={styles.detailsReviewUserName}>
                            {review.userDisplayName}
                          </Text>
                          <View style={styles.detailsReviewStars}>
                            {renderStars(review.rating)}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.detailsReviewDate}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    {review.comment && (
                      <Text style={styles.detailsReviewComment}>
                        {review.comment}
                      </Text>
                    )}
                    {review.photos && review.photos.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {review.photos.map((photo: string, index: number) => (
                          <Image
                            key={index}
                            source={{ uri: photo }}
                            style={styles.detailsReviewPhoto}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noReviewsText}>
                  Aucun avis pour le moment
                </Text>
              )}
            </View>
          </View>

          {user && user.uid === selectedAddress.userId && (
            <TouchableOpacity
              style={styles.detailsDeleteButton}
              onPress={handleDeleteAddress}
            >
              <Ionicons
                name="trash"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.detailsDeleteButtonText}>
                Supprimer cette adresse
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

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
              <View style={styles.starsContainer}>{renderReviewStars()}</View>

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

              <Text style={styles.reviewFormLabel}>
                Photos{" "}
                {selectedImages.length > 0 && `(${selectedImages.length}/5)`}
              </Text>
              <View style={styles.photosSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedImages.length < 5 && (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={showImageOptions}
                    >
                      <Ionicons name="camera" size={32} color="#2ecc71" />
                      <Text style={styles.addImageText}>Ajouter</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submittingReview || uploadingImages) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview || uploadingImages}
              >
                {submittingReview || uploadingImages ? (
                  <View style={styles.loadingButtonContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitButtonText}>
                      {uploadingImages
                        ? "Envoi des photos..."
                        : "Publication..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Publier l'avis</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  detailsContent: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  detailsWrapper: {
    padding: 16,
  },
  backButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  favoriteToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  detailsHeader: {
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
  detailsTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  detailsVisibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsVisibilityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  detailsRatingContainer: {
    alignItems: "flex-start",
  },
  detailsStarsContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailsRatingText: {
    fontSize: 14,
    color: "#666",
  },
  detailsSection: {
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
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  detailsDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  detailsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailsAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailsInfoLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  detailsInfoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  detailsAddressValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
    lineHeight: 22,
  },
  detailsSectionHeader: {
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
  reviewsContainer: {
    marginTop: 8,
  },
  detailsReviewItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  detailsReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailsReviewUser: {
    flex: 1,
  },
  detailsReviewUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  detailsReviewStars: {
    flexDirection: "row",
  },
  detailsReviewDate: {
    fontSize: 12,
    color: "#666",
  },
  detailsReviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  detailsReviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  reviewerPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reviewRatingAndDate: {
    flex: 1,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  detailsDeleteButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  detailsDeleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Review modal styles
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
  starButton: {
    padding: 4,
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
  photosSection: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2ecc71",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    color: "#2ecc71",
    fontWeight: "500",
  },
  loadingButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default AddressDetailsView;
