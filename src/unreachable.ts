// this functions signifies code that is never executed. Typescript should
// not allow this function to be in any real execution path at compile time.
// see test file for example usage.
export const unreachable = function (x: never): never {
  throw new Error(`Unreachable code executed: ${x}`);
};
