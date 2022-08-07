import React from 'react';
import { ServerNPC } from '../classes/NPC';

export type NPCMovementCallback = (npcMoved: ServerNPC) => void;

const Context = React.createContext<NPCMovementCallback[]>([]);

export default Context;
