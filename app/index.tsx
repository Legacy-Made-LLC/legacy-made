import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function RootIndex() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)" />;
}
