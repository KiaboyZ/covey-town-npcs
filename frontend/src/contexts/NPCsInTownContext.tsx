import React from 'react';
import NPC from '../classes/NPC';

const Context = React.createContext<NPC[]>([]);

export default Context;
