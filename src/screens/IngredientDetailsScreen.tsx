import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { useShoppingList } from "../context/ShoppingListContext";

type IngredientDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "IngredientDetails"
>;

interface Props {
  route: IngredientDetailsScreenRouteProp;
}

const IngredientDetailsScreen: React.FC<Props> = ({ route }) => {
  const { ingredient } = route.params;
  const { addItem, shoppingList } = useShoppingList();

  const handleAddToShoppingList = () => {
    addItem(ingredient);
    Alert.alert(
      "Ajouté !",
      `${ingredient.name} a été ajouté à votre liste de courses`,
      [{ text: "OK" }]
    );
  };

  const isInShoppingList = shoppingList.some(
    (item) => item.id === ingredient.id
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{ingredient.name}</Text>
        <Text style={styles.price}>€{ingredient.price.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{ingredient.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Catégorie:</Text>
          <Text style={styles.infoValue}>{ingredient.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Poids:</Text>
          <Text style={styles.infoValue}>{ingredient.weight}g</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Origine:</Text>
          <Text style={styles.infoValue}>{ingredient.origin}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prix</Text>
        <Text style={styles.priceDetail}>
          €{ingredient.price.toFixed(2)} pour {ingredient.weight}g
        </Text>
        <Text style={styles.pricePerKg}>
          €{(ingredient.price / (ingredient.weight / 1000)).toFixed(2)}/kg
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, isInShoppingList && styles.addButtonDisabled]}
        onPress={handleAddToShoppingList}
        disabled={isInShoppingList}
      >
        <Text style={styles.addButtonText}>
          {isInShoppingList ? "Déjà dans la liste" : "Ajouter à ma liste"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
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
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2ecc71",
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
  priceDetail: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  pricePerKg: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default IngredientDetailsScreen;
