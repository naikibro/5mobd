const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

// Load data from data.json
const data = require("./data.json").data;

// Import ingredients to Firestore
async function importData() {
  const collectionRef = firestore.collection("ingredients");
  const batch = firestore.batch();

  data.forEach((item) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, item);
  });

  await batch.commit();
  console.log("✅ Data imported successfully!");
  console.log(`📦 Imported ${data.length} ingredients to Firestore`);
}

importData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  });
