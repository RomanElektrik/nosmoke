// Web-стаб PagerView: на web роут читалки заменён app/chapter/[id].web.tsx,
// этот компонент нужен только чтобы app/chapter/[id].tsx компилился в web-бандле.
import { forwardRef } from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & {
  initialPage?: number;
  offscreenPageLimit?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
};

const PagerCompat = forwardRef<View, Props>(function PagerCompat(
  { children, initialPage, offscreenPageLimit, onPageSelected, ...rest }, ref) {
  return <View ref={ref} {...rest}>{children}</View>;
});

export default PagerCompat;
