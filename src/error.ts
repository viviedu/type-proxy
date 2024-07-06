interface FieldError {
  label: string;
  cause: ParseError | null;
}

export class ParseError {
  private static MAX_RECEIVED_LENGTH = 50;

  private errors: FieldError[];
  private path: string[];
  private received: unknown;

  static label(label: string, cause: ParseError) {
    return new ParseError([], cause.received, [{ label, cause }]);
  }

  static empty(received: unknown) {
    return new ParseError([], received, []);
  }

  static simpleError(received: unknown, expected: string) {
    return new ParseError([], received, [{ label: expected, cause: null }]);
  }

  private constructor(path: string[], received: unknown, errors: FieldError[]) {
    this.errors = errors;
    this.path = path;
    this.received = received;
  }

  combine(other: ParseError): ParseError {
    const pathComparison = this.comparePaths(other);
    if (pathComparison < 0) {
      return this;
    }

    if (pathComparison > 0) {
      return other;
    }

    return new ParseError(this.path, this.received, this.errors.concat(other.errors));
  }

  display(indentation = 0) {
    const indentString = '  '.repeat(indentation);
    const prettyPath = ['data', ...this.path].join('.');
    const lines = [`${indentString}${prettyPath} is invalid. ${this.prettyExpectedString()}`];

    this.errors.forEach((error) => {
      if (error.cause !== null) {
        lines.push(`${indentString}it is not ${error.label} because:`);
        lines.push(error.cause.display(indentation + 1));
      }
    });

    return lines.join('\n');
  }

  prefix(prefix: string) {
    this.path.unshift(prefix);
    this.errors.forEach((error) => {
      if (error.cause !== null) {
        error.cause.prefix(prefix);
      }
    });
  }

  private comparePaths(other: ParseError) {
    const pathLengthComparison = Math.sign(this.path.length - other.path.length);
    if (pathLengthComparison !== 0) {
      return pathLengthComparison;
    }

    for (let i = 0; i < this.path.length; ++i) {
      const pathElementComparison = Math.sign(this.path[i].localeCompare(other.path[i]));
      if (pathElementComparison !== 0) {
        return pathElementComparison;
      }
    }

    return 0;
  }

  private prettyExpectedString() {
    if (this.errors.length === 0) {
      return `We found ${this.prettyReceived()}.`;
    }

    if (this.errors.length === 1) {
      return `We expected ${this.errors[0].label} but found ${this.prettyReceived()} instead.`;
    }

    const errors = [...this.errors];
    const lastLabel = errors.pop()?.label ?? '';
    const labels = errors.map((error) => error.label).join(', ');
    return `We expected ${labels} or ${lastLabel} but found ${this.prettyReceived()} instead.`;
  }

  private prettyReceived() {
    let receivedString: string = typeof this.received;
    try {
      receivedString = JSON.stringify(this.received) ?? 'undefined';
    } catch (error) {
      // eat error, received already has a default
    }

    if (receivedString.length > ParseError.MAX_RECEIVED_LENGTH) {
      return `${receivedString.substring(0, ParseError.MAX_RECEIVED_LENGTH)}...`;
    }

    return receivedString;
  }
}
