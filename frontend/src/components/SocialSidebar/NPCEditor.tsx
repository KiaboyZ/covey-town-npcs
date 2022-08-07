import React, { FormEvent, MouseEvent, useRef } from 'react';
import {
  Button,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
  Drawer,
  Spacer,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  FormControl,
  TableContainer,
  Table,
  Thead,
  Text,
  Tr, Th, Tbody, Td, Switch, Divider
} from "@chakra-ui/react";

import NPC from '../../classes/NPC';
import FileAttachmentIcon from "../VideoCall/VideoFrontend/icons/FileAttachmentIcon";

type NPCNameProps = {
  npc: NPC
  onFormSubmit: (values: { [p: string]: File | string }) => void
  onDelete: (npc: NPC) => void
  onDuplicate: (npc: NPC) => void
}

export default function NPCEditor({ npc, onFormSubmit, onDelete, onDuplicate }: NPCNameProps): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleClick = () => inputRef.current?.click();
  const handleFileSelected = () => { };

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(data.entries());
    onFormSubmit(values);
  }

  const onDeleteBtn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // anything else?
    onDelete(npc);
  }

  const onDuplicateBtn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDuplicate(npc);
  }

  return <Flex>
    <p>{npc.name}</p>
    <Spacer />
    <Menu>
      <MenuButton as={IconButton}>
        ...
      </MenuButton>
      <MenuList>
        <MenuItem onClick={onOpen}>
          Edit
        </MenuItem>
        <Drawer
          isOpen={isOpen}
          placement='right'
          onClose={onClose}
        >
          <DrawerOverlay />
          <DrawerContent>

            <DrawerCloseButton />
            <DrawerHeader>Edit NPC</DrawerHeader>

            <DrawerBody>
              <form id='updateNpc' onSubmit={onSave}>
                <Input hidden id='npcName' defaultValue={npc.id} type='text' name="id" />

                <FormLabel htmlFor='npcName'><Text as='em'>NPC Name</Text></FormLabel>
                <Input id='npcName' defaultValue={npc.name} type='text' name="name" />

                <Divider orientation='horizontal' style={{ margin: "20px" }} />

                <FormControl>
                  <FormLabel htmlFor='sprite'><Text as='em'>Sprite Image</Text></FormLabel>
                  <InputGroup id="sprite" name="sprite" onClick={handleClick}>
                    <input
                      type='file'
                      multiple={false}
                      hidden
                      accept="image/png"
                      ref={inputRef}
                      onChange={handleFileSelected}
                      name="sprite"
                    />
                    <Button leftIcon={<FileAttachmentIcon />}>
                      Upload
                    </Button>
                  </InputGroup>
                </FormControl>

                <Divider orientation='horizontal' style={{ margin: "20px" }} />

                <FormLabel htmlFor='startLocation' ><Text as='em'>Start Location</Text></FormLabel>
                <Flex>
                  <InputGroup id="startLocation">
                    <InputLeftAddon>X</InputLeftAddon>
                    <Input type="text" defaultValue={npc.startLocation.x} name="startLocation.x" />
                  </InputGroup>
                  <InputGroup>
                    <InputLeftAddon>Y</InputLeftAddon>
                    <Input type="text" defaultValue={npc.startLocation.y} name="startLocation.y" />
                  </InputGroup>
                </Flex>

                <FormLabel htmlFor='currentLocation' ><Text as='em'>Current Location</Text></FormLabel>
                <Flex>
                  <InputGroup id="currentLocation">
                    <InputLeftAddon>X</InputLeftAddon>
                    <Input type="text" defaultValue={npc.currentLocation.x} name="currentLocation.x" />
                  </InputGroup>
                  <InputGroup>
                    <InputLeftAddon>Y</InputLeftAddon>
                    <Input type="text" defaultValue={npc.currentLocation.y} name="currentLocation.y" />
                  </InputGroup>
                </Flex>

                <Divider orientation='horizontal' style={{ margin: "20px" }} />

                <h3><Text as='em'>Script</Text></h3>
                <TableContainer>
                  <Table size='sm'>
                    <Thead>
                      <Tr>
                        <Th>Order</Th>
                        <Th>Text</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {npc.behavior.script.scriptLines.map(
                        (line, i) => <Tr key={line}>
                          <Td>{i}</Td>
                          <Td>{line}</Td>
                        </Tr>)}
                    </Tbody>
                  </Table>
                </TableContainer>

                <FormControl display='flex' alignItems='center' marginLeft='10px'>
                  <FormLabel htmlFor='randomizeScript' mb='0'>
                    Randomize
                  </FormLabel>
                  <Switch id='randomizeScript' name='randomizeScript' />
                </FormControl>

                <Divider orientation='horizontal' style={{ margin: "20px" }} />

                <h3><Text as='em'>Path</Text></h3>
                <TableContainer>
                  <Table size='sm'>
                    <Thead>
                      <Tr>
                        <Th>Order</Th>
                        <Th isNumeric>X</Th>
                        <Th isNumeric>y</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {npc.behavior.path.movement.map(
                        (pos, i) => <Tr key={JSON.stringify(pos)}>
                          <Td>{i}</Td>
                          <Td>{pos.x}</Td>
                          <Td isNumeric>{pos.y}</Td>
                        </Tr>)}
                    </Tbody>
                  </Table>
                </TableContainer>
              </form>
            </DrawerBody>

            <DrawerFooter>
              <Button variant='outline' mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button form='updateNpc' colorScheme='blue' type="submit" onClick={onClose}>
                Save
              </Button>
            </DrawerFooter>

          </DrawerContent>
        </Drawer>
        <MenuItem onClick={onDuplicateBtn}>Duplicate</MenuItem>
        <MenuItem onClick={onDeleteBtn}>Remove</MenuItem>
      </MenuList>
    </Menu>
  </Flex>
}