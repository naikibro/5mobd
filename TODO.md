Passer au contenu principal
SUPINFO

    Accueil
    Tableau de bord
    Mes cours
    EDSQUARE

TP 5 : Firestore et la gestion de la data

    5MOBD
    TP 5 : Firestore et la gestion de la data

Reprenez votre application crée lors du précédant travaux pratiques, nous allons durant cette sessions y ajouter la gestion des courses par utilisateurs.

Prérequis:

    Reprendre le projet Firebase précédent

Récupération et envoi de données

Vous devez présentez les nouvelles fonctionnalités suivantes:

    Récupération des ingrédients en lignes pour la page “Listes des ingrédients” et “Détails d’un ingrédient”
    Passer par Firebase pour la gestion des listes de courses utilisateurs
    Supprimer la logique de sauvegarde via l’async-storage et passer par Firestore pour création de listes de courses.

Pour la gestion des données, vous utiliserez Firestore:

    Activer la database Firestore sur firebase console: Firebase console
    Ajouter une collection avec les ingrédients:
        Récupérer le fichier data.json du TP 3.
        Aller dans les paramètres de votre projet Firebase, dans l’onglet “Comptes de Service”, puis cliquer sur “Générer une nouvelle clé privée”
        Créer le script suivant importData.js puis modifier les require et le nom de la collection à votre convenance:

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

// Initialiser l'application Firebase Admin
admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Chemin vers votre fichier JSON
const data = require('./path/to/your/data.json').data;

// Fonction pour importer les données dans Firestore
async function importData() {
const collectionRef = firestore.collection('your_collection_name');

const batch = firestore.batch();

data.forEach((item) => {
const docRef = collectionRef.doc(); // Crée un nouveau document avec un ID unique
batch.set(docRef, item);
});

await batch.commit();
console.log('Data imported successfully!');
}

importData();

    Vous pourrez ensuite importer votre DB

> const db = getFirestore(app);

    Vous utiliserez une autre collection pour vos listes de courses.
    Pour ajouter des listes de courses:

import { collection, addDoc } from "firebase/firestore";

try {
const docRef = await addDoc(collection(db, "shoppingList"), {
name: 'Poivre',
...etc
});
console.log("Document written with ID: ", docRef.id);
} catch (e) {
console.error("Error adding document: ", e);
}

    Pour lire de manière plus spécifique:

const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
console.log(`${doc.id} => ${doc.data()}`);
});

    Pour supprimer des éléments:

import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "shoppingList", "Liste 1"));

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Pensez à sauvegarder votre travail, votre page code sera réutilisée dans les prochains travaux pratiques.

Modifié le: mercredi 3 janvier 2024, 15:56
Activité précédente
Aller à…
Activité suivante
Contactez-nous

Suivez-nous

Connecté sous le nom « Vaanaiki Brotherson » (Déconnexion)
