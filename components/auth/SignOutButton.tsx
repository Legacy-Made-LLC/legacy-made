import { useAuth } from "@clerk/expo";
import * as Linking from "expo-linking";
import { Text, TouchableOpacity } from "react-native";

import { logger } from "@/lib/logger";

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      // See Clerk docs: custom flows error handling
      // for more info on error handling
      logger.error("Sign-out failed", err);
    }
  };
  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign out</Text>
    </TouchableOpacity>
  );
};
