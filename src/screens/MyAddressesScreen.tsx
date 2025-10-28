import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AddressList from "../components/AddressList";
import { useMyAddresses } from "../hooks/useMyAddresses";
import { useFavorites } from "../hooks/useFavorites";
import { Address } from "../types/address";
import { RootStackParamList, MainTabParamList } from "../types/navigation";
import { SafeAreaView } from "react-native-safe-area-context";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "MyAddresses">,
  NativeStackNavigationProp<RootStackParamList>
>;

const MyAddressesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { toggleFavorite, isFavoriteLocal } = useFavorites();
  const {
    loading,
    loadMyAddresses,
    searchMyAddresses,
    getFilteredAddresses,
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

  const handleAddressPress = (address: Address) => {
    navigation.navigate("Map", { addressId: address.id });
  };

  const handleFavoritePress = async (addressId: string) => {
    try {
      await toggleFavorite(addressId);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
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
        <AddressList
          addresses={filteredAddresses}
          streetNames={new Map()} // Empty map since we don't need street names for my addresses
          isGeocodingLoading={false}
          onAddressPress={handleAddressPress}
          onFavoritePress={handleFavoritePress}
          isFavorite={isFavoriteLocal}
          searchQuery={searchQuery}
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
