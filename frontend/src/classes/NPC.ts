import Phaser from "phaser";
import { isUserLocation, UserLocation } from "./Player";
import Behavior from "./Behavior";

export default class NPC {
  private _id: string;

  private _name: string;

  private _spriteImage: string;

  private _spriteJSON: string;

  public phaserSprite?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  public label?: Phaser.GameObjects.Text;

  public textBoxes?: TextBubble[];

  public textBoxVisible: number;

  private _startLocation: UserLocation;

  private _currentLocation: UserLocation;

  private _behavior: Behavior;

  public timeLastUpdated: number;

  public avgTimePerUpdate: number;

  public textBoxTimeout: number;

  constructor(id: string, name: string, startLocation: UserLocation,
    currentLocation: UserLocation, behavior: Behavior, spriteImage: string, spriteJSON: string) {
    this._id = id;
    this._name = name;
    this._spriteImage = spriteImage;
    this._spriteJSON = spriteJSON;
    this._startLocation = startLocation;
    this._currentLocation = currentLocation;
    this._behavior = behavior;
    this.textBoxVisible = 0;
    this.timeLastUpdated = performance.now();
    this.avgTimePerUpdate = 1000;
    this.textBoxTimeout = 0;
  }

  get id(): string {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
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

  static fromServerNPC(npc: ServerNPC) {
    return new NPC(npc._id, npc._name, npc._startLocation, npc._currentLocation, Behavior.fromServerBehavior(npc._behavior), npc._spriteImage, npc._spriteJSON);
  }

  updateFromServerNPC(npc: ServerNPC) {
    this._id = npc._id;
    this._name = npc._name;
    this._startLocation = npc._startLocation;
    this._currentLocation = npc._currentLocation;
    this.behavior.updateFromServerBehavior(npc._behavior);
    this._spriteImage = npc._spriteImage;
    this._spriteJSON = npc._spriteJSON;
  }

  updateLocationFromServerNPC(npc: ServerNPC) {
    this._startLocation = npc._startLocation;
    this._currentLocation = npc._currentLocation;
  }

  static isNPC(obj: unknown): obj is NPC {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const temp = Object(obj);
    return (
      temp.name &&
      typeof temp.name === 'string' &&
      typeof temp.spriteImage === 'string' &&
      typeof temp.spriteJSON === 'string' &&
      typeof temp.startLocation === 'object' &&
      isUserLocation(temp.startLocation) &&
      typeof temp.currentLocation === 'object' &&
      isUserLocation(temp.currentLocation) &&
      typeof temp.behavior === 'object' &&
      Behavior.isBehavior(temp.behavior)
    );
  }


  updateTextboxes(userBody: Phaser.Physics.Arcade.Body) {
    const { startLocation: { x, y } } = this;
    const diff = Math.sqrt((userBody.x - x) ** 2 + (userBody.y - y) ** 2)
    if (this.textBoxes && diff < 100) {
      this.updateVisibleTextboxes();

      if (this.behavior.script.randomizeOrder) {
        this.textBoxVisible = Math.floor(Math.random() * this.textBoxes.length);
      } else {
        this.textBoxVisible = this.textBoxVisible < this.textBoxes.length - 1 ? this.textBoxVisible + 1 : 0;
      }
    }
  }

  private updateVisibleTextboxes() {
    this.textBoxes?.forEach((tb, index) => {
      if (index === this.textBoxVisible) {
        tb.text.setVisible(true);
        tb.bubble.setVisible(true);
      } else {
        tb.text.setVisible(false);
        tb.bubble.setVisible(false);
      }
    })
  }

  updateGraphics() {
    const {
      phaserSprite,
      currentLocation,
      timeLastUpdated,
      avgTimePerUpdate,
      label,
      textBoxes
    } = this;


    if (phaserSprite) {
      const { x, y } = phaserSprite;

      // Estimate how much time is remaining until the next update from the server
      let timeRemaining = (timeLastUpdated + avgTimePerUpdate) - performance.now();
      if (timeRemaining < 100) {
        timeRemaining = 100;
      }
      // Calculate a velocity that will get us to the next point on time
      const xVel = (currentLocation.x - x) / (timeRemaining / 1000);
      const yVel = ((currentLocation.y - y) / (timeRemaining / 1000));
      if (xVel > 400 || yVel > 400) {
        // If we get lost, just teleport back
        phaserSprite.setPosition(x, y);
      } else {
        phaserSprite.setVelocity(xVel, yVel)
      }

      // Move the label with the NPC
      if (label) {
        label.setPosition(x - 20, y - 20);
      }

      // Move all the textboxes with the NPC
      if (textBoxes) {
        textBoxes?.forEach((tb) => {
          NPC.textBubblePosition(tb.text, tb.bubble, x - 15, y - 75)
        })
      }
    }
    // Make textboxes disappear if they are currently visible
    if (this.textBoxTimeout <= 0 && this.textBoxes) {
      this.textBoxVisible = this.textBoxes.length;
      this.updateVisibleTextboxes();
    } else {
      this.textBoxTimeout -= 1;
    }
  }

  static textBubblePosition(text: Phaser.GameObjects.Text, bubble: Phaser.GameObjects.Graphics, x: number, y: number) {
    bubble.setPosition(x, y)
    const b = text.getBounds();
    const width = 100;
    const height = 50;
    text.setPosition(bubble.x + (width / 2) - (b.width / 2), bubble.y + (height / 2) - (b.height / 2));
  };

}

export type ServerNPC = {
  _id: string,
  _name: string,
  _startLocation: UserLocation,
  _currentLocation: UserLocation,
  _behavior: Behavior,
  _spriteImage: string;
  _spriteJSON: string,
}

export type ResponseNPC = {
  id: string,
  name: string,
  startLocation: UserLocation,
  currentLocation: UserLocation
}

type TextBubble = {
  text: Phaser.GameObjects.Text,
  bubble: Phaser.GameObjects.Graphics
}

export function cloneNPC(npc: NPC, id: string): NPC {
  return new NPC(id, npc.name, npc.startLocation, npc.currentLocation, npc.behavior, npc.spriteImage, npc.spriteJSON);
}
