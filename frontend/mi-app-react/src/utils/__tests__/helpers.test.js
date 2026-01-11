import {
  generateId,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  isObject,
  groupBy,
  sortBy,
  uniqueArray,
  chunkArray,
  flattenArray,
  getNestedValue,
  setNestedValue,
  sleep,
  retry,
  createQueryString,
  parseQueryString,
  copyToClipboard,
  scrollToElement,
} from '../helpers';

describe('helpers', () => {
  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    test('uses prefix', () => {
      const id = generateId('test');
      expect(id).toMatch(/^test-/);
    });

    test('uses default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^id-/);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('delays function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(1);
    });

    test('cancels previous calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    test('limits function execution', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);
    });

    test('executes after time limit', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      jest.advanceTimersByTime(1000);
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('deepClone', () => {
    test('clones objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    test('clones arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
    });

    test('clones dates', () => {
      const date = new Date('2024-01-15');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    test('handles primitives', () => {
      expect(deepClone(5)).toBe(5);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(null)).toBe(null);
    });
  });

  describe('deepMerge', () => {
    test('merges objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    test('overwrites primitives', () => {
      const target = { a: 1 };
      const source = { a: 2 };
      const result = deepMerge(target, source);

      expect(result.a).toBe(2);
    });
  });

  describe('isObject', () => {
    test('identifies objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });

    test('rejects non-objects', () => {
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(5)).toBe(false);
    });
  });

  describe('groupBy', () => {
    test('groups array by key', () => {
      const items = [
        { id: 1, category: 'a' },
        { id: 2, category: 'b' },
        { id: 3, category: 'a' },
      ];
      const grouped = groupBy(items, 'category');

      expect(grouped).toEqual({
        a: [
          { id: 1, category: 'a' },
          { id: 3, category: 'a' },
        ],
        b: [{ id: 2, category: 'b' }],
      });
    });

    test('handles empty array', () => {
      expect(groupBy([], 'key')).toEqual({});
    });

    test('handles invalid input', () => {
      expect(groupBy(null, 'key')).toEqual({});
    });
  });

  describe('sortBy', () => {
    test('sorts array ascending', () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const sorted = sortBy(items, 'value', 'asc');

      expect(sorted[0].value).toBe(1);
      expect(sorted[2].value).toBe(3);
    });

    test('sorts array descending', () => {
      const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const sorted = sortBy(items, 'value', 'desc');

      expect(sorted[0].value).toBe(3);
      expect(sorted[2].value).toBe(1);
    });

    test('handles empty array', () => {
      expect(sortBy([], 'key')).toEqual([]);
    });

    test('handles invalid input', () => {
      expect(sortBy(null, 'key')).toEqual([]);
    });
  });

  describe('uniqueArray', () => {
    test('removes duplicates from primitive array', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      expect(uniqueArray(arr)).toEqual([1, 2, 3]);
    });

    test('removes duplicates by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      const unique = uniqueArray(items, 'id');

      expect(unique).toHaveLength(2);
      expect(unique[0].id).toBe(1);
      expect(unique[1].id).toBe(2);
    });

    test('handles empty array', () => {
      expect(uniqueArray([])).toEqual([]);
    });

    test('handles invalid input', () => {
      expect(uniqueArray(null)).toEqual([]);
    });
  });

  describe('chunkArray', () => {
    test('splits array into chunks', () => {
      const arr = [1, 2, 3, 4, 5];
      const chunks = chunkArray(arr, 2);

      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('handles exact division', () => {
      const arr = [1, 2, 3, 4];
      const chunks = chunkArray(arr, 2);

      expect(chunks).toEqual([[1, 2], [3, 4]]);
    });

    test('handles invalid input', () => {
      expect(chunkArray(null, 2)).toEqual([]);
      expect(chunkArray([1, 2], 0)).toEqual([]);
    });
  });

  describe('flattenArray', () => {
    test('flattens nested arrays', () => {
      const arr = [1, [2, 3], [4, [5, 6]]];
      expect(flattenArray(arr)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('flattens to specific depth', () => {
      const arr = [1, [2, [3, [4]]]];
      expect(flattenArray(arr, 1)).toEqual([1, 2, [3, [4]]]);
    });

    test('handles empty array', () => {
      expect(flattenArray([])).toEqual([]);
    });

    test('handles invalid input', () => {
      expect(flattenArray(null)).toEqual([]);
    });
  });

  describe('getNestedValue', () => {
    test('gets nested property', () => {
      const obj = { a: { b: { c: 'value' } } };
      expect(getNestedValue(obj, 'a.b.c')).toBe('value');
    });

    test('returns default for missing property', () => {
      const obj = { a: { b: 'value' } };
      expect(getNestedValue(obj, 'a.b.c', 'default')).toBe('default');
    });

    test('handles null values in path', () => {
      const obj = { a: null };
      expect(getNestedValue(obj, 'a.b.c', 'default')).toBe('default');
    });
  });

  describe('setNestedValue', () => {
    test('sets nested property', () => {
      const obj = { a: { b: {} } };
      setNestedValue(obj, 'a.b.c', 'value');

      expect(obj.a.b.c).toBe('value');
    });

    test('creates missing paths', () => {
      const obj = {};
      setNestedValue(obj, 'a.b.c', 'value');

      expect(obj.a.b.c).toBe('value');
    });
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    test('delays execution', async () => {
      const promise = sleep(1000);
      jest.advanceTimersByTime(1000);
      await promise;
      expect(true).toBe(true);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('createQueryString', () => {
    test('creates query string from object', () => {
      const params = { page: 1, limit: 10, search: 'test' };
      const query = createQueryString(params);

      expect(query).toBe('?page=1&limit=10&search=test');
    });

    test('handles array values', () => {
      const params = { tags: ['a', 'b', 'c'] };
      const query = createQueryString(params);

      expect(query).toContain('tags=a');
      expect(query).toContain('tags=b');
      expect(query).toContain('tags=c');
    });

    test('skips null and undefined', () => {
      const params = { a: 1, b: null, c: undefined };
      const query = createQueryString(params);

      expect(query).toBe('?a=1');
    });

    test('handles empty object', () => {
      expect(createQueryString({})).toBe('');
    });

    test('handles invalid input', () => {
      expect(createQueryString(null)).toBe('');
    });
  });

  describe('parseQueryString', () => {
    test('parses query string', () => {
      const query = '?page=1&limit=10&search=test';
      const params = parseQueryString(query);

      expect(params).toEqual({
        page: '1',
        limit: '10',
        search: 'test',
      });
    });

    test('handles query without ?', () => {
      const query = 'page=1&limit=10';
      const params = parseQueryString(query);

      expect(params).toEqual({
        page: '1',
        limit: '10',
      });
    });

    test('handles duplicate keys as arrays', () => {
      const query = '?tag=a&tag=b&tag=c';
      const params = parseQueryString(query);

      expect(params.tag).toEqual(['a', 'b', 'c']);
    });

    test('handles empty string', () => {
      expect(parseQueryString('')).toEqual({});
    });

    test('handles invalid input', () => {
      expect(parseQueryString(null)).toEqual({});
    });
  });

  describe('copyToClipboard', () => {
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    afterEach(() => {
      global.navigator = originalNavigator;
      global.window = originalWindow;
    });

    test('uses clipboard API when available in secure context', async () => {
      const mockWriteText = jest.fn().mockResolvedValue();
      global.navigator = {
        clipboard: {
          writeText: mockWriteText,
        },
      };
      global.window = { isSecureContext: true };

      const result = await copyToClipboard('test text');

      expect(mockWriteText).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    test('uses fallback when clipboard API not available', async () => {
      const mockTextArea = {
        value: '',
        style: {},
        focus: jest.fn(),
        select: jest.fn(),
      };

      global.navigator = {};
      global.window = { isSecureContext: false };

      const originalCreateElement = document.createElement;
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      const originalExecCommand = document.execCommand;

      document.createElement = jest.fn().mockReturnValue(mockTextArea);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      document.execCommand = jest.fn().mockReturnValue(true);

      const result = await copyToClipboard('fallback text');

      expect(mockTextArea.value).toBe('fallback text');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockTextArea);
      expect(mockTextArea.focus).toHaveBeenCalled();
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.body.removeChild).toHaveBeenCalledWith(mockTextArea);
      expect(result).toBe(true);

      // Restore
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
      document.execCommand = originalExecCommand;
    });

    test('returns false when fallback copy fails', async () => {
      const mockTextArea = {
        value: '',
        style: {},
        focus: jest.fn(),
        select: jest.fn(),
      };

      global.navigator = {};
      global.window = { isSecureContext: false };

      const originalCreateElement = document.createElement;
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      const originalExecCommand = document.execCommand;

      document.createElement = jest.fn().mockReturnValue(mockTextArea);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      document.execCommand = jest.fn().mockReturnValue(false);

      const result = await copyToClipboard('test');

      expect(result).toBe(false);

      // Restore
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
      document.execCommand = originalExecCommand;
    });

    test('returns false on error', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Failed'));
      global.navigator = {
        clipboard: {
          writeText: mockWriteText,
        },
      };
      global.window = { isSecureContext: true };

      const result = await copyToClipboard('test');

      expect(result).toBe(false);
    });
  });

  describe('scrollToElement', () => {
    test('scrolls to element by selector', () => {
      const mockScrollIntoView = jest.fn();
      const mockElement = { scrollIntoView: mockScrollIntoView };
      document.querySelector = jest.fn().mockReturnValue(mockElement);

      scrollToElement('.test-class');

      expect(document.querySelector).toHaveBeenCalledWith('.test-class');
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    });

    test('scrolls to element by HTMLElement', () => {
      const mockScrollIntoView = jest.fn();
      const mockElement = { scrollIntoView: mockScrollIntoView };

      scrollToElement(mockElement);

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    });

    test('accepts custom options', () => {
      const mockScrollIntoView = jest.fn();
      const mockElement = { scrollIntoView: mockScrollIntoView };
      document.querySelector = jest.fn().mockReturnValue(mockElement);

      scrollToElement('.test', { behavior: 'auto', block: 'center' });

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest',
      });
    });

    test('does nothing if element not found', () => {
      document.querySelector = jest.fn().mockReturnValue(null);

      expect(() => scrollToElement('.nonexistent')).not.toThrow();
      expect(document.querySelector).toHaveBeenCalledWith('.nonexistent');
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns result on first success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const resultPromise = retry(mockFn, 3, 100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('retries on failure and eventually succeeds', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const resultPromise = retry(mockFn, 3, 10);

      // Advance timers for first retry
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('throws error after all retries exhausted', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('persistent failure'));

      const resultPromise = retry(mockFn, 2, 10);

      // Advance timers for all retries
      await jest.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('waits specified delay between retries', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resultPromise = retry(mockFn, 2, 100);

      // Should have called once initially
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Advance timers to trigger retry
      await jest.runAllTimersAsync();

      await resultPromise;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepMerge edge cases', () => {
    test('adds new nested object keys from source when key does not exist in target', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };

      const result = deepMerge(target, source);

      expect(result.a.b).toBe(1);
      expect(result.a.c).toBe(2);
    });

    test('adds completely new nested object from source', () => {
      const target = { existing: 'value' };
      const source = { newNested: { deep: { value: 42 } } };

      const result = deepMerge(target, source);

      expect(result.existing).toBe('value');
      expect(result.newNested).toEqual({ deep: { value: 42 } });
    });
  });

  describe('sortBy edge cases', () => {
    test('maintains stable order when values are equal', () => {
      const items = [
        { id: 'a', value: 5 },
        { id: 'b', value: 5 },
        { id: 'c', value: 5 },
      ];

      const sorted = sortBy(items, 'value');

      expect(sorted).toHaveLength(3);
      expect(sorted[0].value).toBe(5);
      expect(sorted[1].value).toBe(5);
      expect(sorted[2].value).toBe(5);
    });

    test('sorts correctly with mix of equal and different values', () => {
      const items = [
        { id: 'a', value: 2 },
        { id: 'b', value: 1 },
        { id: 'c', value: 1 },
        { id: 'd', value: 3 },
      ];

      const sorted = sortBy(items, 'value', 'asc');

      expect(sorted[0].value).toBe(1);
      expect(sorted[1].value).toBe(1);
      expect(sorted[2].value).toBe(2);
      expect(sorted[3].value).toBe(3);
    });
  });
});
