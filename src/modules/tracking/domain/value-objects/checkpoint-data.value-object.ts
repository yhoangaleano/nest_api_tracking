import { InvalidValueObjectError } from '../exceptions';
import { UNIT_STATE_ENUMERATION } from '../configs';

export class CheckpointData {
  private constructor(
    private readonly _trackingId: string,
    private readonly _status: UNIT_STATE_ENUMERATION,
    private readonly _location: string,
    private readonly _timestamp: Date,
    private readonly _notes?: string,
  ) {}

  static create(
    trackingId: string,
    status: UNIT_STATE_ENUMERATION,
    location: string,
    timestamp: string | Date,
    notes?: string,
  ): CheckpointData {
    if (!trackingId || trackingId.trim().length === 0) {
      throw new InvalidValueObjectError('TrackingId cannot be empty');
    }

    if (!location || location.trim().length === 0) {
      throw new InvalidValueObjectError('Location cannot be empty');
    }

    if (location.length > 200) {
      throw new InvalidValueObjectError(
        'Location cannot exceed 200 characters',
      );
    }

    const dateTimestamp =
      timestamp instanceof Date ? timestamp : new Date(timestamp);

    if (Number.isNaN(dateTimestamp.getTime())) {
      throw new InvalidValueObjectError('Invalid timestamp format');
    }

    if (dateTimestamp > new Date()) {
      throw new InvalidValueObjectError(
        'Checkpoint timestamp cannot be in the future',
      );
    }

    if (notes && notes.length > 500) {
      throw new InvalidValueObjectError('Notes cannot exceed 500 characters');
    }

    return new CheckpointData(
      trackingId.trim(),
      status,
      location.trim(),
      dateTimestamp,
      notes?.trim(),
    );
  }

  get trackingId(): string {
    return this._trackingId;
  }

  get status(): UNIT_STATE_ENUMERATION {
    return this._status;
  }

  get location(): string {
    return this._location;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  equals(other: CheckpointData): boolean {
    if (!other) return false;

    return (
      this._trackingId === other._trackingId &&
      this._status === other._status &&
      this._location === other._location &&
      this._timestamp.getTime() === other._timestamp.getTime() &&
      this._notes === other._notes
    );
  }

  toPlainObject(): {
    trackingId: string;
    status: UNIT_STATE_ENUMERATION;
    location: string;
    timestamp: Date;
    notes?: string;
  } {
    return {
      trackingId: this._trackingId,
      status: this._status,
      location: this._location,
      timestamp: this._timestamp,
      notes: this._notes,
    };
  }
}
