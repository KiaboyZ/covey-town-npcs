import { Box, Heading, ListItem, OrderedList, Tooltip } from '@chakra-ui/react';
import React from 'react';
import useNPCsInTown from "../../hooks/useNPCsInTown";
import NPCEditor from "./NPCEditor";
import useCoveyAppState from "../../hooks/useCoveyAppState";
import { Direction } from "../../classes/Player";
import NPC from '../../classes/NPC';

function JSONFromValues(values: { [p: string]: File | string }) {
  const npcs = useNPCsInTown();
  const id = values.id.toString();
  const npc = npcs.find((_npc) => _npc.id === id);
  const test: Direction = "front";
  const updatedNPC = {
    id: values.id.toString(),
    name: values.name.toString(),
    startLocation: {
      x: Number(values["startLocation.x"]),
      y: Number(values["startLocation.y"]),
      rotation: test,
      moving: false
    },
    currentLocation: {
      x: Number(values["currentLocation.x"]),
      y: Number(values["currentLocation.y"]),
      rotation: test,
      moving: false
    },
    sprite: values.sprite,
    behavior: npc?.behavior,
  }
  return updatedNPC;
};

export function NPCListBase({ npcs, onFormSubmit, onDelete, onDuplicate }: NPCListProps): JSX.Element {
  return (
    <Box><Tooltip label="View all NPCs">
      <Heading as='h2' fontSize='l'>
        NPCs:
      </Heading></Tooltip>
      <OrderedList>
        {npcs.map(npc => (
          <ListItem key={npc.id}>
            <NPCEditor npc={npc} onFormSubmit={onFormSubmit} onDelete={onDelete} onDuplicate={onDuplicate} />
          </ListItem>
        ))}
      </OrderedList>
    </Box>
  );
};

/**
 * Lists the current players in the town, along with the current town's name and ID
 *
 * See relevant hooks: `usePlayersInTown` and `useCoveyAppState`
 *
 */
export default function NPCInTownList(): JSX.Element {
  const npcs = useNPCsInTown();
  const { apiClient, currentTownID, sessionToken } = useCoveyAppState();
  const onFormSubmit = async (values: { [p: string]: File | string }) => {

    const obj = {
      sessionToken,
      coveyTownID: currentTownID,
      npc: JSONFromValues(values),
    };

    await apiClient.updateNPC(obj);
  }
  // TODO(cnorthway): delete npc from town through this list too
  // check on how the client interacts with server, hopefully usable
  return NPCListBase({ npcs, onFormSubmit, onDelete: () => { }, onDuplicate: () => { } });
}

export type NPCListProps = {
  npcs: NPC[]
  onFormSubmit: (values: { [p: string]: File | string }) => void
  onDelete: (npc: NPC) => void
  onDuplicate: (npc: NPC) => void
}