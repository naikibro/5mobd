import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, "Firebase API Key is required"),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, "Firebase Auth Domain is required"),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, "Firebase Project ID is required"),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "Firebase Storage Bucket is required"),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "Firebase Messaging Sender ID is required"),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: z
    .string()
    .min(1, "Google Maps API Key is required"),
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // eslint-disable-next-line no-console
      console.error("\n❌ Environment Configuration Error\n");
      // eslint-disable-next-line no-console
      console.error("━".repeat(50));
      // eslint-disable-next-line no-console
      console.error("\n🔥 Missing or invalid environment variables:\n");

      missingVars.forEach(({ field, message }) => {
        // eslint-disable-next-line no-console
        console.error(`  • ${field}`);
        // eslint-disable-next-line no-console
        console.error(`    └─ ${message}\n`);
      });

      // eslint-disable-next-line no-console
      console.error("━".repeat(50));
      // eslint-disable-next-line no-console
      console.error("\n📝 To fix this:");
      // eslint-disable-next-line no-console
      console.error(
        "  1. Make sure you have a .env file in the root directory"
      );
      // eslint-disable-next-line no-console
      console.error("  2. Copy .env.example to .env if you haven't already");
      // eslint-disable-next-line no-console
      console.error("  3. Fill in all the required Firebase credentials");
      // eslint-disable-next-line no-console
      console.error("\n💡 Get your credentials from:");
      // eslint-disable-next-line no-console
      console.error("  https://console.firebase.google.com/\n");
      // eslint-disable-next-line no-console
      console.error("━".repeat(50));
      // eslint-disable-next-line no-console
      console.error("");

      throw new Error(
        "Missing required environment variables. Check console for details."
      );
    }
    throw error;
  }
}

export const env = validateEnv();
