Passer au contenu principal
SUPINFO

    Accueil
    Tableau de bord
    Mes cours
    EDSQUARE

TP 3 : Mise à jour de l’application

    5MOBD
    TP 3 : Mise à jour de l’application

Reprenez votre application crée lors du précédant travaux pratiques, nous allons durant cette sessions y ajouter une fonctionnalité d’ajout de commande ainsi qu’une sauvegarde de liste de course.
1 - Mes courses

Vous devez présentez les nouvelles fonctionnalités suivantes:

    Écran Mes courses, avec une liste des différents ingrédients sélectionnés. Il devra aussi être possible de supprimer un ingrédient à partir de cette écran.
    Présenter les écrans “Mes courses” et “Listes des courses” via une bottom bar (BottomTabBar ou Tabs selon la méthode de navigation que vous aurez décidé au travaux pratiques précédents).
    Ajout d’un ingrédient, à partir de l’écran “Détail d’un ingrédient”

Pour la structure de navigation, voici un exemple de ce que vous pourriez faire avec react-navigation:

    Utiliser la méthode createBottomTabNavigator afin de créer un nouveau Navigator.
    Ajouter à l’intérieur de ce navigator 2 Screens: “Mes Courses” et “Listes des Courses”
    Supprimer le screen “Listes des Courses” de votre navigator principale
    Ajouter à votre navigator principale votre nouveau Navigator

Vous utiliserez la logique de Context pour gérer de manière global les données:

    Création d’un context avec createContext, il retournera 3 valeurs (vous êtes libre sur le nommage):
        shoppingList: Tableau de course
        addItem: Méthode permettant d’ajouter un ingrédient
        removeItem: Méthode permettant de supprimer un ingrédient
    Création d’un provider: A partir du context précédent, vous créerez un Provider à mettre au début de votre cycle de rendu. Voici un exemple de format possible:

const ShoppingListProvider = ({ children }) => {
const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

const addItem = (item: ShoppingItem) => {
setShoppingList(prevList => [...prevList, item]);
};

const removeItem = (itemId: string) => {
setShoppingList(prevList => prevList.filter(item => item.id !== itemId));
};

useEffect(() => {
// Ici, vous pouvez initialiser la liste de courses, par exemple en la chargeant depuis le stockage local
}, []);

return (
<ShoppingListContext.Provider value={{ shoppingList, addItem, removeItem }}>
{children}
</ShoppingListContext.Provider>
);
};

    Création ensuite d’un hook utilisant useContext afin de récupérer les valeurs que vous avez partagées précédemment. Voici un exemple:

const useShoppingList = () =>{
const context = useContext(ShoppingListContext);

return context;
}

2 - Local Storage

Durant cette partie, vous allez faire en sorte que vos courses soient sauvegardé sur le cache du téléphone et persiste après que l’application est été fermé puis réouverte

Pour cela, utilisez la librairie suivante: @react-native-async-storage/async-storage

    Vous utiliserez la méthode getItem afin de récupérer vos données:

const value = await AsyncStorage.getItem('my-key');

    Puis la méthode setItem afin de sauvegarder toutes les nouvelles entrées:

await AsyncStorage.setItem('my-key', value);

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Pensez à sauvegarder votre travail, votre page code sera réutilisée dans les prochains travaux pratiques.

Modifié le: mercredi 3 janvier 2024, 15:49
Activité précédente
Aller à…
Activité suivante
Contactez-nous

Suivez-nous

Connecté sous le nom « Vaanaiki Brotherson » (Déconnexion)
