import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useOnClickOutside } from '../useOnClickOutside';

describe('useOnClickOutside', () => {
  let ref;
  let handler;
  let container;

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create a mock ref
    ref = { current: document.createElement('div') };
    container.appendChild(ref.current);

    // Create a mock handler
    handler = jest.fn();
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  test('calls handler when clicking outside the element', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    // Click outside (on container)
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(mouseEvent);
  });

  test('does not call handler when clicking inside the element', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    // Click inside (on ref.current)
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    ref.current.dispatchEvent(mouseEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  test('handles touchstart events', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    // Touch outside (on container)
    const touchEvent = new TouchEvent('touchstart', { bubbles: true });
    container.dispatchEvent(touchEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(touchEvent);
  });

  test('does not call handler for touchstart inside the element', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    // Touch inside (on ref.current)
    const touchEvent = new TouchEvent('touchstart', { bubbles: true });
    ref.current.dispatchEvent(touchEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  test('handles null ref gracefully', () => {
    const nullRef = { current: null };
    renderHook(() => useOnClickOutside(nullRef, handler));

    // Click anywhere
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent);

    // Should call handler since ref is null (treated as outside)
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('considers additional refs as inside', () => {
    const additionalRef = { current: document.createElement('div') };
    container.appendChild(additionalRef.current);

    renderHook(() => useOnClickOutside(ref, handler, [additionalRef]));

    // Click on additional ref
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    additionalRef.current.dispatchEvent(mouseEvent);

    // Should not call handler (click is inside additional ref)
    expect(handler).not.toHaveBeenCalled();
  });

  test('calls handler when clicking outside all refs', () => {
    const additionalRef = { current: document.createElement('div') };
    container.appendChild(additionalRef.current);

    renderHook(() => useOnClickOutside(ref, handler, [additionalRef]));

    // Click on container (outside all refs)
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('handles multiple additional refs', () => {
    const additionalRef1 = { current: document.createElement('div') };
    const additionalRef2 = { current: document.createElement('div') };
    container.appendChild(additionalRef1.current);
    container.appendChild(additionalRef2.current);

    renderHook(() => useOnClickOutside(ref, handler, [additionalRef1, additionalRef2]));

    // Click on second additional ref
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    additionalRef2.current.dispatchEvent(mouseEvent);

    // Should not call handler
    expect(handler).not.toHaveBeenCalled();
  });

  test('handles empty additional refs array', () => {
    renderHook(() => useOnClickOutside(ref, handler, []));

    // Click outside
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('removes event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  test('updates event listener when handler changes', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const { rerender } = renderHook(
      ({ handler }) => useOnClickOutside(ref, handler),
      { initialProps: { handler: handler1 } }
    );

    // Click outside with first handler
    const mouseEvent1 = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent1);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    // Update handler
    rerender({ handler: handler2 });

    // Click outside with second handler
    const mouseEvent2 = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent2);
    expect(handler1).toHaveBeenCalledTimes(1); // Still 1
    expect(handler2).toHaveBeenCalledTimes(1); // Now called
  });

  test('handles clicks on child elements inside the ref', () => {
    const childElement = document.createElement('span');
    ref.current.appendChild(childElement);

    renderHook(() => useOnClickOutside(ref, handler));

    // Click on child element
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    childElement.dispatchEvent(mouseEvent);

    // Should not call handler (child is inside ref)
    expect(handler).not.toHaveBeenCalled();
  });

  test('handles deeply nested child elements', () => {
    const level1 = document.createElement('div');
    const level2 = document.createElement('div');
    const level3 = document.createElement('span');

    ref.current.appendChild(level1);
    level1.appendChild(level2);
    level2.appendChild(level3);

    renderHook(() => useOnClickOutside(ref, handler));

    // Click on deeply nested child
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    level3.dispatchEvent(mouseEvent);

    // Should not call handler
    expect(handler).not.toHaveBeenCalled();
  });

  test('handles null in additional refs array', () => {
    const additionalRef = { current: null };

    renderHook(() => useOnClickOutside(ref, handler, [additionalRef]));

    // Click on container
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(mouseEvent);

    // Should call handler (null refs don't count as inside)
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('does not call handler when clicking on the ref element itself', () => {
    renderHook(() => useOnClickOutside(ref, handler));

    // Click directly on ref.current
    const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(mouseEvent, 'target', {
      value: ref.current,
      enumerable: true,
    });
    ref.current.dispatchEvent(mouseEvent);

    expect(handler).not.toHaveBeenCalled();
  });
});
