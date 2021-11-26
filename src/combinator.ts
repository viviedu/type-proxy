import { ParseError } from './error';

export * from './error';
export * from './primitive';

export type ParseResult<T> = {
  success: true,
  value: T
} | {
  success: false,
  error: ParseError
};

export type TypeProxy<T> = (data: unknown) => ParseResult<T>;

type ObjectProxyHelper<T> = {
  [P in keyof T]: TypeProxy<T[P]>;
};

export const arrayP = <T>(type: TypeProxy<T>): TypeProxy<T[]> => (value) => {
  if (!Array.isArray(value)) {
    return { success: false, error: ParseError.simpleError(value, 'an array') };
  }

  const result: T[] = [];
  // A for .. in loop is used here to preserve gaps in sparse arrays
  for (const index in value) {
    const fieldResult = type(value[index]);
    if (!fieldResult.success) {
      const error = fieldResult.error;
      error.prefix(index);
      return { success: false, error };
    }

    result[index] = fieldResult.value;
  }

  return { success: true, value: result };
};

export const labelP = <T>(label: string, type: TypeProxy<T>): TypeProxy<T> => (value) => {
  const result = type(value);
  return result.success === true
    ? result
    : { success: false, error: ParseError.label(label, result.error) };
};

export const objectP = <T>(type: ObjectProxyHelper<T>): TypeProxy<T> => (value) => {
  if (typeof value !== 'object' || value === null) {
    return { success: false, error: ParseError.simpleError(value, 'an object') };
  }

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(type)) {
    const valueToCheck = (value as Record<string, unknown>)[key];
    const fieldResult = (type as Record<string, TypeProxy<unknown>>)[key](valueToCheck);
    if (!fieldResult.success) {
      const fieldError = fieldResult.error;
      fieldError.prefix(key);
      return { success: false, error: fieldError };
    } else {
      result[key] = fieldResult.value;
    }
  }

  return { success: true, value: result as T };
};

// orP tends not to have good type inference unless the options are literals. In
// those cases use or2P, or3P etc.
export const orP = <T>(choices: TypeProxy<T>[]): TypeProxy<T> => (value) => {
  let error = ParseError.empty(value);
  for (let i = 0; i < choices.length; ++i) {
    const result = choices[i](value);
    if (result.success) {
      return result;
    }

    error = error.combine(result.error);
  }

  return { success: false, error };
};

export const or2P = <A, B>(left: TypeProxy<A>, right: TypeProxy<B>): TypeProxy<A | B> => (value) => {
  const leftResult = left(value);
  if (leftResult.success) {
    return leftResult;
  }

  const rightResult = right(value);
  if (rightResult.success) {
    return rightResult;
  }

  let error = ParseError.empty(value);
  error = error.combine(leftResult.error);
  error = error.combine(rightResult.error);
  return { success: false, error };
};

export const or3P = <A, B, C>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>
): TypeProxy<A | B | C> => {
  return or2P(first, or2P(second, third));
};

export const or4P = <A, B, C, D>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>,
  fourth: TypeProxy<D>
): TypeProxy<A | B | C | D> => {
  return or2P(or2P(first, second), or2P(third, fourth));
};
