import { ParseError } from './error';
import { nullP, undefinedP } from './primitive';
import { ParseResult, TypeProxy, pureP } from '.';

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
      const { error } = fieldResult;
      error.prefix(index);
      return { success: false, error };
    }

    result[index] = fieldResult.value;
  }

  return { success: true, value: result };
};

export const composeP = <A, B>(first: TypeProxy<A>, second: TypeProxy<B>): TypeProxy<B> => (value) => {
  const result = first(value);
  return result.success ? second(result.value) : result;
};

export const defaultP = <T>(defaultValue: T, type: TypeProxy<T>): TypeProxy<T> => orP(type, pureP(defaultValue));

export const labelP = <T>(label: string, type: TypeProxy<T>): TypeProxy<T> => (value) => {
  const result = type(value);
  return result.success === true
    ? result
    : { success: false, error: ParseError.label(label, result.error) };
};

export const nullableP = <T>(type: TypeProxy<T>): TypeProxy<T | null> => {
  return orP(type, nullP);
};

// src: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

type IsUnknown<T, True=true, False=false> = T extends unknown
  ? unknown extends T
    ? True : False
  : False;

type OptionalKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? IsUnknown<T[K], never, K> : never
}[keyof T];

type UndefinedToOptional<T extends object> = Prettify<{
  [K in Exclude<keyof T, OptionalKeys<T>>]: T[K];
} & {
  [K in OptionalKeys<T>]?: T[K];
}>;

export const objectP = <T extends object>(type: ObjectProxyHelper<T>): TypeProxy<UndefinedToOptional<T>> => (value) => {
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

export const recordP = <V>(valueType: TypeProxy<V>): TypeProxy<Record<string, V>> => (value) => {
  if (typeof value !== 'object' || value === null) {
    return { success: false, error: ParseError.simpleError(value, 'an object') };
  }

  const result: Record<string, V> = {};

  for (const key of Object.keys(value)) {
    const valueToCheck = (value as Record<string, unknown>)[key];
    const fieldResult = valueType(valueToCheck);
    if (!fieldResult.success) {
      const fieldError = fieldResult.error;
      fieldError.prefix(key);
      return { success: false, error: fieldError };
    } else {
      result[key] = fieldResult.value;
    }
  }

  return { success: true, value: result };
};

type TypeOfProxy<T> = T extends TypeProxy<infer U> ? U : never;
type UnionOfTypes<T extends TypeProxy<unknown>[]> = TypeOfProxy<T[number]>;

export const orP = <T extends TypeProxy<unknown>[]>(...choices: T): TypeProxy<UnionOfTypes<T>> => (value) => {
  let error = ParseError.empty(value);
  for (let i = 0; i < choices.length; ++i) {
    const result = choices[i](value);
    if (result.success) {
      return result as ParseResult<UnionOfTypes<T>>;
    }

    error = error.combine(result.error);
  }

  return { success: false, error };
};

export const optionalP = <T>(type: TypeProxy<T>) => orP(undefinedP, type);

export const validate = <T>(value: unknown, type: TypeProxy<T>): T => {
  const result = type(value);
  if (!result.success) {
    throw new Error(result.error.display());
  }

  return result.value;
};
