import React from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AddressWithReviews } from "../types/address";

const { width, height } = Dimensions.get("window");

interface AddressDetailsModalProps {
  visible: boolean;
  address: AddressWithReviews | null;
  onClose: () => void;
  loading?: boolean;
}

const AddressDetailsModal: React.FC<AddressDetailsModalProps> = ({
  visible,
  address,
  onClose,
  loading = false,
}) => {
  if (!address) return null;

  const renderPhotos = () => {
    if (!address.photos || address.photos.length === 0) {
      return (
        <View style={styles.noPhotosContainer}>
          <Ionicons name="image-outline" size={40} color="#bdc3c7" />
          <Text style={styles.noPhotosText}>Aucune photo</Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {address.photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.photo}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
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
            <Text style={styles.sectionTitle}>Photos</Text>
            {renderPhotos()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avis</Text>
            <View style={styles.reviewsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2ecc71" />
                  <Text style={styles.loadingText}>Chargement des avis...</Text>
                </View>
              ) : address.reviews && address.reviews.length > 0 ? (
                address.reviews.map((review, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewRating}>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
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
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  noPhotosContainer: {
    height: 120,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  noPhotosText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
});

export default AddressDetailsModal;
