import { Redirect } from "expo-router";

export default function AppIndex() {
  // Redirect to the tabs (information is the first/default tab)
  return <Redirect href="/(app)/(tabs)/information" />;
}
