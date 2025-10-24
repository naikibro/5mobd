import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PhotoGallery from "./PhotoGallery";
import { Address } from "../types/address";

interface AddressListProps {
  addresses: Address[];
  streetNames: Map<string, string>;
  isGeocodingLoading: boolean;
  onAddressPress: (address: Address) => void;
  onFavoritePress: (addressId: string) => void;
  isFavorite: (addressId: string) => boolean;
  searchQuery: string;
}

const AddressList: React.FC<AddressListProps> = ({
  addresses,
  streetNames,
  isGeocodingLoading,
  onAddressPress,
  onFavoritePress,
  isFavorite,
  searchQuery,
}) => {
  const renderAddress = ({ item }: { item: Address }) => {
    const key = `${item.latitude},${item.longitude}`;
    const streetName = streetNames.get(key);
    const isFavoriteItem = isFavorite(item.id);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onAddressPress(item)}
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
              onPress={() => onFavoritePress(item.id)}
            >
              <Ionicons
                name={isFavoriteItem ? "star" : "star-outline"}
                size={20}
                color={isFavoriteItem ? "#ffd700" : "#666"}
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

  return (
    <FlatList
      data={addresses}
      renderItem={renderAddress}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={5}
      getItemLayout={(data, index) => ({
        length: 120,
        offset: 120 * index,
        index,
      })}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>
            {searchQuery ? "Aucune adresse trouvée" : "Aucune adresse publique"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Essayez avec d'autres mots-clés"
              : "Les adresses publiques apparaîtront ici"}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
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
});

export default AddressList;
