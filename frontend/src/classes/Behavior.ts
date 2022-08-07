import Script from "./Script";
import Path from "./Path";

export default class Behavior {
   private _id: string;

   private _name: string;

   private _script: Script;

   private _path: Path;


   get id(): string {
     return this._id;
   }

   set id(value: string) {
     this._id = value;
   }

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
     this._script = value;
   }

   get path(): Path {
     return this._path;
   }

   set path(value: Path) {
     this._path = value;
   }

   constructor(id: string, name: string, script: Script, path: Path) {
     this._id = id;
     this._name = name;
     this._script = script;
     this._path = path;
   }

   static fromServerBehavior(sb: Behavior) : Behavior {
     return new Behavior(sb._id, sb._name, Script.fromServerScript(sb._script), Path.fromServerPath(sb._path));
   }

   updateFromServerBehavior(sb: Behavior) {
     this._id = sb._id;
     this._name = sb._name;
     this._script.updateFromServerScript(sb._script);
     this._path.updateFromServerPath(sb._path);
   }

   static isBehavior(obj: unknown): obj is Behavior {
     if (!obj || typeof obj !== 'object') {
       return false
     }

     const temp = Object(obj);
     return (
       typeof temp.name === 'string' &&
       typeof temp.script === 'object' &&
       Script.isScript(temp.script) &&
       typeof temp.path === 'object' &&
       Path.isPath(temp.path)
     );
   }
 }



