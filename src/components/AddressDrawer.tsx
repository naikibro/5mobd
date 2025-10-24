import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  Animated,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PhotoGallery from "../components/PhotoGallery";
import FullsizeImageCarousel from "../components/FullsizeImageCarousel";
import RadiusSlider from "../components/RadiusSlider";
import { useGeocoding } from "../hooks/useGeocoding";
import { useFavorites } from "../hooks/useFavorites";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { addressService } from "../services/addressService";
import * as Location from "expo-location";
import { Address } from "../types/address";

const { width } = Dimensions.get("window");

interface AddressDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  selectedAddressFromMap?: Address | null;
}

const AddressDrawer: React.FC<AddressDrawerProps> = ({
  isVisible,
  onClose,
  selectedAddressFromMap,
}) => {
  const {
    loading,
    isPolling,
    getAddressWithReviews,
    deleteAddress,
    createReview,
  } = useAddressStore();
  const { user } = useAuthStore();
  const { getStreetName, isLoading: isGeocodingLoading } = useGeocoding();
  const { toggleFavorite, isFavoriteLocal } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [streetNames, setStreetNames] = useState<Map<string, string>>(
    new Map()
  );
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(30);
  const [currentView, setCurrentView] = useState<"list" | "details">("list");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressWithReviews, setAddressWithReviews] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [streetAddress, setStreetAddress] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const processedAddresses = useRef(new Set<string>());
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Handle drawer animation
  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  // Handle address selection from map
  useEffect(() => {
    if (selectedAddressFromMap && isVisible) {
      handleAddressPress(selectedAddressFromMap);
    }
  }, [selectedAddressFromMap, isVisible]);

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          console.log("Location services are disabled");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("Location permission status:", status);

        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log("User location obtained:", location.coords);
          setUserLocation(location);
        } else {
          console.log("Location permission denied, status:", status);
          if (__DEV__) {
            console.log("Setting default Paris location for simulator");
            setUserLocation({
              coords: {
                latitude: 48.8566,
                longitude: 2.3522,
                altitude: null,
                accuracy: 100,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            } as Location.LocationObject);
          }
        }
      } catch (error) {
        console.log("Error getting location:", error);
      }
    };
    getUserLocation();
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      if (userLocation) {
        console.log(
          "Filtering addresses with user location:",
          userLocation.coords
        );
        const filteredAddresses = await addressService.searchAddresses(
          searchQuery,
          "public",
          undefined,
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          searchRadius
        );
        console.log(
          "Filtered addresses (within radius):",
          filteredAddresses.length
        );
        setAddresses(filteredAddresses);
      } else {
        console.log("No user location yet, waiting...");
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  }, [userLocation, searchRadius, searchQuery]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const loadStreetNames = useCallback(async () => {
    if (addresses.length === 0) return;

    const newStreetNames: string[] = [];

    for (const address of addresses) {
      const key = `${address.latitude},${address.longitude}`;

      if (!processedAddresses.current.has(key)) {
        processedAddresses.current.add(key);

        try {
          const streetName = await getStreetName({
            latitude: address.latitude,
            longitude: address.longitude,
          });

          if (streetName) {
            newStreetNames.push(key, streetName);
          }
        } catch (error) {
          console.error("Error getting street name:", error);
        }
      }
    }

    if (newStreetNames.length > 0) {
      setStreetNames((prev) => {
        const updated = new Map(prev);
        for (let i = 0; i < newStreetNames.length; i += 2) {
          updated.set(newStreetNames[i], newStreetNames[i + 1]);
        }
        return updated;
      });
    }
  }, [addresses, getStreetName]);

  useEffect(() => {
    if (addresses.length > 0) {
      loadStreetNames();
    }
  }, [addresses, loadStreetNames]);

  useEffect(() => {
    processedAddresses.current.clear();
  }, [addresses.length]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const searchResults = await addressService.searchAddresses(
          query,
          "public",
          undefined,
          userLocation
            ? {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }
            : undefined,
          searchRadius
        );
        setAddresses(searchResults);
      } catch (error) {
        console.error("Error searching addresses:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadAddresses();
    }
  };

  const handleRadiusChange = useCallback(
    async (low: number, high: number, fromUser: boolean) => {
      if (fromUser || low !== searchRadius) {
        setSearchRadius(low);
      }
    },
    [searchRadius]
  );

  const handleAddressPress = async (address: Address) => {
    setSelectedAddress(address);
    setCurrentView("details");
    setDetailsLoading(true);

    try {
      const details = await getAddressWithReviews(address.id);
      setAddressWithReviews(details);

      const streetName = await getStreetName({
        latitude: address.latitude,
        longitude: address.longitude,
      });
      setStreetAddress(streetName);
    } catch (error) {
      console.error("Error loading address details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedAddress(null);
    setAddressWithReviews(null);
    setStreetAddress(null);
  };

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
                    handleBackToList();
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

  const handleFavoritePress = async () => {
    if (!selectedAddress) return;

    try {
      const wasFavorite = isFavoriteLocal(selectedAddress.id);
      await toggleFavorite(selectedAddress.id);

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
      await createReview({
        addressId: selectedAddress.id,
        rating,
        comment: comment.trim(),
        userId: user.uid,
        userDisplayName: user.displayName || "Utilisateur",
        userPhotoURL: user.photoURL || undefined,
        photos: [],
      });

      // Automatically add to favorites when adding a review
      try {
        const wasFavorite = isFavoriteLocal(selectedAddress.id);
        await toggleFavorite(selectedAddress.id);

        if (!wasFavorite) {
          Alert.alert("Adresse ajoutée aux favoris⭐️", "", [], {
            cancelable: true,
          });
        }
      } catch (error) {
        console.error("Error adding to favorites:", error);
      }

      Alert.alert(
        "Succès",
        "Votre avis a été ajouté avec succès et l'adresse a été ajoutée à vos favoris",
        [
          {
            text: "OK",
            onPress: () => {
              setShowReviewModal(false);
              setRating(0);
              setComment("");
              // Refresh the address details
              handleAddressPress(selectedAddress);
            },
          },
        ]
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter votre avis");
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const renderAddress = ({ item }: { item: Address }) => {
    const key = `${item.latitude},${item.longitude}`;
    const streetName = streetNames.get(key);
    const isFavorite = isFavoriteLocal(item.id);

    const handleFavoritePress = async () => {
      try {
        const wasFavorite = isFavorite;
        await toggleFavorite(item.id);

        if (!wasFavorite) {
          Alert.alert("Adresse ajoutée aux favoris⭐️", "", [], {
            cancelable: true,
          });
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    };

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAddressPress(item)}
      >
        <View style={styles.photosContainer}>
          <PhotoGallery photos={item.photos || []} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.location}>
                {streetName ||
                  `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
              </Text>
              {isGeocodingLoading && !streetName && (
                <ActivityIndicator
                  size="small"
                  color="#666"
                  style={styles.geocodingLoader}
                />
              )}
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
              testID={`favorite-button-${item.id}`}
            >
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={20}
                color={isFavorite ? "#ffd700" : "#666"}
              />
            </TouchableOpacity>
            <Ionicons
              name={item.isPublic ? "globe" : "lock-closed"}
              size={20}
              color={item.isPublic ? "#2ecc71" : "#e74c3c"}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddressDetails = () => {
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
      <ScrollView
        style={styles.detailsContainer}
        contentContainerStyle={styles.detailsContent}
      >
        {selectedAddress.photos && selectedAddress.photos.length > 0 && (
          <FullsizeImageCarousel photos={selectedAddress.photos} />
        )}

        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={handleBackToList}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFavoritePress}
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
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            {currentView === "details" ? (
              <TouchableOpacity
                onPress={handleBackToList}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.drawerTitle}>
              {currentView === "details"
                ? "Détails de l'adresse"
                : "Adresses Publiques"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {currentView === "list" ? (
            <>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  testID="addresses-search-input"
                  placeholder="Rechercher une adresse..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {(isSearching || (loading && !isPolling)) && (
                  <ActivityIndicator size="small" color="#2ecc71" />
                )}
              </View>

              <FlatList
                data={addresses}
                renderItem={renderAddress}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => (
                  <RadiusSlider
                    searchRadius={searchRadius}
                    onRadiusChange={handleRadiusChange}
                    addressesCount={addresses.length}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="location-outline"
                      size={80}
                      color="#bdc3c7"
                    />
                    <Text style={styles.emptyText}>
                      {searchQuery
                        ? "Aucune adresse trouvée"
                        : "Aucune adresse publique"}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {searchQuery
                        ? "Essayez avec d'autres mots-clés"
                        : "Les adresses publiques apparaîtront ici"}
                    </Text>
                  </View>
                }
              />
            </>
          ) : (
            renderAddressDetails()
          )}
        </Animated.View>
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
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerContainer: {
    width: width * 0.85,
    backgroundColor: "#f5f5f5",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  geocodingLoader: {
    marginLeft: 8,
  },
  itemActions: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    marginRight: 8,
    padding: 4,
  },
  photosContainer: {
    overflow: "hidden",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  // Details view styles
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
  backButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  favoriteToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  // Review styles
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
});

export default AddressDrawer;
