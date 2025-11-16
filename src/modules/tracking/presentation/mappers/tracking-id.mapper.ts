// Domain layer
import { TrackingId } from '../../domain';

/**
 * Mapper for converting string to TrackingId Value Object
 * Encapsulates tracking ID validation at domain level
 */
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
