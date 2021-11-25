/* global describe, it */

const assert = require('assert');
const { stringP, strLiteralP, objectP, orP } = require('../dist/index');

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
      orP([strLiteralP('one'), strLiteralP('two'), strLiteralP('three')])(
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
            d: orP([
              strLiteralP('one'),
              strLiteralP('two'),
              strLiteralP('three'),
            ])
          })
        })
      })
    });
    assert.equal(nested({ a: { b: { c: { d: 'two' } } } }).success, true);
    assert.equal(nested({ a: { b: { c: { d: 'four' } } } }).success, false);
    assert(nested({ a: { b: { c: { d: 'four' } } } }).error.display().includes('a.b.c.d'));
  });
});
