# TODO-bis.md - Plan Détaillé d'Implémentation "Mes Bonnes Adresses"

## Vue d'ensemble du projet

Transformation de l'application "5MOBD" (liste de courses) en "Mes Bonnes Adresses" - une application de gestion d'adresses favorites avec fonctionnalités sociales.

## Phase 1: Restructuration de l'architecture (2h)

### 1.1 Mise à jour des types et interfaces

- [ ] Créer `src/types/address.ts` avec les interfaces:
  - `Address` (id, name, description, latitude, longitude, isPublic, userId, photos[], createdAt)
  - `Review` (id, addressId, userId, rating, comment, photos[], createdAt)
  - `User` (id, email, displayName, photoURL, createdAt)

### 1.2 Refactoring des écrans existants

- [ ] Renommer `IngredientsListScreen` → `AddressListScreen`
- [ ] Renommer `IngredientDetailsScreen` → `AddressDetailsScreen`
- [ ] Renommer `MyShoppingScreen` → `MyAddressesScreen`
- [ ] Supprimer `ShoppingListContext` → Créer `AddressContext`

### 1.3 Mise à jour de la navigation

- [ ] Modifier `src/types/navigation.ts` pour les nouveaux écrans
- [ ] Mettre à jour `App.tsx` avec la nouvelle structure de navigation

## Phase 2: Gestion d'utilisateurs améliorée (3h)

### 2.1 Firebase Security Rules (5 pts)

- [ ] Créer `firestore.rules` avec:
  - Authentification requise pour toutes les opérations
  - Utilisateurs peuvent lire/écrire leurs propres données
  - Adresses publiques lisibles par tous les utilisateurs authentifiés
  - Reviews lisibles par tous, créables par utilisateurs authentifiés

### 2.2 Gestion de photo de profil (5 pts)

- [ ] Ajouter `expo-image-picker` et `expo-image-manipulator`
- [ ] Créer `ProfilePhotoPicker` component
- [ ] Intégrer dans `ProfileScreen` avec upload vers Firebase Storage
- [ ] Mettre à jour `AuthContext` pour gérer les photos de profil

### 2.3 Amélioration des écrans d'authentification

- [ ] Ajouter validation email plus robuste
- [ ] Améliorer les messages d'erreur
- [ ] Ajouter indicateurs de chargement

## Phase 3: Intégration MapView (4h)

### 3.1 Installation et configuration (15 pts)

- [ ] Installer `react-native-maps` et `expo-location`
- [ ] Configurer les permissions de localisation dans `app.json`
- [ ] Créer `MapScreen` avec MapView centré sur la position utilisateur
- [ ] Ajouter gestion des permissions de localisation

### 3.2 Fonctionnalités de carte

- [ ] Affichage des adresses sur la carte avec marqueurs
- [ ] Différenciation visuelle (privé/publique)
- [ ] Tap sur marqueur → navigation vers détails
- [ ] Bouton "Ma position" pour recentrer

## Phase 4: Gestion des adresses (5h)

### 4.1 Création d'adresse (25 pts)

- [ ] Créer `CreateAddressScreen` avec:
  - Champ nom (requis)
  - Champ description (optionnel)
  - Sélecteur privé/publique
  - Sélection de position sur carte
  - Upload de photos multiples
- [ ] Intégrer avec `AddressContext` pour sauvegarde Firebase

### 4.2 Suppression d'adresse (5 pts)

- [ ] Ajouter bouton suppression dans `AddressDetailsScreen`
- [ ] Confirmation avant suppression
- [ ] Suppression des photos associées dans Storage

### 4.3 Visualisation des adresses (20 pts)

- [ ] `MyAddressesScreen`: affichage des adresses privées + publiques de l'utilisateur
- [ ] `PublicAddressesScreen`: affichage des adresses publiques des autres utilisateurs
- [ ] Filtres par type (privé/publique)
- [ ] Recherche par nom/description

## Phase 5: Système de reviews et commentaires (3h)

### 5.1 Reviews sur adresses (10 pts)

- [ ] Créer `ReviewScreen` avec:
  - Système de notation (1-5 étoiles)
  - Champ commentaire
  - Upload de photos
- [ ] Affichage des reviews dans `AddressDetailsScreen`
- [ ] Calcul de note moyenne par adresse

## Phase 6: Tests et finalisation (3h)

### 6.1 Tests unitaires et fonctionnels (25 pts)

- [ ] Tests pour `AuthContext`
- [ ] Tests pour `AddressContext`
- [ ] Tests pour les composants principaux
- [ ] Tests d'intégration pour les flux critiques

### 6.2 Optimisations et polish

- [ ] Gestion des erreurs réseau
- [ ] Indicateurs de chargement
- [ ] Messages d'état vides
- [ ] Responsive design pour web

## Phase 7: Documentation et déploiement (1h)

### 7.1 Documentation

- [ ] Mise à jour du README.md
- [ ] Documentation des APIs
- [ ] Guide d'installation et configuration

### 7.2 Déploiement

- [ ] Configuration pour production
- [ ] Variables d'environnement
- [ ] Tests de déploiement

## Estimation totale: ~21h

## Points totaux: 125 pts

## Ordre de priorité:

1. **Critique**: Phases 1-2 (Architecture + Auth)
2. **Important**: Phases 3-4 (MapView + Adresses)
3. **Fonctionnel**: Phases 5-6 (Reviews + Tests)
4. **Finalisation**: Phase 7 (Documentation)

## Dépendances techniques:

- Node.js LTS 20.18.0 ✓
- Expo SDK 54 ✓
- Firebase (Auth + Firestore + Storage) ✓
- React Native Maps
- Expo Location
- Expo Image Picker
- Jest + Testing Library ✓
