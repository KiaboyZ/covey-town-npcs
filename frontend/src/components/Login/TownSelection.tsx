import React, {useCallback, useRef, useState} from 'react';
import assert from "assert";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input, InputGroup,
  Stack,
  Table,
  TableCaption,
  Tbody,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
// import { AddIcon } from '@chakra-ui/icons' // needs to be added to npm junk if we want to use it
import { nanoid } from 'nanoid';
import useVideoContext from '../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext';
import Video from '../../classes/Video/Video';
import { TownJoinResponse, } from '../../classes/TownsServiceClient';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import FileAttachmentIcon from "../VideoCall/VideoFrontend/icons/FileAttachmentIcon";
import { NPCListBase } from '../SocialSidebar/NPCList';
import { Direction } from '../../classes/Player';
import NPC, { cloneNPC } from '../../classes/NPC';
import CurrentPublicTowns from "./CurrentPublicTowns";
import Behavior from '../../classes/Behavior';
import Script from '../../classes/Script';
import Path from '../../classes/Path';

interface TownSelectionProps {
  doLogin: (initData: TownJoinResponse) => Promise<boolean>
}

export default function TownSelection({ doLogin }: TownSelectionProps): JSX.Element {
  const [userName, setUserName] = useState<string>(Video.instance()?.userName || '');
  const [newTownName, setNewTownName] = useState<string>('');
  const [newTownIsPublic, setNewTownIsPublic] = useState<boolean>(true);
  const [newTownNPCs, setNewTownNPCs] = useState<NPC[]>([]);
  const [newTownLoading, setNewTownLoading] = useState<boolean>(false);
  const [townIDToJoin, setTownIDToJoin] = useState<string>('');
  const { connect: videoConnect } = useVideoContext();
  const { apiClient } = useCoveyAppState();
  const toast = useToast();

  const handleJoin = useCallback(async (coveyRoomID: string) => {
    try {
      if (!userName || userName.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please select a username',
          status: 'error',
        });
        return;
      }
      if (!coveyRoomID || coveyRoomID.length === 0) {
        toast({
          title: 'Unable to join town',
          description: 'Please enter a town ID',
          status: 'error',
        });
        return;
      }
      const initData = await Video.setup(userName, coveyRoomID);

      const loggedIn = await doLogin(initData);
      if (loggedIn) {
        assert(initData.providerVideoToken);
        await videoConnect(initData.providerVideoToken);
      }
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  }, [doLogin, userName, videoConnect, toast]);

  const handleCreate = async () => {
    setNewTownLoading(true);
    if (!userName || userName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please select a username before creating a town',
        status: 'error',
      });
      setNewTownLoading(false);
      return;
    }
    if (!newTownName || newTownName.length === 0) {
      toast({
        title: 'Unable to create town',
        description: 'Please enter a town name',
        status: 'error',
      });
      setNewTownLoading(false);
      return;
    }
    try {
      const newTownInfo = await apiClient.createTown({
        friendlyName: newTownName,
        isPubliclyListed: newTownIsPublic,
        npcs: newTownNPCs,
      });
      let privateMessage = <></>;
      if (!newTownIsPublic) {
        privateMessage =
          <p>This town will NOT be publicly listed. To re-enter it, you will need to use this
            ID: {newTownInfo.coveyTownID}</p>;
      }
      toast({
        title: `Town ${newTownName} is ready to go!`,
        description: <>{privateMessage}Please record these values in case you need to change the
          town:<br />Town ID: {newTownInfo.coveyTownID}<br />Town Editing
          Password: {newTownInfo.coveyTownPassword}</>,
        status: 'success',
        isClosable: true,
        duration: null,
      });
      await handleJoin(newTownInfo.coveyTownID);
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      });
      setNewTownLoading(false);
    }
  };

  const inputRef = useRef<HTMLInputElement | null>(null)
  const handleClick = () => inputRef.current?.click()
  const isArray = (data: unknown) => Object.prototype.toString.call(data) === "[object Array]";

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const fileContent = await files[0].text();
      const jsonData = JSON.parse(fileContent);
      if (isArray(jsonData) && jsonData.every((element: unknown) => NPC.isNPC(element))) {
        const newData: NPC[] = jsonData.map((n: NPC) => { n.id = nanoid(); return n; });
        setNewTownNPCs(newData);
      }
      else {
        toast({
          title: 'File upload failed',
          description: "",
          status: 'error'
        })
      }
    }
  }

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  type NPCJSONListProps = {
    npcs: NPC[]
    onDelete: (npc: NPC) => void
    onDuplicate: (npc: NPC) => void
  }

  const deleteFromNewTown = (npc: NPC) => { setNewTownNPCs(newTownNPCs.filter(n => n !== npc)) };
  const duplicateNPC = (npc: NPC) => { setNewTownNPCs(newTownNPCs.concat(cloneNPC(npc, nanoid()))) };
  const addNPC = () => {
    setNewTownNPCs(newTownNPCs.concat(
      new NPC(nanoid(),
        "new NPC",
        { x: 0, y: 0, rotation: 'front', moving: false },
        { x: 0, y: 0, rotation: 'front', moving: false },
        new Behavior(nanoid(), "empty behavior", new Script(nanoid(), [], false), new Path(nanoid(), [])),
        "",
        "",
      )))
  };

  function NPCInJSONList({ npcs, onDelete, onDuplicate }: NPCJSONListProps): JSX.Element {
    const onFormSubmit = async (values: { [p: string]: File | string }) => {
      const npc = npcs.find((_npc) => _npc.id === values.id.toString());
      const rot: Direction = 'front';
      if (npc) {
        npc.name = values.name.toString();
        npc.startLocation = { x: Number(values["startLocation.x"]), y: Number(values["startLocation.y"]), rotation: rot, moving: false };
        npc.currentLocation = { x: Number(values["currentLocation.x"]), y: Number(values["currentLocation.y"]), rotation: rot, moving: false };
      }
    }
    return NPCListBase({ npcs, onFormSubmit, onDelete, onDuplicate });
  }

  return (
    <>
      <form>
        <Stack>
          <Box p="4" borderWidth="1px" borderRadius="lg">
            <Heading as="h2" size="lg">Select a username</Heading>

            <FormControl>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input autoFocus name="name" placeholder="Your name"
                value={userName}
                onChange={event => setUserName(event.target.value)}
              />
            </FormControl>
          </Box>
          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Create a New Town</Heading>
            <Stack>
              <Flex pr="4" pl="4">
                <Box flex="3">
                  <FormControl>
                    <FormLabel htmlFor="townName">New Town Name</FormLabel>
                    <Input name="townName" placeholder="New Town Name"
                      value={newTownName}
                      onChange={event => setNewTownName(event.target.value)}
                    />
                  </FormControl>
                </Box>
                <Box pr="4" pl="4">
                  <FormControl>
                    <FormLabel htmlFor="npcList">NPCs</FormLabel>
                    <InputGroup id="npcList" name="npcList" onClick={handleClick}>
                      <input
                        type='file'
                        multiple={false}
                        hidden
                        accept=".json"
                        ref={inputRef}
                        onChange={handleFileSelected}
                        data-testid="npcUpload"
                      />
                      <Button leftIcon={<FileAttachmentIcon />} colorScheme={newTownNPCs.length > 0 ? "blackAlpha" : "gray"}>
                        {newTownNPCs.length > 0 ? "Reupload" : "Upload"}
                      </Button>
                    </InputGroup>
                  </FormControl>
                </Box>
                <Box pr="4">
                  <FormControl>
                    <FormLabel htmlFor="modNPC">Modify NPCs</FormLabel>
                    <Button colorScheme='blue' onClick={onOpen}>Open List</Button>
                  </FormControl>
                </Box>
                <Box>
                  <FormControl>
                    <FormLabel htmlFor="isPublic">Publicly Listed</FormLabel>
                    <Checkbox id="isPublic" name="isPublic" isChecked={newTownIsPublic}
                      onChange={(e) => {
                        setNewTownIsPublic(e.target.checked)
                      }} />
                  </FormControl>
                </Box>
              </Flex>
              <Box pr="4" pl="4" pb="4">
                <AlertDialog
                  isOpen={isOpen}
                  leastDestructiveRef={cancelRef}
                  onClose={onClose}
                >
                  <AlertDialogOverlay>
                    <AlertDialogContent>
                      <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        Modify NPCs in setup file
                      </AlertDialogHeader>

                      <AlertDialogBody>
                        <p>NPCs to create are listed below.</p>
                        <Box>
                          <NPCInJSONList npcs={newTownNPCs} onDelete={deleteFromNewTown} onDuplicate={duplicateNPC} />
                        </Box>
                      </AlertDialogBody>

                      <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                          Close
                        </Button>
                        <Button colorScheme='blue' ml={3} onClick={addNPC}>
                          Add
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogOverlay>
                </AlertDialog>
                <Button data-testid="newTownButton" onClick={handleCreate} disabled={newTownLoading}>Create</Button>
              </Box>
            </Stack>
          </Box>
          <Heading p="4" as="h2" size="lg">-or-</Heading>

          <Box borderWidth="1px" borderRadius="lg">
            <Heading p="4" as="h2" size="lg">Join an Existing Town</Heading>
            <Box borderWidth="1px" borderRadius="lg">
              <Flex p="4"><FormControl>
                <FormLabel htmlFor="townIDToJoin">Town ID</FormLabel>
                <Input name="townIDToJoin" placeholder="ID of town to join, or select from list"
                  value={townIDToJoin}
                  onChange={event => setTownIDToJoin(event.target.value)} />
              </FormControl>
                <Button data-testid='joinTownByIDButton'
                  onClick={() => handleJoin(townIDToJoin)}>Connect</Button>
              </Flex>

            </Box>

            <Heading p="4" as="h4" size="md">Select a public town to join</Heading>
            <Box maxH="500px" overflowY="scroll">
              <Table>
                <TableCaption placement="bottom">Publicly Listed Towns</TableCaption>
                <Thead><Tr><Th>Town Name</Th><Th>Town ID</Th><Th>Activity</Th></Tr></Thead>
                <Tbody>
                  <CurrentPublicTowns handleJoin={handleJoin}/>
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Stack>
      </form>
    </>
  );
}
