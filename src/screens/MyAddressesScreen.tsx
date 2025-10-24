import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PhotoGallery from "../components/PhotoGallery";
import { useMyAddresses } from "../hooks/useMyAddresses";
import { useAddressStore } from "../stores/addressStore";
import { Address } from "../types/address";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MyAddressesScreen = () => {
  const { deleteAddress } = useAddressStore();
  const {
    loading,
    loadMyAddresses,
    searchMyAddresses,
    getFilteredAddresses,
    isUserCreated: checkIsUserCreated,
    isFavoriteLocal,
    refreshMyAddresses,
  } = useMyAddresses();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<"all" | "created" | "favorites">("all");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Refresh addresses when screen comes into focus
  useEffect(() => {
    const refreshOnFocus = () => {
      refreshMyAddresses();
    };

    // Refresh immediately
    refreshOnFocus();

    // Set up interval to refresh every 30 seconds when screen is active (reduced from 2 seconds)
    const interval = setInterval(refreshOnFocus, 30000);

    return () => clearInterval(interval);
  }, [refreshMyAddresses]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim()) {
      setIsSearching(true);

      // Debounce search by 500ms
      const timeout = setTimeout(async () => {
        try {
          await searchMyAddresses(query);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error searching addresses:", error);
        } finally {
          setIsSearching(false);
        }
      }, 500);

      setSearchTimeout(timeout);
    } else {
      // Reset to show all addresses immediately
      setIsSearching(false);
      loadMyAddresses();
    }
  };

  const handleFilterChange = (newFilter: "all" | "created" | "favorites") => {
    setFilter(newFilter);
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      loadMyAddresses();
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      "Supprimer l'adresse",
      `Voulez-vous supprimer "${address.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              Alert.alert("Succès", "Adresse supprimée avec succès");
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  const renderAddress = ({ item }: { item: Address }) => {
    const isUserCreated = checkIsUserCreated(item);
    const isFavorite = isFavoriteLocal(item.id);

    return (
      <View style={styles.item}>
        <View style={styles.photosContainer}>
          <PhotoGallery photos={item.photos || []} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{item.name}</Text>
              {isUserCreated && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Créé</Text>
                </View>
              )}
              {isFavorite && !isUserCreated && (
                <View style={styles.favoriteBadge}>
                  <Text style={styles.favoriteBadgeText}>⭐ Favori</Text>
                </View>
              )}
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.location}>
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <Ionicons
              name={item.isPublic ? "globe" : "lock-closed"}
              size={20}
              color={item.isPublic ? "#2ecc71" : "#e74c3c"}
            />
            {isUserCreated && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAddress(item)}
              >
                <Ionicons name="trash" size={16} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const filteredAddresses = getFilteredAddresses(filter);

  if (loading && filteredAddresses.length === 0 && !isSearching) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={{ marginTop: 16, color: "#666" }}>
            Chargement de vos adresses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans mes adresses..."
            value={searchQuery}
            testID="my-addresses-search-input"
            onChangeText={handleSearch}
          />
          {isSearching && <ActivityIndicator size="small" color="#2ecc71" />}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange("all")}
            testID="filter-all-button"
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "created" && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange("created")}
            testID="filter-created-button"
          >
            <Text
              style={[
                styles.filterText,
                filter === "created" && styles.filterTextActive,
              ]}
            >
              Créées
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "favorites" && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange("favorites")}
            testID="filter-favorites-button"
          >
            <Text
              style={[
                styles.filterText,
                filter === "favorites" && styles.filterTextActive,
              ]}
            >
              Favoris
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Mes adresses</Text>
        <Text style={styles.subtitle}>
          Trouvez ici les adresses que vous avez créées et vos favoris
        </Text>
        <FlatList
          data={filteredAddresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={Platform.select({ web: width > 768 ? 2 : 1, default: 1 })}
          key={Platform.select({
            web: width > 768 ? "two-columns" : "one-column",
            default: "one-column",
          })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={80} color="#bdc3c7" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Aucune adresse trouvée"
                  : "Vous n'avez pas encore d'adresses"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Essayez avec d'autres mots-clés"
                  : "Créez votre première adresse"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#2ecc71",
    borderColor: "#2ecc71",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
      },
    }),
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
    ...Platform.select({
      web: {
        flex: width > 768 ? 0.48 : 1,
        marginHorizontal: width > 768 ? "1%" : 0,
      },
    }),
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  photosContainer: {
    overflow: "hidden",
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
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  badge: {
    backgroundColor: "#3498db",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  favoriteBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  favoriteBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
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
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default MyAddressesScreen;
