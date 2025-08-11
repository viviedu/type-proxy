import { ParseError } from './error';
import { TypeProxy } from '.';

export const booleanP: TypeProxy<boolean> = (value) => {
  return typeof value === 'boolean'
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'a boolean') };
};

export const dateP: TypeProxy<Date> = (value) => {
  return Object.prototype.toString.call(value) === '[object Date]' && value instanceof Date && !(isNaN(value.valueOf()))
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'a date') };
};

export const falseP: TypeProxy<false> = (value) => {
  return value === false
    ? { success: true, value: false }
    : { success: false, error: ParseError.simpleError(value, 'false') };
};

export const instanceOfP = <T>(klass: new (...args: any[]) => T): TypeProxy<T> => {
  return (value) => value instanceof klass
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, `an instance of ${klass.name}`) };
};

export const nullP: TypeProxy<null> = (value) => {
  return value === null
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'null') };
};

export const numberP: TypeProxy<number> = (value) => {
  return typeof value === 'number'
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'a number') };
};

export const numLiteralP = <K extends number>(literal: K): TypeProxy<K> => {
  return (value) => value === literal
    ? { success: true, value: value as K }
    : { success: false, error: ParseError.simpleError(value, `${literal}`) };
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

export const trueP: TypeProxy<true> = (value) => {
  return value === true
    ? { success: true, value: true }
    : { success: false, error: ParseError.simpleError(value, 'true') };
};

export const undefinedP: TypeProxy<undefined> = (value) => {
  return typeof value === 'undefined'
    ? { success: true, value }
    : { success: false, error: ParseError.simpleError(value, 'undefined') };
};

export const unknownP: TypeProxy<unknown> = (value) => ({ success: true, value });
