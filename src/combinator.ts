import { pureP, TypeProxy } from '.';
import { ParseError } from './error';
import { undefinedP } from './primitive';

type ObjectProxyHelper<T> = {
  [P in keyof T]: TypeProxy<T[P]>;
};

export const and2P = <A, B>(left: TypeProxy<A>, right: TypeProxy<B>): TypeProxy<A & B> => (value) => {
  const leftResult = left(value);
  if (!leftResult.success) {
    return leftResult;
  }

  const rightResult = right(value);
  if (!rightResult.success) {
    return rightResult;
  }

  return {
    success: true,
    value: value as A & B
  };
};

export const and3P = <A, B, C>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>
): TypeProxy<A & B & C> => {
  return and2P(first, and2P(second, third));
};

export const and4P = <A, B, C, D>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>,
  fourth: TypeProxy<D>
): TypeProxy<A & B & C & D> => {
  return and2P(and2P(first, second), and2P(third, fourth));
};

export const and5P = <A, B, C, D, E>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>,
  fourth: TypeProxy<D>,
  fifth: TypeProxy<E>
): TypeProxy<A & B & C & D & E> => {
  return and2P(and2P(first, second), and3P(third, fourth, fifth));
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

export const composeP = <A,B>(first: TypeProxy<A>, second: TypeProxy<B>): TypeProxy<B> => (value) => {
  const result = first(value);
  return result.success ? second(result.value) : result;
};

export const defaultP = <T>(defaultValue: T, type: TypeProxy<T>): TypeProxy<T> => or2P(type, pureP(defaultValue));

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

export const or5P = <A, B, C, D, E>(
  first: TypeProxy<A>,
  second: TypeProxy<B>,
  third: TypeProxy<C>,
  fourth: TypeProxy<D>,
  fifth: TypeProxy<E>
): TypeProxy<A | B | C | D | E> => {
  return or2P(or2P(first, second), or3P(third, fourth, fifth));
};

export const optionalP = <T>(type: TypeProxy<T>) => or2P(undefinedP, type);

export const validate = <T>(value: unknown, type: TypeProxy<T>): T => {
  const result = type(value);
  if (!result.success) {
    throw new Error(result.error.display());
  }

  return result.value;
};
