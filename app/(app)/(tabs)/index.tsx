import { Redirect } from "expo-router";

export default function AppIndex() {
  // Redirect to the tabs — home is the initial tab via initialRouteName
  return <Redirect href="/(app)/(tabs)/home" />;
}
