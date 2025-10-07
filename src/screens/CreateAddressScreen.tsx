import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useAddress } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const CreateAddressScreen = () => {
  const { createAddress } = useAddress();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 48.8566, // Paris coordinates as default
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        setSelectedLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setMapRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom de l'adresse est requis");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Erreur", "Veuillez sélectionner une position sur la carte");
      return;
    }

    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une adresse");
      return;
    }

    setLoading(true);
    try {
      await createAddress({
        name: name.trim(),
        description: description.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        isPublic,
        userId: user.uid,
        photos: [],
      });

      Alert.alert("Succès", "Adresse créée avec succès", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setName("");
            setDescription("");
            setIsPublic(true);
            setSelectedLocation(null);
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating address:", error);
      Alert.alert("Erreur", "Impossible de créer l'adresse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={18} color="#333" />{" "}
            Informations
          </Text>

          <Text style={styles.label}>Nom de l'adresse *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Restaurant Le Bistrot"
            maxLength={100}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez cette adresse..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <View style={styles.privacyContainer}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.privacyOptions}>
              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  isPublic && styles.privacyOptionActive,
                ]}
                onPress={() => setIsPublic(true)}
              >
                <Ionicons
                  name="globe"
                  size={20}
                  color={isPublic ? "#fff" : "#2ecc71"}
                />
                <Text
                  style={[
                    styles.privacyText,
                    isPublic && styles.privacyTextActive,
                  ]}
                >
                  Publique
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  !isPublic && styles.privacyOptionActive,
                ]}
                onPress={() => setIsPublic(false)}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={!isPublic ? "#fff" : "#e74c3c"}
                />
                <Text
                  style={[
                    styles.privacyText,
                    !isPublic && styles.privacyTextActive,
                  ]}
                >
                  Privée
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="map" size={18} color="#333" /> Position
          </Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title="Position sélectionnée"
                />
              )}
            </MapView>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.mapHint}>
            Appuyez sur la carte pour sélectionner la position
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
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Créer l'adresse</Text>
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  privacyContainer: {
    marginBottom: 16,
  },
  privacyOptions: {
    flexDirection: "row",
    gap: 12,
  },
  privacyOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  privacyOptionActive: {
    backgroundColor: "#2ecc71",
    borderColor: "#2ecc71",
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  privacyTextActive: {
    color: "#fff",
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#2ecc71",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
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

export default CreateAddressScreen;
