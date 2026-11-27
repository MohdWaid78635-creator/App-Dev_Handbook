import { cloneElement, createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import type { Pressable } from 'react-native';

type TargetProps = ComponentPropsWithRef<typeof Pressable>;
type SlotTargetProps = TargetProps & { element: ReactElement<TargetProps> };

function SlotStyleTarget({ element, style: slotStyle, ...props }: SlotTargetProps) {
  const childStyle = element.props.style;
  return cloneElement(element, { ...props, style: state => [
    typeof slotStyle === 'function' ? slotStyle(state) : slotStyle,
    typeof childStyle === 'function' ? childStyle(state) : childStyle,
  ] });
}

export function preservePressableChild(child: ReactElement): ReactElement {
  const element = child as ReactElement<TargetProps>;
  const { style: _style, ...props } = element.props;
  // Keep styles nested until after Router's Slot merge, which spreads callback styles into {}.
  return createElement(SlotStyleTarget, { ...props, element, key: child.key });
}
