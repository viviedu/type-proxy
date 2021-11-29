# `type-proxy`

Validate unknown data types using a low overhead syntax.

## Quickstart

Don't write an ordinary typescript interface:

```typescript
interface Nested {
  e: 'hello'
  f: 2
}

interface MyStruct {
  a: string;
  b: number;
  c: Array<boolean>;
  d: Nested;
}
```

Use the type proxies instead:

```typescript
import { arrayP, numberP, numLiteralP, objectP, stringP, strLiteralP } from 'type-proxy';

const nestedP = objectP({
  e: strLiteralP('hello'),
  f: numLiteralP(2)
});

const myStructP = objectP({
  a: stringP,
  b: numberP,
  c: arrayP(booleanP),
  d: nestedP
});
```

You get data validation for free. Type proxies can be used in plain JavaScript without any trouble:

```typescript
// Returns the following:
// {
//   success: true,
//   value: <Original Data>
// }
myStructP({
  a: 'type proxies',
  b: 42,
  c: [true, false],
  d: { e: 'hello', f: 2 },
});
```

If something goes wrong, you get helpful messages telling you what happened:

```typescript
// Returns the following:
// {
//   success: false,
//   error: ParseError
// }
const result = myStructP({
  a: 'type proxies',
  b: 42,
  c: [true, false],
  d: { e: 'goodbye', f: 2 },
});

// prints `data.d.e is invalid. We expected "hello" but found "goodbye" instead.`
console.log(result.error.display())
```

TypeScript users can derive their types from the proxies for free:

```typescript
import { GetType } from 'type-proxy';

// both of these types are equivalent to MyStruct above
type MyStructType = GetType<typeof myStructP>;
interface MyStructInterface extends GetType<typeof myStructP> {}
```

## Motivation

When writing some program, frequently, we come accross data that is of an unknown type. This is the kind of data that usually comes from a HTTP request, a file, or some other unstructured stream of data. In order to validate that this data is correct, the traditional method of doing this is to write a validation function which often looks something like this:

```typescript
interface MyStruct {
  a: number,
  b: string
}

const validate = (data: unknown): MyStruct | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  if (typeof (data as { a: unknown}).a !== 'number') {
    return null;
  }

  if (typeof (data as { b: unknown}).b !== 'string') {
    return null;
  }

  return data as MyStruct;
}
```

This ad hoc strategy is tedious and verbose. In TypeScript this often calls for lots of casts, which can often make it relatively unsafe. Instead of writing out the validation function every time, it would be nice to derive the validation function from the interface declaration.

## Description

The `type-proxy` package allows you to derive a validation function for free. At its simplest a validation function takes some unknown data and returns a value of the type you want to validate:

```typescript
type Validator<X> = (data: unknown) => X | null;
```

`type-proxy` uses a slightly more complicated validator function that we call `TypeProxy`:

```typescript
export type TypeProxy<T> = (data: unknown) => ParseResult<T>;

export type ParseResult<T> = {
  success: true,
  value: T
} | {
  success: false,
  error: ParseError
};
```

A `TypeProxy` is therefore a function that takes some unknown data and validates it. On success, it returns the value. On failure, it returns an error.

## Use cases

There are many places that we can encounter data of an unknown type:

```typescript
// JSON.parse
const { body } = await fetch('http://example.com');
const data = JSON.parse(body);

// Event handlers
emitter.on('event', (data) => {
  // ...
});

// Poorly typed external APIs
const data = functionThatReturnsAny();
```

## License

This project has been published under the MIT License.

See the LICENSE file for more information.
