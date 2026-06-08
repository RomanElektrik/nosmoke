// Pick an image from the library and persist it into the app's document
// directory so the URI survives app restarts (the picker's cache URI does not).

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export async function pickPhoto(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return null;
    const src = res.assets[0].uri;
    try {
      const dir = `${FileSystem.documentDirectory}imgs/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const dest = `${dir}${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: src, to: dest });
      return dest;
    } catch {
      return src; // fall back to cache uri if copy fails
    }
  } catch {
    return null;
  }
}
