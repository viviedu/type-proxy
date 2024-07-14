[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

# Type Proxy

Validate unknown data types using a low overhead syntax.

## Quickstart

Don't write an ordinary TypeScript interface:

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

## Description

The `type-proxy` package allows you to derive a validation function for free. At its simplest, a validation function takes some unknown data and returns a value of the type you want to validate:

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

### Motivation

While writing web applications, we frequently come across data that is of an unknown type. This is the kind of data that usually comes from a HTTP request, a file, or some other unstructured stream of data. In order to validate that this data is correct, the traditional method is to write a validation function which often looks something like this:

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

This ad hoc strategy is tedious, verbose and error-prone. In TypeScript this often calls for lots of casts, which can often make it relatively unsafe. Instead of writing out the validation function every time, it would be nice to derive the validation function from the interface declaration.

### Use cases

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

### Alternatives

Before you use this library, there are several alternatives that should consider using instead.

These include (with their respective headlines):

* [Zod](https://zod.dev/) - TypeScript-first schema validation with static type inference.
* [Valibot](https://valibot.dev/) - Validate unknown data with Valibot, the open source schema library with bundle size, type safety and developer experience in mind.
* [Yup](https://github.com/jquense/yup) - Yup is a schema builder for runtime value parsing and validation.

All three are published under the [MIT License](https://opensource.org/license/mit), and are mature and well tested. Between them they have over 50 thousand stars on GitHub.

**Reasons you should NOT use this library:**

* **Not Invented Here (NIH)**: This library was initially developed as a minimal validation interface for use in projects at [Vivi](https://vivi.io). Despite being aware of publicly available alternatives, we decided to release this code as is.

* **Test Coverage**: Test coverage is still somewhat lacking, however we hope to improve this... 🙏

* **Completeness**: The alternatives listed above are arguably more complete from a type system perspective. They provide well established solutions for parsing and validating complex types.

**Why you might want to use this library:**

* **Compactness**: One of the advantages over alternatives is that `type-proxy` is extremely small, and light-weight. The entire API _and_ implementation can easily be explained in a short how-to session / tutorial.

* **Extensibility**: The `type-proxy` API has been designed to be easy to extend and compose.

## Advanced usage

### Generic types

Generic types are supported, but you may need to specify a TypeScript interface for ergonomic reasons. Consider the following types:

```typescript
type Pair<F, S> = {
  first: F,
  second: S
};

type Either<L, R> = {
  type: 'left',
  left: L
} | {
  type: 'right',
  right: R
};
```

We can write a type proxy for generic types using functions that take type proxies as parameters:

```typescript
const pairP = <F, S>(firstP: TypeProxy<F>, secondP: TypeProxy<S>) => objectP({
  first: firstP,
  second: secondP
});

const eitherP = <L, R>(leftP: TypeProxy<L>, rightP: TypeProxy<R>) => or2P(
  objectP({
    type: strLiteralP('left'),
    left: leftP
  }),
  objectP({
    type: strLiteralP('right'),
    right: rightP
  })
);
```

The types of the type proxy can be derived as per normal:

```typescript
const numberStringPairP = pairP(numberP, stringP);
const numberOrStringP = eitherP(numberP, stringP);

type NumberStringPair = GetType<typeof numberStringPairP>;
type NumberOrString = GetType<typeof numberOrStringP>;
```

It can be shown that these new types are the same as the types we had before:

```typescript
const assertType = <T>(value: T) => {};
assertType<TypeProxy<Pair<number, string>>>(numberStringPairP);
assertType<TypeProxy<Either<number, string>>>(numberOrStringP);
```

The only limitation is that we cannot derive generic types from type proxies. For example: we can use `GetType` on `pairP(numberP, stringP)` to get `Pair<number, string>`, but we can not use `GetType` on `pairP` to get `Pair<F, S>`.

### Recursive types

When using recursive types using TypeScript, you must specify a TypeScript interface:

```typescript
type LinkedList = {
  value: number,
  next: LinkedList
} | null;
```

You cannot write your type proxy like you would normally, since it will use a variable that has not yet been defined:

```typescript
const linkedListP = or2P(
  objectP({
    value: numberP,
    next: linkedListP // Error: Block-scoped variable 'linkedListP' used before its declaration.
  }),
  nullP
);
```

You can however, write out recursive types as a function. Note that for recursive types, the type declaration is required otherwise TypeScript will not be able to resolve the type:

```typescript
const linkedListP: TypeProxy<LinkedList> = (value: unknown) => or2P(
  objectP({
    value: numberP,
    next: linkedListP
  }),
  nullP
)(value);

const list = { value: 1, next: { value: 2, next: { value: 3, next: null }}};
assert(linkedListP(list).success);
```

## API

This section is incomplete. Please raise an issue on GitHub if you would like something to be added.

### `labelP`

Changes the error message to include a human readable label.

```typescript
const noLabel = numLiteralP(1809);
assert.equal(noLabel(2022).success, false);

// The following prints:
//
//  data is invalid. We expected 1809 but found 2022 instead.
console.log(noLabel(2022).error.display());

const withLabel = labelP('Araham Lincoln\'s birthday', numLiteralP(1809));
assert.equal(withLabel(2022).success, false);

// The following prints:
//
//  data is invalid. We expected Araham Lincoln's birthday but found 2022 instead.
//  it is not Araham Lincoln's birthday because:
//    data is invalid. We expected 1809 but found 2022 instead.
console.log(WithLabel(2022).error.display());
```

This is useful for when you want more descriptive error messages when describing a union. In the following example, the error message is not very useful:

```javascript
const unionP = or3P(
  objectP({
    type: strLiteralP('number'),
    number: numberP
  }),
  objectP({
    type: strLiteralP('string'),
    string: stringP
  }),
  objectP({
    type: strLiteralP('boolean'),
    boolean: booleanP
  })
);

const result = unionP({ type: 'number', string: 'hello' });
assert.equal(result.success, false);
// prints "data is invalid. We found {"type":"number","string":"hello"}."
console.error(result.error.display());
```

however, if we add labels to each variant, we get much better error messages:


```javascript
const unionP = or3P(
  labelP('a number type', objectP({
    type: strLiteralP('number'),
    number: numberP
  })),
  labelP('a string type', objectP({
    type: strLiteralP('string'),
    string: stringP
  })),
  labelP(' a boolean type', objectP({
    type: strLiteralP('boolean'),
    boolean: booleanP
  }))
);

const result = unionP({ type: 'number', string: 'hello' });
assert.equal(result.success, false);
// prints the following:
//
// data is invalid. We expected a number type, a string type or  a boolean type but found {"type":"number","string":"hello"} instead.
// it is not a number type because:
//   data.number is invalid. We expected a number but found undefined instead.
// it is not a string type because:
//   data.type is invalid. We expected "string" but found "number" instead.
// it is not  a boolean type because:
//   data.type is invalid. We expected "boolean" but found "number" instead.
console.error(result.error.display());
```

### `validate`

Parses a value and returns the result. If the value cannot be parsed, an error is thrown with a description as the error message.

```typescript
const string = validate('hello', stringP);
assert(string === 'hello');

try {
  const string = validate(3, stringP);
  assert(false);
} catch (error) {
  assert.equal(error.message, 'data is invalid. We expected a string but found 3 instead.');
}
```

## License

This project has been published under the MIT License.

See the LICENSE file for more information.
