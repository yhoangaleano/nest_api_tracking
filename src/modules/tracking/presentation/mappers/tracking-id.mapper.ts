import { TrackingId } from '../../domain';

export class TrackingIdMapper {
  /**
   * Converts a string to TrackingId Value Object
   * @param trackingId - String representation of tracking ID
   * @returns TrackingId Value Object with domain validations
   * @throws InvalidValueObjectError if tracking ID format is invalid
   */
  static toValueObject(trackingId: string): TrackingId {
    return TrackingId.create(trackingId);
  }
}
