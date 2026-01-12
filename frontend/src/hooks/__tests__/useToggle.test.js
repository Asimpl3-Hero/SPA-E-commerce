import { renderHook, act } from '@testing-library/react';
import { useToggle } from '../useToggle';

describe('useToggle', () => {
  test('initializes with default value false', () => {
    const { result } = renderHook(() => useToggle());

    expect(result.current[0]).toBe(false);
  });

  test('initializes with custom value', () => {
    const { result } = renderHook(() => useToggle(true));

    expect(result.current[0]).toBe(true);
  });

  test('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(false);
  });

  test('sets value to true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[2](); // setTrue
    });

    expect(result.current[0]).toBe(true);
  });

  test('sets value to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[3](); // setFalse
    });

    expect(result.current[0]).toBe(false);
  });

  test('setTrue maintains true value', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[2](); // setTrue
    });

    expect(result.current[0]).toBe(true);
  });

  test('setFalse maintains false value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[3](); // setFalse
    });

    expect(result.current[0]).toBe(false);
  });

  test('multiple operations work correctly', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1](); // toggle to true
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[3](); // setFalse
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[2](); // setTrue
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](); // toggle to false
    });
    expect(result.current[0]).toBe(false);
  });

  test('functions maintain referential equality', () => {
    const { result, rerender } = renderHook(() => useToggle(false));

    const [, toggle1, setTrue1, setFalse1] = result.current;

    act(() => {
      result.current[1]();
    });

    rerender();

    const [, toggle2, setTrue2, setFalse2] = result.current;

    expect(toggle1).toBe(toggle2);
    expect(setTrue1).toBe(setTrue2);
    expect(setFalse1).toBe(setFalse2);
  });
});
