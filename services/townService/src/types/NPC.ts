import { nanoid } from 'nanoid';
import { UserLocation } from '../CoveyTypes';
import Behavior, { RequestBehavior } from './Behavior';

export default class NPC {
  private readonly _id: string;

  private _name: string;

  private _spriteImage: string;

  private _spriteJSON: string;

  private _startLocation: UserLocation;

  private _currentLocation: UserLocation;

  private _behavior: Behavior;

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get spriteImage(): string {
    return this._spriteImage;
  }

  set spriteImage(value: string) {
    this._spriteImage = value;
  }

  get spriteJSON(): string {
    return this._spriteJSON;
  }

  set spriteJSON(value: string) {
    this._spriteJSON = value;
  }

  get startLocation(): UserLocation {
    return this._startLocation;
  }

  set startLocation(value: UserLocation) {
    this._startLocation = value;
  }

  get currentLocation(): UserLocation {
    return this._currentLocation;
  }

  set currentLocation(value: UserLocation) {
    this._currentLocation = value;
  }

  get behavior(): Behavior {
    return this._behavior;
  }

  set behavior(value: Behavior) {
    this._behavior = value;
  }

  constructor(
    name: string,
    startLocation: UserLocation,
    currentLocation: UserLocation,
    behavior: Behavior,
    spriteImage: string,
    spriteJSON: string,
  ) {
    this._id = nanoid();
    this._name = name;
    this._startLocation = startLocation;
    this._currentLocation = currentLocation;
    this._behavior = behavior;
    this._spriteImage = spriteImage;
    this._spriteJSON = spriteJSON;
  }

  static fromRequest(npc: RequestNPC) : NPC {
    const name = npc.name || npc._name;
    const spriteImage = npc.spriteImage || npc._spriteImage;
    const spriteJSON = npc.spriteJSON || npc._spriteJSON;
    const startLocation = npc.startLocation || npc._startLocation;
    const currentLocation = npc.currentLocation || npc._currentLocation;
    const behavior = Behavior.fromRequest(npc.behavior || npc._behavior);

    return new NPC(name, startLocation, currentLocation, behavior, spriteImage, spriteJSON);
  }
}

export type RequestNPC = {
  _id: string;
  id: string;

  _name: string;
  name: string;

  _spriteImage: string;
  spriteImage: string;

  _spriteJSON: string;
  spriteJSON: string;

  _startLocation: UserLocation;
  startLocation: UserLocation;

  _currentLocation: UserLocation;
  currentLocation: UserLocation;

  _behavior: RequestBehavior;
  behavior: RequestBehavior;
};
