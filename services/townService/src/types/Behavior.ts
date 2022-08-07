import { nanoid } from 'nanoid';
import Script, { RequestScript } from './Script';
import Path, { RequestPath } from './Path';


export default class Behavior {

  private readonly _id: string;

  private _name: string;

  private _script: Script;

  private _path: Path;


  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get script(): Script {
    return this._script;
  }

  set script(value: Script) {
    if (value === undefined) {
      throw new Error('Script cannot be undefined.');
    }
    this._script = value;
  }

  get path(): Path {
    return this._path;
  }

  set path(value: Path) {
    if (value === undefined) {
      throw new Error('Path cannot be undefined.');
    }
    this._path = value;
  }

  constructor(name: string, script: Script, path: Path) {
    this._id = nanoid();
    this._name = name;
    this._script = script;
    this._path = path;
  }

  static fromRequest(behavior: RequestBehavior) : Behavior {
    const name = behavior.name || behavior._name;
    const script = Script.fromRequest(behavior.script || behavior._script);
    const path = Path.fromRequest(behavior.path || behavior._path);

    return new Behavior(name, script, path);
  }
}

export type RequestBehavior = {
  _name: string;
  name: string;
  _script: RequestScript;
  script: RequestScript;
  _path: RequestPath;
  path: RequestPath;
};
