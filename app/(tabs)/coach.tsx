// The «Помощник» tab opens the chat directly — no landing screen.
// (Kept as a route so deep links / tab state resolve; it just redirects.)
import { Redirect } from 'expo-router';

export default function Coach() {
  return <Redirect href={'/chat?mode=support' as any} />;
}
