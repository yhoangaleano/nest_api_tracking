import { UNIT_STATE_ENUMERATION } from '../configs';

export class UnitStateQuery {
  private constructor(private readonly _state: UNIT_STATE_ENUMERATION) {}

  static create(state: UNIT_STATE_ENUMERATION): UnitStateQuery {
    if (!Object.values(UNIT_STATE_ENUMERATION).includes(state)) {
      throw new Error(`Invalid unit state: ${state}`);
    }

    return new UnitStateQuery(state);
  }

  get state(): UNIT_STATE_ENUMERATION {
    return this._state;
  }

  equals(other: UnitStateQuery): boolean {
    return this._state === other._state;
  }
}
