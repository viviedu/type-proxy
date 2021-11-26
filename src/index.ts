import { ParseError } from './error';

export * from './combinator';
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
