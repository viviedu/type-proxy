import { ParseError } from './error';

export * from './combinator';
export * from './error';
export * from './functional';
export * from './json';
export * from './primitive';
export * from './transform';
export * from './unreachable';

export type ParseResult<T> = {
  success: true,
  value: T
} | {
  success: false,
  error: ParseError
};

export type TypeProxy<T> = (data: unknown) => ParseResult<T>;

export type GetType<T extends TypeProxy<unknown>> = T extends TypeProxy<infer R> ? R : never;
