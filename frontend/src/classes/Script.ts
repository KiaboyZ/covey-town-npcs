export default class Script {
  private _id: string;

  private _scriptLines: string[];

  private _randomizeOrder: boolean;


  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get scriptLines(): string[] {
    return this._scriptLines;
  }

  set scriptLines(value: string[]) {
    this._scriptLines = value;
  }

  get randomizeOrder(): boolean {
    return this._randomizeOrder;
  }

  set randomizeOrder(value: boolean) {
    this._randomizeOrder = value;
  }

  constructor(id: string, scriptLines: string[], randomizeOrder: boolean) {
    this._id = id;
    this._scriptLines = [... scriptLines];
    this._randomizeOrder = randomizeOrder;
  }

  static fromServerScript(sp: Script) : Script {
    return new Script(sp._id, sp._scriptLines, sp._randomizeOrder);
  }

  updateFromServerScript(script: Script) {
    this._id = script.id;
    this._scriptLines = script._scriptLines;
    this._randomizeOrder = script._randomizeOrder;
  }

  static isScript(obj: unknown): obj is Script {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const temp = Object(obj);
    return (
      typeof temp.scriptLines === 'object' &&
      temp.scriptLines.every((l: unknown)=>typeof l === 'string') &&
      typeof temp.randomizeOrder === 'boolean'
    );
  }
}




