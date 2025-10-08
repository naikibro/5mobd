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
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { Address } from "../types/address";

const { width } = Dimensions.get("window");

const MyAddressesScreen = () => {
  const {
    fetchUserAddresses,
    deleteAddress,
    searchAddresses,
    loading,
    addresses,
    isPolling,
  } = useAddressStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  useEffect(() => {
    if (user) {
      loadMyAddresses();
    }
  }, [user]);

  const loadMyAddresses = async () => {
    if (!user) return;

    try {
      await fetchUserAddresses(user.uid);
    } catch (error) {
      console.error("Error loading my addresses:", error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await searchAddresses(query, filter, user?.uid);
        // Note: The search results will be handled by the store
      } catch (error) {
        console.error("Error searching addresses:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadMyAddresses();
    }
  };

  const handleFilterChange = (newFilter: "all" | "public" | "private") => {
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

  const renderAddress = ({ item }: { item: Address }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.name}>{item.name}</Text>
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAddress(item)}
          >
            <Ionicons name="trash" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const filteredAddresses = addresses.filter((address) => {
    if (filter === "public") return address.isPublic;
    if (filter === "private") return !address.isPublic;
    return true;
  });

  if (loading && !isPolling && addresses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Chargement de vos adresses...</Text>
      </View>
    );
  }

  return (
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
          onChangeText={handleSearch}
        />
        {(isSearching || (loading && !isPolling)) && (
          <ActivityIndicator size="small" color="#2ecc71" />
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("all")}
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
            filter === "public" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("public")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "public" && styles.filterTextActive,
            ]}
          >
            Publiques
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "private" && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange("private")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "private" && styles.filterTextActive,
            ]}
          >
            Privées
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Mes adresses</Text>
      <Text style={styles.subtitle}>
        Trouvez ici les adresses que vous avez créées
      </Text>
      <FlatList
        data={filteredAddresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
        maxWidth: 800,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
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
