// Платформенная обёртка над react-native-pager-view: натив использует пакет,
// web получает стаб из PagerCompat.web.tsx (пакет тянет нативные internals и
// валит web-бандл; сам роут читалки на web живёт в app/chapter/[id].web.tsx).
export { default } from 'react-native-pager-view';
