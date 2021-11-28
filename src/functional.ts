import { TypeProxy } from '.';

export const pureP = <T>(arg: T): TypeProxy<T> => () => ({ success: true, value: arg });
