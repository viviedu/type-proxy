import { ParseError, TypeProxy } from '.';

type ProxyHelper<T> = {
  [P in keyof T]: TypeProxy<T[P]>;
};

// a guarded version of hasOwnProperty
const hasProperty = <ObjectType, Key extends PropertyKey>(object: ObjectType, key: Key): object is (ObjectType & Record<Key, unknown>) => {
  return Object.prototype.hasOwnProperty.call(object, key);
};

const snakeCaseObjectHelper = <T extends Record<string, unknown>>(type: ProxyHelper<T>, data: unknown): T => {
  const errors: ParseError[] = [];
  const result: Record<string, unknown> = {};
  Object
    .keys(type)
    .map((key) => ({
      // convert from camelCase to snake_case
      snakeCaseKey: key.replace(/(?!^)[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      originalKey: key
    }))
    .forEach(({ originalKey, snakeCaseKey }) => {
      const value = hasProperty(data, snakeCaseKey) ? data[snakeCaseKey] : undefined;
      try {
        const parseResult = type[originalKey](value);
        if (parseResult.success) {
          result[originalKey] = parseResult.value;
        } else {
          throw parseResult.error;
        }
      } catch (source) {
        if (!(source instanceof ParseError)) {
          throw source;
        }
        errors.push(ParseError.simpleError(value, `...in the field '${snakeCaseKey}'`));
      }
    });

  if (errors.length === 0) {
    return result as T;
  }

  let combinedError = ParseError.empty(data);
  errors.forEach((err) => {
    combinedError = combinedError.combine(err);
  });

  throw combinedError;
};

export const snakeCaseObjectP = <T extends Record<string, unknown>>(type: ProxyHelper<T>): TypeProxy<T> => (data: unknown) => {
  try {
    if (typeof data !== 'object' || data === null) {
      // If data is not an object, but all the individual fields have defaults, then
      // this will return that default object
      return { success: true, value: snakeCaseObjectHelper(type, {}) };
    } else {
      return { success: true, value: snakeCaseObjectHelper(type, data) };
    }
  } catch {
    return { success: false, error: ParseError.simpleError(data, `Expected object, found ${typeof data}`) };
  }
};
