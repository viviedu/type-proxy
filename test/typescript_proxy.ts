import * as assert from 'assert';
import {
  GetType,
  TypeProxy,
  nullP,
  numberP,
  objectP,
  orP,
  strLiteralP,
  stringP
} from '../dist/index';

describe('Type Proxies', () => {
  it('supports generic types', () => {
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

    const pairP = <F, S>(firstP: TypeProxy<F>, secondP: TypeProxy<S>) => objectP({
      first: firstP,
      second: secondP
    });

    const eitherP = <L, R>(leftP: TypeProxy<L>, rightP: TypeProxy<R>) => orP(
      objectP({
        type: strLiteralP('left'),
        left: leftP
      }),
      objectP({
        type: strLiteralP('right'),
        right: rightP
      })
    );

    const numberStringPairP = pairP(numberP, stringP);
    const numberOrStringP = eitherP(numberP, stringP);

    type NumberStringPair = GetType<typeof numberStringPairP>;
    type NumberOrString = GetType<typeof numberOrStringP>;

    const assertType = <T>(value: T) => {};
    assertType<TypeProxy<Pair<number, string>>>(numberStringPairP);
    assertType<TypeProxy<Either<number, string>>>(numberOrStringP);

    const result = numberStringPairP({ first: 5, second: 'hello' });
    if (!result.success) {
      assert(false, 'proxy should suceed');
    }
    assert.strictEqual(result.value.first, 5);
    assert.strictEqual(result.value.second, 'hello');
  });

  it('supports recursive types', () => {
    type LinkedList = {
      value: number,
      next: LinkedList
    } | null;

    const linkedListP: TypeProxy<LinkedList> = (value: unknown) => orP(
      objectP({
        value: numberP,
        next: linkedListP
      }),
      nullP
    )(value);

    const list = { value: 1, next: { value: 2, next: { value: 3, next: null }}};
    assert(linkedListP(list).success);
  });
});
