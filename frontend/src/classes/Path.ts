import {isUserLocation, UserLocation} from "./Player";

export default class Path {
  private _id: string;

  private _movement: UserLocation[];


  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get movement(): UserLocation[] {
    return this._movement;
  }

  set movement(value: UserLocation[]) {
    this._movement = value;
  }

  constructor(id: string, movement: UserLocation[]) {
    this._id = id;
    this._movement = [...movement];
  }

  static fromServerPath(path: Path) : Path {
    const id = path._id;
    const movement = path._movement;
    return new Path(id, movement);
  }

  updateFromServerPath(path: Path) {
    this._id = path._id;
    this._movement = path._movement;
  }

  static isPath(obj: unknown): obj is Path {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const temp = Object(obj);
    return (
      typeof temp.movement === 'object' &&
      temp.movement.every((m: UserLocation)=>isUserLocation(m))
    );
  }
}

