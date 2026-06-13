import { describe, test, expect } from 'vitest';
import { el, replaceChildren } from '../js/utils/dom.js';

describe('el()', () => {
  test('creates a tag with the given attributes', () => {
    const button = el('button', { class: 'btn', type: 'button', 'aria-label': 'Close' }, 'OK');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).toBe('btn');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.textContent).toBe('OK');
  });

  test('skips attributes whose value is null or false', () => {
    const node = el('div', { class: 'x', hidden: false, title: null });
    expect(node.getAttribute('hidden')).toBeNull();
    expect(node.getAttribute('title')).toBeNull();
  });

  test('converts boolean true into a present attribute', () => {
    const node = el('input', { disabled: true });
    expect(node.hasAttribute('disabled')).toBe(true);
  });

  test('binds on* attributes as event listeners', () => {
    let clicked = false;
    const node = el('button', { onClick: () => { clicked = true; } }, 'Click');
    node.click();
    expect(clicked).toBe(true);
  });

  test('accepts nested array children', () => {
    const node = el('ul', {}, [
      el('li', {}, 'a'),
      el('li', {}, 'b'),
      [el('li', {}, 'c'), el('li', {}, 'd')],
    ]);
    expect(node.querySelectorAll('li')).toHaveLength(4);
  });
});

describe('replaceChildren()', () => {
  test('removes all existing children before inserting new ones', () => {
    const parent = el('div', {}, [el('span', {}, 'old')]);
    expect(parent.children).toHaveLength(1);
    replaceChildren(parent, el('p', {}, 'new'));
    expect(parent.children).toHaveLength(1);
    expect(parent.firstChild.tagName).toBe('P');
  });
});
