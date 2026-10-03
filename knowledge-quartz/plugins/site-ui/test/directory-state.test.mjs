import test from 'node:test';
import assert from 'node:assert/strict';
import { directoryState } from '../src/navigation.mjs';

test('a narrow reader starts closed and toggles its directory drawer', () => {
  const initial = directoryState(null, 'init', true);
  assert.equal(initial.open, false);
  const opened = directoryState(initial, 'toggle');
  assert.equal(opened.open, true);
  assert.equal(directoryState(opened, 'close').open, false);
});

test('choosing an article closes a mobile drawer but retains the desktop tree', () => {
  const mobile = directoryState(directoryState(null, 'init', true), 'toggle');
  assert.equal(directoryState(mobile, 'navigate').open, false);
  assert.equal(directoryState(directoryState(null, 'init', false), 'navigate').open, true);
});

test('resizing an open drawer to desktop clears its mobile mode', () => {
  const mobile = directoryState(directoryState(null, 'init', true), 'toggle');
  assert.deepEqual(directoryState(mobile, 'resize', false), {mobile: false, open: true, desktopOpen: true});
});

test('entering a narrow window always closes the drawer', () => {
  const desktop = directoryState(null, 'init', false);
  assert.deepEqual(directoryState(desktop, 'resize', true), {mobile: true, open: false, desktopOpen: true});
});

test('desktop collapse survives a mobile round trip', () => {
  const collapsed = directoryState(directoryState(null, 'init', false), 'toggle');
  assert.equal(collapsed.open, false);
  const mobile = directoryState(directoryState(collapsed, 'resize', true), 'toggle');
  assert.deepEqual(directoryState(mobile, 'resize', false), {mobile: false, open: false, desktopOpen: false});
});
