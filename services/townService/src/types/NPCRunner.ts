import NPC from './NPC';
import { UserLocation } from '../CoveyTypes';

type UpdateNPC = () => void;

export default class NPCRunner {
  private readonly _npc: NPC;

  private readonly _moveCallbackFn: UpdateNPC;

  private _setIntervalFunction: NodeJS.Timeout;

  private _pathNumber: number;

  private _actualNumber: number;

  private readonly _ratio: number;

  constructor(npc: NPC, speed: number, onUpdate: (npc: NPC)=>void) {
    this._ratio = 1;
    this._npc = npc;
    this._pathNumber = 0;
    this._actualNumber = 0;

    this._moveCallbackFn = () => {
      this._actualNumber += 1;
      this._pathNumber = Math.floor(this._actualNumber / this._ratio);

      const userLocations = this._npc.behavior.path.movement;
      if (this._pathNumber >= userLocations.length) {
        this._actualNumber = 0;
        this._pathNumber = 0;
      }

      let next: UserLocation;
      let current: UserLocation;
      // Check if the path is going out of bounds and loop back to beginning
      if (this._pathNumber === userLocations.length - 1) {
        current = userLocations[userLocations.length - 1];
        [next] = userLocations;
      } else {
        current = userLocations[this._pathNumber];
        next = userLocations[this._pathNumber + 1];
      }

      this._npc.startLocation = current;
      this._npc.currentLocation = next;

      if (this._actualNumber % this._ratio === 0) {
        onUpdate(this._npc);
      }
    };
    this._setIntervalFunction = setInterval(this._moveCallbackFn, speed);
  }
}
