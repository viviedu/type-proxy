import { unreachable } from '../dist/index';

describe('Helper unreachable()', () => {
  // Example usage:
  it('handles const boolean matches', () => {
    const testThisFunctionShouldCompile = function () {
      const x = true;
      if (x) {
        // do something
      } else {
        unreachable(x);
      }
    };

    testThisFunctionShouldCompile();
  });

  // Example usage:
  it('handles exhaustive boolean matches', () => {
    const testExhaustiveBool = function (x: boolean) {
      if (x === true) {
        // do something
      } else if (x === false) {
        // do something
      } else {
        unreachable(x);
      }
    };

    testExhaustiveBool(true);
  });

  it('handles other exhaustive matches', () => {
    const testExhaustiveSwitch = function (x: 'one' | 'two') {
      switch (x) {
        case 'one': return;
        case 'two': return;
        default: unreachable(x);
      }
    };

    testExhaustiveSwitch('one');
  });
});
