import { TypeProxy } from "."

export const pureP = <T>(arg: T): TypeProxy<T> => (value) => ({ success: true, value: arg});
