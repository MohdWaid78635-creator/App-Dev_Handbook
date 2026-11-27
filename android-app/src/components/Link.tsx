import { Children } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import { Link as RouterLink } from 'expo-router';
import { preservePressableChild } from '../navigation/link-style';

/** Expo Router navigation with native Pressable styles preserved through its Slot. */
export function Link({ asChild, children, ...props }: ComponentProps<typeof RouterLink>) {
  return <RouterLink {...props} asChild={asChild}>
    {asChild ? preservePressableChild(Children.only(children) as ReactElement) : children}
  </RouterLink>;
}
