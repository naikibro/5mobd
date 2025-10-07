Passer au contenu principal
SUPINFO

    Accueil
    Tableau de bord
    Mes cours
    EDSQUARE

TP 4 : Gestion d’utilisateurs

    5MOBD
    TP 4 : Gestion d’utilisateurs

Reprenez votre application crée lors du précédant travaux pratiques, nous allons durant cette sessions y ajouter une logique de gestion d’utilisateur.

Prérequis:

Création d’un projet firebase:

    Créer un projet sur la console en ligne: https://console.firebase.google.com/u/0/
    Installer le sdk:

npx expo install firebase

    Créer un fichier firebaseConfig.js avec à l’intérieur:

const firebaseConfig = {
apiKey: 'api-key',
authDomain: 'project-id.firebaseapp.com',
databaseURL: '<https://project-id.firebaseio.com>',
projectId: 'project-id',
storageBucket: 'project-id.appspot.com',
messagingSenderId: 'sender-id',
appId: 'app-id',
measurementId: 'G-measurement-id',
};

const app = initializeApp(firebaseConfig);

    Lancer la commande:

npx expo customize metro.config.js

    Puis mettre à jour le fichier metro.config.js

const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(\_\_dirname);
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = defaultConfig;

Les utilisateurs

Vous devez présentez les nouvelles fonctionnalités suivantes:

    Écran d’inscription avec mail et mot de passe
    Écran de connexion avec mail et mot de passe
    Écran mon profil à ajouter à la bottom bar principale. Il devra proposer de quoi mettre à jour son profil (Pseudo, mail et mot de passe) ainsi que la possibilité de se déconnecter

Voici les méthodes à utiliser:

    createUserWithEmailAndPassword pour créer un utiliser à partir d’un mot de passe et d’une adresse mail:

const auth = getAuth();
createUserWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
// Signed up
const user = userCredential.user;
// ...
})
.catch((error) => {
const errorCode = error.code;
const errorMessage = error.message;
// ..
});

    Connecter un utilisateur:

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
// Signed in
const user = userCredential.user;
// ...
})
.catch((error) => {
const errorCode = error.code;
const errorMessage = error.message;
});

    Récupérer l’utilisateur courant:

const auth = getAuth();
const user = auth.currentUser;
if (user !== null) {
// The user object has basic properties such as display name, email, etc.
const displayName = user.displayName;
const email = user.email;
const photoURL = user.photoURL;
const emailVerified = user.emailVerified;

// The user's ID, unique to the Firebase project. Do NOT use
// this value to authenticate with your backend server, if
// you have one. Use User.getToken() instead.
const uid = user.uid;
}

    Mettre à jour l’utilisateur courant:

import { getAuth, updateProfile } from "firebase/auth";
const auth = getAuth();
updateProfile(auth.currentUser, {
displayName: "Jane Q. User", photoURL: "<https://example.com/jane-q-user/profile.jpg>;"
}).then(() => {
// Profile updated!
// ...
}).catch((error) => {
// An error occurred
// ...
});

    Mettre à jour l’adresse mail:

import { getAuth, updateEmail } from "firebase/auth";
const auth = getAuth();
updateEmail(auth.currentUser, "user@example.com").then(() => {
// Email updated!
// ...
}).catch((error) => {
// An error occurred
// ...
});

    Mettre à jour le mot de passe:

import { getAuth, updatePassword } from "firebase/auth";

const auth = getAuth();

const user = auth.currentUser;
const newPassword = getASecureRandomPassword();

updatePassword(user, newPassword).then(() => {
// Update successful.
}).catch((error) => {
// An error ocurred
// ...
});

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Pensez à sauvegarder votre travail, votre page code sera réutilisée dans les prochains travaux pratiques.

Modifié le: mercredi 3 janvier 2024, 15:54
Activité précédente
Aller à…
Activité suivante
Contactez-nous

Suivez-nous

Connecté sous le nom « Vaanaiki Brotherson » (Déconnexion)
