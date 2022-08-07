import { nanoid } from 'nanoid';
import { UserLocation } from '../CoveyTypes';

export default class Path {
  private readonly _id: string;

  private _movement: UserLocation[];

  get movement(): UserLocation[] {
    return this._movement;
  }

  set movement(value: UserLocation[]) {
    if (value.length < 1) {
      throw new Error('At least one location is needed.');
    }
    this._movement = value;
  }

  constructor(movement: UserLocation[]) {
    this._id = nanoid();
    if (movement.length < 1) {
      throw new Error('At least one location is needed.');
    }
    this._movement = movement;
  }

  static fromRequest(movement: RequestPath) : Path {
    return new Path(movement.movement || movement._movement);
  }
}

export type RequestPath = {
  _movement:  UserLocation[];
  movement:  UserLocation[];
};
