import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useShoppingList } from "../context/ShoppingListContext";

const MyShoppingScreen = () => {
  const { shoppingList, removeItem, updateQuantity } = useShoppingList();

  const handleRemoveItem = (itemId: number, itemName: string) => {
    Alert.alert(
      "Supprimer l'article",
      `Voulez-vous supprimer "${itemName}" de votre liste de courses ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => removeItem(itemId),
        },
      ]
    );
  };

  const handleQuantityChange = (itemId: number, currentQuantity: number) => {
    Alert.prompt(
      "Modifier la quantité",
      "Entrez la nouvelle quantité :",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "OK",
          onPress: (text: string | undefined) => {
            const newQuantity = parseInt(text || "1", 10);
            if (!isNaN(newQuantity) && newQuantity > 0) {
              updateQuantity(itemId, newQuantity);
            }
          },
        },
      ],
      "plain-text",
      currentQuantity.toString()
    );
  };

  const renderShoppingItem = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.price}>€{item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity)}
          >
            <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id, item.name)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.totalPrice}>
        Total: €{(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  const getTotalPrice = () => {
    return shoppingList.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  if (shoppingList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Votre liste de courses est vide</Text>
        <Text style={styles.emptySubtext}>
          Ajoutez des ingrédients depuis la liste des ingrédients
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shoppingList}
        renderItem={renderShoppingItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          Total: €{getTotalPrice().toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list: {
    padding: 16,
    paddingBottom: 80,
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
    alignItems: "center",
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
  category: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2ecc71",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  quantityText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#e74c3c",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  totalPrice: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  totalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2ecc71",
    textAlign: "center",
  },
});

export default MyShoppingScreen;
