import { InvalidValueObjectError } from '../exceptions';

export class TrackingId {
  private constructor(private readonly _value: string) {}

  static create(value: string): TrackingId {
    if (!value || value.trim().length === 0) {
      throw new InvalidValueObjectError('TrackingId cannot be empty');
    }

    if (!/^TRK-\d+$/.test(value)) {
      throw new InvalidValueObjectError(
        'TrackingId must match pattern TRK-XXX',
      );
    }

    return new TrackingId(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: TrackingId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
