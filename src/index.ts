import { ParseError } from './error';

type ParseResult<T> = {
  success: true,
  value: T
} | {
  success: false,
  error: ParseError
};

type TypeProxy<T> = (data: unknown) => ParseResult<T>;

type ProxyHelper<T> = {
  [P in keyof T]: TypeProxy<T[P]>;
};

export const labelP = <T>(label: string, type: TypeProxy<T>): TypeProxy<T> => (value) => {
  const result = type(value);
  return result.success === true
    ? result
    : { success: false, error: ParseError.label(label, result.error) };
};

export const objectP = <T>(type: ProxyHelper<T>): TypeProxy<T> => (value) => {
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
  let error = ParseError.empty(value);
  const leftResult = left(value);
  if (leftResult.success) {
    return leftResult;
  }

  const rightResult = right(value);
  if (rightResult.success) {
    return rightResult;
  }

  error = error.combine(leftResult.error);
  error = error.combine(rightResult.error);
  return { success: false, error };
};

export const or3P = <A, B, C>(first: TypeProxy<A>, second: TypeProxy<B>, third: TypeProxy<C>): TypeProxy<A | B | C> => (value) => {
  return or2P(first, or2P(second, third))(value);
};

export const stringP: TypeProxy<string> = (value) => {
  return typeof value === 'string'
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'a string') };
};

export const strLiteralP = <K extends string>(literal: K): TypeProxy<K> => {
  return (value) => value === literal
    ? { success: true, value: value as K }
    : { success: false, error: ParseError.simpleError(value, `"${literal}"`) };
};

export const unknownP: TypeProxy<unknown> = (value) => ({ success: true, value });
