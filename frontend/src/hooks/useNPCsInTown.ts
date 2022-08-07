import assert from 'assert';
import { useContext } from 'react';
import NPC from '../classes/NPC';
import NPCsInTownContext from "../contexts/NPCsInTownContext";


/**
 * This hook provides access to the list of all npc objects in the town.
 *
 */
export default function useNPCsInTown(): NPC[] {
  const ctx = useContext(NPCsInTownContext);
  assert(ctx, 'NPCsInTownContext context should be defined.');
  return ctx;
}
