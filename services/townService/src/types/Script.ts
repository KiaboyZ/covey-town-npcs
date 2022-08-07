import { nanoid } from 'nanoid';

export default class Script {
  private readonly _id: string;

  private _scriptLines: string[];

  private _randomizeOrder: boolean;

  get scriptLines(): string[] {
    return this._scriptLines;
  }

  set scriptLines(value: string[]) {
    if (value.length < 1) {
      throw new Error('At least one line is needed.');
    }
    this._scriptLines = value;
  }

  get randomizeOrder(): boolean {
    return this._randomizeOrder;
  }

  set randomizeOrder(value: boolean) {
    this._randomizeOrder = value;
  }

  constructor(scriptLines: string[], randomizeOrder: boolean) {
    if (scriptLines.length < 1) {
      throw new Error('At least one line is needed.');
    }

    this._id = nanoid();
    this._scriptLines = scriptLines;
    this._randomizeOrder = randomizeOrder;
  }

  static fromRequest(script: RequestScript) : Script {
    const scriptLines = script._scriptLines || script.scriptLines;
    const randomizeOrder = script._randomizeOrder || script.randomizeOrder;

    return new Script(scriptLines, randomizeOrder);
  }
}

export type RequestScript = {
  _scriptLines: string[];
  scriptLines: string[];

  _randomizeOrder: boolean;
  randomizeOrder: boolean;
};
