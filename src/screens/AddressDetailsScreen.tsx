import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FullsizeImageCarousel from "../components/FullsizeImageCarousel";
import { useGeocoding } from "../hooks/useGeocoding";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { AddressStackParamList } from "../types/navigation";

const { width } = Dimensions.get("window");

type AddressDetailsScreenRouteProp = RouteProp<
  AddressStackParamList,
  "AddressDetails"
>;

interface Props {
  route: AddressDetailsScreenRouteProp;
}

const AddressDetailsScreen: React.FC<Props> = ({ route }) => {
  const { address } = route.params;
  const navigation =
    useNavigation<NativeStackNavigationProp<AddressStackParamList>>();
  const { deleteAddress, getAddressWithReviews } = useAddressStore();
  const { user } = useAuthStore();
  const { getStreetName } = useGeocoding();
  const [addressWithReviews, setAddressWithReviews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streetAddress, setStreetAddress] = useState<string | null>(null);

  useEffect(() => {
    loadAddressDetails();
    loadStreetAddress();
  }, []);

  const loadStreetAddress = async () => {
    try {
      const streetName = await getStreetName({
        latitude: address.latitude,
        longitude: address.longitude,
      });
      setStreetAddress(streetName);
    } catch (error) {
      console.error("Error loading street address:", error);
    }
  };

  const loadAddressDetails = async () => {
    try {
      const details = await getAddressWithReviews(address.id);
      setAddressWithReviews(details);
    } catch (error) {
      console.error("Error loading address details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = () => {
    Alert.alert(
      "Supprimer l'adresse",
      `Êtes-vous 
      sûr de vouloir supprimer "${address.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              Alert.alert("Succès", "Adresse supprimée avec succès", [
                {
                  text: "OK",
                  onPress: () => {
                    // Navigate back to the appropriate list screen
                    if (user && user.uid === address.userId) {
                      // If it's the user's own address, go back to AddressList
                      navigation.navigate("AddressList");
                    } else {
                      // Otherwise, go to AddressList
                      navigation.navigate("AddressList");
                    }
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {address.photos && address.photos.length > 0 && (
        <FullsizeImageCarousel photos={address.photos} />
      )}
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{address.name}</Text>
            <View style={styles.visibilityContainer}>
              <Ionicons
                name={address.isPublic ? "globe" : "lock-closed"}
                size={20}
                color={address.isPublic ? "#2ecc71" : "#e74c3c"}
              />
              <Text style={styles.visibilityText}>
                {address.isPublic ? "Public" : "Privé"}
              </Text>
            </View>
          </View>
          {addressWithReviews && addressWithReviews.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(Math.round(addressWithReviews.averageRating))}
              </View>
              <Text style={styles.ratingText}>
                {addressWithReviews.averageRating.toFixed(1)} (
                {addressWithReviews.reviewCount} avis)
              </Text>
            </View>
          )}
        </View>

        {address.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{address.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.addressRow}>
            <Text style={styles.infoLabel}>Adresse:</Text>
            <Text style={styles.addressValue}>
              {streetAddress ||
                `${address.latitude.toFixed(4)}, ${address.longitude.toFixed(
                  4
                )}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Latitude:</Text>
            <Text style={styles.infoValue}>{address.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Longitude:</Text>
            <Text style={styles.infoValue}>{address.longitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé le:</Text>
            <Text style={styles.infoValue}>
              {formatDate(address.createdAt)}
            </Text>
          </View>
        </View>

        {addressWithReviews && addressWithReviews.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Avis ({addressWithReviews.reviews.length})
            </Text>
            {addressWithReviews.reviews.map((review: any) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <Text style={styles.reviewUserName}>
                      {review.userDisplayName}
                    </Text>
                    <View style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.createdAt)}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                {review.photos && review.photos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {review.photos.map((photo: string, index: number) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.reviewPhoto}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        )}

        {user && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => navigation.navigate("Reviews", { address })}
          >
            <Ionicons
              name="star"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.reviewButtonText}>Laisser un avis</Text>
          </TouchableOpacity>
        )}

        {user && user.uid === address.userId && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAddress}
          >
            <Ionicons
              name="trash"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.deleteButtonText}>Supprimer cette adresse</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  wrapper: {
    padding: 16,
  },
  header: {
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
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  visibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  ratingContainer: {
    alignItems: "flex-start",
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
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
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  addressValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
    lineHeight: 22,
  },
  reviewItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewUser: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  reviewButton: {
    backgroundColor: "#f39c12",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  reviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddressDetailsScreen;
