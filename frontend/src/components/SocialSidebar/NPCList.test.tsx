import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { render, RenderResult } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import React from 'react';
import { UserLocation } from '../../classes/Player';
import NPC from '../../classes/NPC';
import Behavior from '../../classes/Behavior';
import Script from '../../classes/Script';
import Path from '../../classes/Path';
import { CoveyAppState } from '../../CoveyTypes';
import * as useCoveyAppState from '../../hooks/useCoveyAppState';
import * as useNPCsInTown from '../../hooks/useNPCsInTown';
import NPCList from './NPCList';

describe('NPCInTownList', () => {
  const randomLocation = (): UserLocation => ({
    moving: Math.random() < 0.5,
    rotation: 'front',
    x: Math.random() * 1000,
    y: Math.random() * 1000,
  });
  const wrappedNPCListComponent = () => (
    <ChakraProvider>
      <React.StrictMode>
        <NPCList />
      </React.StrictMode>
    </ChakraProvider>
  );
  const renderNPCList = () => render(wrappedNPCListComponent());
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  let useNPCsInTownSpy: jest.SpyInstance<NPC[], []>;
  let useCoveyAppStateSpy: jest.SpyInstance<CoveyAppState, []>;
  let npcs: NPC[] = [];
  let townID: string;
  let townFriendlyName: string;
  const expectProperlyRenderedNPCList = async (
    renderData: RenderResult,
    npcsToExpect: NPC[],
  ) => {
    const listEntries = await renderData.findAllByRole('listitem');
    expect(listEntries.length).toBe(npcsToExpect.length); // expect same number of npcs
    const npcsSortedCorrectly = npcsToExpect
      .map(n => n.name);
    for (let i = 0; i < npcsSortedCorrectly.length; i += 1) {
      expect(listEntries[i]).toHaveTextContent(npcsSortedCorrectly[i]);
      const parentComponent = listEntries[i].parentNode;
      if(parentComponent){
          expect(parentComponent.nodeName).toBe('OL'); // list items expected to be directly nested in an ordered list
      }
    }
  };
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
    useNPCsInTownSpy = jest.spyOn(useNPCsInTown, 'default');
    useCoveyAppStateSpy = jest.spyOn(useCoveyAppState, 'default');
  });

  beforeEach(() => {
    npcs = [];
    const TEST_SCRIPT = new Script('id', ["line 1"], true);
    const TEST_PATH = new Path("id", [randomLocation()]);
    const TEST_BEHAVIOR = new Behavior("id", "name", TEST_SCRIPT, TEST_PATH);

    for (let i = 0; i < 10; i += 1) {
      npcs.push(
        new NPC(
          `testingNPCID${i}-${nanoid()}`,
          `testingNPCName${i}-${nanoid()}}`,
          randomLocation(),
          randomLocation(),
          TEST_BEHAVIOR,
          "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
          "{\"frames\": { } }"
        ),
      );
    }
    useNPCsInTownSpy.mockReturnValue(npcs);
    townID = nanoid();
    townFriendlyName = nanoid();
    const mockAppState = mock<CoveyAppState>();
    mockAppState.currentTownFriendlyName = townFriendlyName;
    mockAppState.currentTownID = townID;
    useCoveyAppStateSpy.mockReturnValue(mockAppState);
  });
  it("Renders a list of all npcs' names, without checking sort", async () => {
    // npcs array is already sorted correctly
    const renderData = renderNPCList();
    await expectProperlyRenderedNPCList(renderData, npcs);
  });
  it("Displays npcs' usernames in ascending alphabetical order", async () => {
    npcs.reverse();
    const renderData = renderNPCList();
    await expectProperlyRenderedNPCList(renderData, npcs);
  });
  it('Does not mutate the array returned by useNPCsInTown', async () => {
    npcs.reverse();
    const copyOfArrayPassedToComponent = npcs.concat([]);
    const renderData = renderNPCList();
    await expectProperlyRenderedNPCList(renderData, npcs);
    expect(npcs).toEqual(copyOfArrayPassedToComponent); // expect that the npcs array is unchanged by the compoennt
  });
  it('Adds npcs to the list when they are added to the town', async () => {
    const TEST_SCRIPT = new Script('id', ["line 1"], true);
    const TEST_PATH = new Path("id", [randomLocation()]);
    const TEST_BEHAVIOR = new Behavior("id", "name", TEST_SCRIPT, TEST_PATH);

    const renderData = renderNPCList();
    await expectProperlyRenderedNPCList(renderData, npcs);
    for (let i = 0; i < npcs.length; i += 1) {
      const newNPCs = npcs.concat([
        new NPC(`testingNPCID-${i}.new`, `testingNPCName${i}.new`, randomLocation(), randomLocation(),
          TEST_BEHAVIOR, "data:image/gif;base64,R0lGODlhAQABAAAAACw=","{\"frames\": { } }"),
      ]);
      useNPCsInTownSpy.mockReturnValue(newNPCs);
      renderData.rerender(wrappedNPCListComponent());
      await expectProperlyRenderedNPCList(renderData, newNPCs);
    }
  });
  it('Removes npcs from the list when they are removed from the town', async () => {
    const renderData = renderNPCList();
    await expectProperlyRenderedNPCList(renderData, npcs);
    for (let i = 0; i < npcs.length; i += 1) {
      const newNPCs = npcs.splice(i, 1);
      useNPCsInTownSpy.mockReturnValue(newNPCs);
      renderData.rerender(wrappedNPCListComponent());
      await expectProperlyRenderedNPCList(renderData, newNPCs);
    }
  });
});
