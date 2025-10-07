import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

interface Props {
  navigation: any;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Animation values for slide-in effect
  const [logoAnim] = useState(new Animated.Value(-100));
  const [titleAnim] = useState(new Animated.Value(-100));
  const [subtitleAnim] = useState(new Animated.Value(-100));
  const [emailAnim] = useState(new Animated.Value(-100));
  const [passwordAnim] = useState(new Animated.Value(-100));
  const [buttonAnim] = useState(new Animated.Value(-100));
  const [footerAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Staggered slide-in animations from top to bottom
    const animations = [
      { anim: logoAnim, delay: 0 },
      { anim: titleAnim, delay: 100 },
      { anim: subtitleAnim, delay: 200 },
      { anim: emailAnim, delay: 300 },
      { anim: passwordAnim, delay: 400 },
      { anim: buttonAnim, delay: 500 },
      { anim: footerAnim, delay: 600 },
    ];

    animations.forEach(({ anim, delay }) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
    });
  }, [
    logoAnim,
    titleAnim,
    subtitleAnim,
    emailAnim,
    passwordAnim,
    buttonAnim,
    footerAnim,
  ]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ translateY: logoAnim }] },
          ]}
        >
          <Ionicons name="log-in" size={60} color="#2ecc71" />
        </Animated.View>
        <Animated.Text
          style={[styles.title, { transform: [{ translateY: titleAnim }] }]}
        >
          Connexion
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            { transform: [{ translateY: subtitleAnim }] },
          ]}
        >
          Connectez-vous à votre compte
        </Animated.Text>

        <Animated.View style={{ transform: [{ translateY: emailAnim }] }}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: passwordAnim }] }}>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: buttonAnim }] }}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.footer, { transform: [{ translateY: footerAnim }] }]}
        >
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkText}>S'inscrire</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    ...Platform.select({
      web: {
        maxWidth: 500,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#2ecc71",
    fontWeight: "600",
  },
});

export default LoginScreen;
