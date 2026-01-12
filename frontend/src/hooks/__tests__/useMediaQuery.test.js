import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useBreakpoints } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock;
  let listeners = [];

  beforeEach(() => {
    listeners = [];

    matchMediaMock = jest.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn((event, handler) => {
        listeners.push({ event, handler, query });
      }),
      removeEventListener: jest.fn((event, handler) => {
        listeners = listeners.filter(l => l.handler !== handler);
      }),
      dispatchEvent: jest.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
    jest.clearAllMocks();
  });

  it('should return false initially when media query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('should return true initially when media query matches', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should return false when window is undefined (SSR)', () => {
    const originalWindow = global.window;
    delete global.window;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should update matches when media query changes', () => {
    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const listener = listeners.find(l => l.query === '(min-width: 768px)');
      if (listener) {
        listener.handler({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it('should add event listener on mount', () => {
    const addEventListenerSpy = jest.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: addEventListenerSpy,
      removeEventListener: jest.fn(),
    });

    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = jest.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: jest.fn(),
      removeEventListener: removeEventListenerSpy,
    });

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should update when query prop changes', () => {
    const { rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    );

    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 768px)');

    rerender({ query: '(min-width: 1024px)' });

    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('should not set up listeners when window is undefined in useEffect', () => {
    const originalWindow = global.window;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    delete global.window;

    // Force re-render to trigger useEffect
    act(() => {
      // The hook should handle undefined window gracefully
    });

    global.window = originalWindow;

    expect(result.current).toBeDefined();
  });

  it('should handle multiple different media queries', () => {
    const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    const { result: result2 } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 768px)');
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
  });
});

describe('useBreakpoints', () => {
  let matchMediaMock;

  beforeEach(() => {
    matchMediaMock = jest.fn((query) => {
      // Simulate desktop by default (min-width: 1024px)
      const isDesktop = query.includes('min-width: 1024px)');
      const isLargeScreen = query.includes('min-width: 1024px)');
      const isMobile = query === '(max-width: 767px)';
      const isTablet = query === '(min-width: 768px) and (max-width: 1023px)';
      const isLargeDesktop = query === '(min-width: 1440px)';
      const isSmallScreen = query === '(max-width: 1023px)';
      const isMediumScreen = query === '(min-width: 768px) and (max-width: 1439px)';

      return {
        matches: isDesktop || isLargeScreen,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return breakpoint object', () => {
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isTablet');
    expect(result.current).toHaveProperty('isDesktop');
    expect(result.current).toHaveProperty('isLargeDesktop');
    expect(result.current).toHaveProperty('isSmallScreen');
    expect(result.current).toHaveProperty('isMediumScreen');
    expect(result.current).toHaveProperty('isLargeScreen');
  });

  it('should detect mobile breakpoint', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should detect tablet breakpoint', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(min-width: 768px) and (max-width: 1023px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should detect desktop breakpoint', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isLargeScreen).toBe(true);
  });

  it('should detect large desktop breakpoint', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(min-width: 1440px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isLargeDesktop).toBe(true);
  });

  it('should detect small screen', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(max-width: 1023px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isSmallScreen).toBe(true);
  });

  it('should detect medium screen', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(min-width: 768px) and (max-width: 1439px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isMediumScreen).toBe(true);
  });
});
