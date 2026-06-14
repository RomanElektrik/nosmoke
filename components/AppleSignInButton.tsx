// Нативная кнопка «Войти через Apple». Только iOS. По нажатию входит, привязывает
// устройство к аккаунту и при наличии подписки восстанавливает премиум.

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Platform, type ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { update } from '../lib/storage';
import { signInWithApple, isAppleAvailable } from '../lib/auth';
import { currentLang } from '../lib/i18n';

export function AppleSignInButton({
  onDone,
  style,
  dark,
}: {
  onDone?: (premium: boolean) => void;
  style?: ViewStyle;
  dark?: boolean;
}) {
  const ru = currentLang() === 'ru';
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let alive = true;
    isAppleAvailable().then((a) => alive && setAvailable(a));
    return () => { alive = false; };
  }, []);

  if (Platform.OS !== 'ios' || !available) return null;

  async function go() {
    setBusy(true);
    try {
      const st = await signInWithApple();
      await update((s) => ({
        ...s,
        premiumUntil: st.premium ? st.until : (s.premiumUntil ?? 0),
      }));
      onDone?.(!!st.premium);
      if (st.premium) {
        Alert.alert(ru ? 'Готово' : 'Done', ru ? 'Вход выполнен — подписка восстановлена.' : 'Signed in — subscription restored.');
      } else {
        Alert.alert(ru ? 'Вход выполнен' : 'Signed in', ru ? 'Аккаунт привязан — теперь подписка сохранится за ним на любом устройстве.' : 'Account linked — your purchase is now tied to it.');
      }
    } catch (e: any) {
      const code = String(e?.code || '');
      if (code === 'ERR_REQUEST_CANCELED' || /cancel/i.test(String(e?.message || ''))) {
        // пользователь отменил — молча
      } else {
        Alert.alert(ru ? 'Не получилось войти' : 'Sign-in failed', String(e?.message || ''));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={style}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={{ height: 48, width: '100%' }}
        onPress={go}
      />
      {busy && <ActivityIndicator color={dark ? '#000' : '#fff'} style={{ position: 'absolute', right: 16, top: 14 }} />}
    </View>
  );
}
