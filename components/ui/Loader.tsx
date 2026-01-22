import { colors } from "@/constants/theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Loader() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
});