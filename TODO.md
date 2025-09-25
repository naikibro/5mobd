Réalisation d’une Application Liste de course

Votre application devra contenir les écrans suivants:

    Une page “Liste d’ingrédients”
    Une page “Détails d’un ingrédient”

Quelques composants à utiliser obligatoirement:

    View
    Text
    FlatList pour afficher la liste des ingrédients
    ScrollView pour afficher les différents détails d’un ingrédient sur la page “Détails d’un ingrédient”

Pour la navigation, vous avez le choix entre expo-router ou react-navigation

Par exemple pour react-navigation vous devrez:

    Utiliser le composant NavigationContainer
    Utiliser la méthode createNativeStackNavigator afin de créer votre Stack principale
    Placer votre Stack à l’intérieur de votre NavigationContainer, puis créer 2 Screens afin de représenter les écrans “Liste d’ingrédients” et “Détails d’un ingrédient”

Afin de naviguer entre les 2 pages vous devrez utiliser la méthode “navigate” soit directement depuis le hook useNavigation, soit via l’objet navigation que vos écrans prendront automatiquement en paramètre.

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Pensez à sauvegarder votre travail, votre page code sera réutilisée dans les prochains travaux pratiques.