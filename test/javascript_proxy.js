/* global describe, it */

const assert = require('assert');
const {
  arrayP,
  booleanP,
  labelP,
  numberP,
  numLiteralP,
  stringP,
  strLiteralP,
  objectP,
  orP,
  validate
} = require('../dist/index');

describe('Type Proxies', () => {
  it('should parse simple expressions', () => {
    assert.deepStrictEqual(stringP('hello'), { success: true, value: 'hello' });

    assert.deepStrictEqual(
      objectP({ a: stringP, b: strLiteralP('test') })({
        a: 'hello',
        b: 'test',
      }),
      { success: true, value: { a: 'hello', b: 'test' } }
    );

    assert.deepStrictEqual(
      orP(strLiteralP('one'), strLiteralP('two'), strLiteralP('three'))(
        'two'
      ),
      { success: true, value: 'two' }
    );
  });

  it('should fail when the proxies do not match', () => {
    assert.equal(stringP(5).success, false);
  });

  it('should give a path to the error', () => {
    const nested = objectP({
      a: objectP({
        b: objectP({
          c: objectP({
            d: orP(
              strLiteralP('one'),
              strLiteralP('two'),
              strLiteralP('three'),
            )
          })
        })
      })
    });
    assert.equal(nested({ a: { b: { c: { d: 'two' } } } }).success, true);
    assert.equal(nested({ a: { b: { c: { d: 'four' } } } }).success, false);
    assert(nested({ a: { b: { c: { d: 'four' } } } }).error.display().includes('a.b.c.d'));
  });

  it('should parse an array', () => {
    const parserP = arrayP(numberP);
    assert.equal(parserP(5).success, false);
    assert.deepStrictEqual(parserP([1, 2, 3, 4]).value, [1, 2, 3, 4]);

    const x = [];
    x[4] = 43;
    assert.deepStrictEqual(parserP(x).value, x);
    assert.deepStrictEqual(parserP([1, 2, 3, 4, 'hello']).success, false);
  });

  it('should parse objects', () => {
    const nestedP = objectP({
      e: strLiteralP('hello'),
      f: numLiteralP(2)
    });

    const myStructP = objectP({
      a: stringP,
      b: numberP,
      c: arrayP(booleanP),
      d: nestedP,
    });

    const data = JSON.parse(`
      {
        "a": "type proxies",
        "b": 42,
        "c": [true, false],
        "d": { "e": "hello", "f": 2 }
      }
    `);

    assert(myStructP(data).success);

    assert.equal(
      myStructP({
        a: 'type proxies',
        b: 42,
        c: [true, false],
        d: { e: 'goodbye', f: 2 }
      }).success,
      false
    );
  });

  it('validate should throw an error when a parse fails', () => {
    const string = validate('hello', stringP);
    assert(string === 'hello');

    assert.throws(
      () => validate(3, stringP),
      (error) => error.message === 'data is invalid. We expected a string but found 3 instead.'
    );
  });

  it('label changes the error message', () => {
    const noLabel = numLiteralP(1809);
    assert.equal(noLabel(2022).success, false);
    assert(noLabel(2022).error.display().includes('data is invalid. We expected Araham Lincoln\'s birthday but found 2022 instead.') === false);

    const validator = labelP('Araham Lincoln\'s birthday', numLiteralP(1809));
    assert.equal(validator(2022).success, false);
    assert(validator(2022).error.display().includes('data is invalid. We expected Araham Lincoln\'s birthday but found 2022 instead.'));

    const unionP = orP(
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
  });

  it('supports generic types', () => {

  });
});
