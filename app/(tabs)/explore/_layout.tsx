import { Stack } from "expo-router";
import { ExplorerFilterProvider } from "@/contexts/ExplorerFilterContext";

export default function ExploreLayout() {
  return (
    <ExplorerFilterProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </ExplorerFilterProvider>
  );
}
