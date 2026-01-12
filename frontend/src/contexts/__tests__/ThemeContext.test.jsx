import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

describe('ThemeContext', () => {
  let localStorageMock;
  let matchMediaMock;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock matchMedia
    matchMediaMock = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });

    // Mock document.documentElement
    document.documentElement.classList.remove = jest.fn();
    document.documentElement.classList.add = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useTheme', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      console.error = originalError;
    });

    it('should return theme context when used within ThemeProvider', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('toggleTheme');
    });
  });

  describe('ThemeProvider', () => {
    describe('initialization', () => {
      it('should initialize with light theme by default', () => {
        localStorageMock.getItem.mockReturnValue(null);
        matchMediaMock.mockReturnValue({
          matches: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        });

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('light');
      });

      it('should initialize with saved theme from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('dark');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      });

      it('should initialize with dark theme when system prefers dark', () => {
        localStorageMock.getItem.mockReturnValue(null);
        matchMediaMock.mockReturnValue({
          matches: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        });

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('dark');
        expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      });

      it('should prefer localStorage over system preference', () => {
        localStorageMock.getItem.mockReturnValue('light');
        matchMediaMock.mockReturnValue({
          matches: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        });

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('light');
      });
    });

    describe('setTheme', () => {
      it('should update theme', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.setTheme('dark');
        });

        expect(result.current.theme).toBe('dark');
      });

      it('should save theme to localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.setTheme('dark');
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });

      it('should update document classes', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.setTheme('dark');
        });

        expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
        expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });

    describe('toggleTheme', () => {
      it('should toggle from light to dark', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('light');

        act(() => {
          result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('dark');
      });

      it('should toggle from dark to light', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('dark');

        act(() => {
          result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('light');
      });

      it('should save toggled theme to localStorage', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.toggleTheme();
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });

      it('should update document classes when toggling', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.toggleTheme();
        });

        expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
        expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      });

      it('should toggle multiple times correctly', () => {
        localStorageMock.getItem.mockReturnValue('light');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('light');

        act(() => {
          result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('dark');

        act(() => {
          result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('light');

        act(() => {
          result.current.toggleTheme();
        });
        expect(result.current.theme).toBe('dark');
      });
    });

    describe('useEffect', () => {
      it('should apply theme class on mount', () => {
        localStorageMock.getItem.mockReturnValue('dark');

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        renderHook(() => useTheme(), { wrapper });

        expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      });

      it('should remove both theme classes before adding new one', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
          result.current.setTheme('dark');
        });

        expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      });
    });
  });
});
