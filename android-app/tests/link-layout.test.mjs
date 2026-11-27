import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Slot } from '@radix-ui/react-slot';
import { preservePressableChild } from '../src/navigation/link-style.ts';

const flatten = value => Array.isArray(value) ? Object.assign({}, ...value.map(flatten)) : value || {};
function button(style, props = {}) {
  return createElement(({ style, children, ...rest }) => createElement('button', {
    style: flatten(typeof style === 'function' ? style({ pressed: false }) : style),
    disabled: rest.disabled,
  }, children), { style, ...props }, 'Start Here');
}

test('installed Slot loses callback styling without the compatibility boundary', () => {
  const html = renderToStaticMarkup(createElement(Slot, null, button(() => ({ backgroundColor: '#6746C3', minHeight: 54 }))));
  assert.doesNotMatch(html, /background-color/);
});

test('linked primary buttons retain their background, row layout and minimum touch target', () => {
  const child = button(() => [{ backgroundColor: '#6746C3', flexDirection: 'row', minHeight: 54, padding: 14 }]);
  const html = renderToStaticMarkup(createElement(Slot, null, preservePressableChild(child)));
  assert.match(html, /background-color:#6746C3/);
  assert.match(html, /flex-direction:row/);
  assert.match(html, /min-height:54px/);
  assert.match(html, /padding:14px/);
});

test('linked navigation items keep flex width and centered labels', () => {
  const child = button(() => ({ flex: 1, alignItems: 'center', minHeight: 54 }));
  const html = renderToStaticMarkup(createElement(Slot, null, preservePressableChild(child)));
  assert.match(html, /flex:1/); assert.match(html, /align-items:center/);
});

test('static style arrays, link styles, and pressed styles survive composition', () => {
  let captured;
  const target = createElement(props => { captured = props; return createElement('button'); }, {
    style: ({ pressed }) => [{ backgroundColor: '#C8EBDD' }, pressed && { opacity: 0.65 }],
  });
  renderToStaticMarkup(createElement(Slot, { style: { marginTop: 8 } }, preservePressableChild(target)));
  assert.deepEqual(flatten(captured.style({ pressed: true })), { marginTop: 8, backgroundColor: '#C8EBDD', opacity: 0.65 });
  const html = renderToStaticMarkup(createElement(Slot, null, preservePressableChild(button([{ flex: 1 }, { padding: 12 }]))));
  assert.match(html, /flex:1/); assert.match(html, /padding:12px/);
});

test('link and child event handlers, disabled state, accessibility and ref are preserved', () => {
  let captured; const calls = []; const ref = { current: null };
  const child = createElement(props => { captured = props; return createElement('button'); }, {
    style: () => ({ minHeight: 48 }), onPress: event => { calls.push('child'); event.preventDefault(); },
    disabled: true, accessibilityRole: 'tab', accessibilityState: { selected: true }, ref,
  });
  renderToStaticMarkup(createElement(Slot, { onPress: event => { if (!event.defaultPrevented) calls.push('navigate'); } }, preservePressableChild(child)));
  const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  captured.onPress(event);
  assert.deepEqual(calls, ['child']);
  assert.equal(captured.disabled, true);
  assert.equal(captured.accessibilityRole, 'tab');
  assert.deepEqual(captured.accessibilityState, { selected: true });
  assert.equal(captured.ref, ref);
});
