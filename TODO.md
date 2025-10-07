Passer au contenu principal
SUPINFO

    Accueil
    Tableau de bord
    Mes cours
    EDSQUARE

TP 7 : Une nouvelle plateforme !

    5MOBD
    TP 7 : Une nouvelle plateforme !

Reprenez votre application crée lors du précédant travaux pratiques, nous allons durant cette sessions y ajouter une compatibilité Web
Un coup de Polish !

Rendez votre application compatible web en adaptant son design afin qu’il soit responsive. L'entièreté des fonctionnalitées précedemment cité devra être utilisable.

Voici comment procéder pour l’installation: https://docs.expo.dev/workflow/web/

    Installer les dépendances:

npx expo install react-dom react-native-web @expo/webpack-config

    Lancer le projet:

npx expo start --web

En plus de ça, de nouvelles fonctionnalitées sont attendu:

    Ajouter des icons via expo/vector-icons
    Mettre en place une animation Lottie en splashcreen

Pour Lottie sur react-native: https://github.com/lottie-react-native/lottie-react-native

    Installer la dépendance:

npm install lottie-react-native

    Télécharger un fichier d’animation json ici: https://lottiefiles.com/featured
    Placer le nouveau composant d’un écran Splashscreen à ajouter à votre navigator:

import React from "react";
import LottieView from "lottie-react-native";

export default function Animation() {
return (
<LottieView source={require("../path/to/animation.json")} autoPlay loop />
);
}

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Modifié le: mercredi 3 janvier 2024, 16:02
Activité précédente
Aller à…
Contactez-nous

Suivez-nous

Connecté sous le nom « Vaanaiki Brotherson » (Déconnexion)
