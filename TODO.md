Passer au contenu principal
SUPINFO

    Accueil
    Tableau de bord
    Mes cours
    EDSQUARE

TP 6 : Tester son application

    5MOBD
    TP 6 : Tester son application

Reprenez votre application crée lors du précédant travaux pratiques, nous allons durant cette sessions y ajouter des tests unitaires et end to end.
1 - Tests unitaires

En utilisant la librairie react-native-testing-librairie et la documentation, vous devrez mettre en place les tests suivants:

    Tester la navigation sur un bouton de l’application (exemple: item ingrédient sur l’écran “liste des ingrédients”, qui redirige sur l’écran “détail d’un ingrédient”). Si vous utilisez expo-router, vous aurez besoin de cette documentation.
    Tester l’écran de connexion en faisant un mock de la librairie firebase

Vous pouvez vous aider de ces exemples:

test('navigation on button press', () => {
const { getByText, findByText } = render(
<MockedNavigator component={IngredientsListScreen} />
);

const button = getByText('Voir Détails'); // Texte du bouton sur IngredientsListScreen
fireEvent.press(button);

const detailScreen = findByText('Détail Ingrédient'); // Texte attendu sur IngredientDetailScreen
expect(detailScreen).toBeTruthy();
});

// Mock de Firebase
jest.mock('firebase/app', () => ({
auth: jest.fn().mockReturnThis(),
signInWithEmailAndPassword: jest.fn(() => Promise.resolve('Mocked user')),
}));

2 - Test end to end

En utilisant Detox mettre en place l’user journey complète d’un utilisateur:

    Inscription
    Connexion
    Création d’une liste de course
    Ajout et suppression d’un ingrédient
    Déconnexion

Setup de Detox: https://wix.github.io/Detox/docs/introduction/environment-setup

    Installer le CLI:

npm install detox-cli --global

    Ajouter la dependance au projet:

npm install detox --save-dev

    Initialiser le projet detox:

detox init

    Ajouter des scripts au package.json du projet:

"e2e:test": "detox test -c ios.release",
"e2e:build": "detox build -c ios.release",
"e2e:ci": "npm run e2e:build && npm run e2e:test -- --cleanup"

    Dans le dossier e2e/tests créer par detox, vous pourrez y mettre vos tests. Voici un exemple d’un test pour l’écran de connexion:

describe('User signup journey', () => {

it('should sign up a new user', async () => {
await device.launchApp({newInstance: true});

    await expect(element(by.id('signup-screen'))).toBeVisible();
    await element(by.id('signup-email')).typeText('test@example.com');
    await element(by.id('signup-password')).typeText('password');
    await element(by.id('signup-button')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();

});

// Les autres tests suivront ici...
});

Vous êtes libre de réaliser la structure et d'utiliser les éléments que vous souhaitez, tant que ceux-ci sont pertinent.

Pensez à sauvegarder votre travail, votre code sera réutilisée dans les prochains travaux pratiques.

Modifié le: mercredi 3 janvier 2024, 16:00
Activité précédente
Aller à…
Activité suivante
Contactez-nous

Suivez-nous

Connecté sous le nom « Vaanaiki Brotherson » (Déconnexion)
