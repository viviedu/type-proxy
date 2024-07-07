import { ParseError, TypeProxy, labelP, stringP } from '.';

export const jsonP: TypeProxy<unknown> = (value) => {
  const result = labelP('JSON string', stringP)(value);
  if (!result.success) {
    return result;
  }

  try {
    return {
      success: true,
      value: JSON.parse(result.value)
    };
  } catch (error) {
    return {
      error: ParseError.simpleError(value, 'valid JSON'),
      success: false
    };
  }
};
