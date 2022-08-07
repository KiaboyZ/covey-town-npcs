import CORS from 'cors';
import Express from 'express';
import http from 'http';
import { nanoid } from 'nanoid';
import { AddressInfo } from 'net';
import addTownRoutes from '../router/towns';

import TownsServiceClient from './TownsServiceClient';
import NPC, { RequestNPC } from '../types/NPC';
import { UserLocation } from '../CoveyTypes';
import Behavior from '../types/Behavior';
import Script from '../types/Script';
import Path from '../types/Path';

type TestTownData = {
  friendlyName: string;
  coveyTownID: string;
  isPubliclyListed: boolean;
  townUpdatePassword: string;
};

describe('NPC API', () => {
  let server: http.Server;
  let apiClient: TownsServiceClient;

  async function createTownForTesting(
    friendlyNameToUse?: string,
    isPublic = false,
    npcs: NPC[] = [],
  ): Promise<TestTownData> {
    const friendlyName =
      friendlyNameToUse !== undefined
        ? friendlyNameToUse
        : `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
    const ret = await apiClient.createTown({
      friendlyName,
      isPubliclyListed: isPublic,
      npcs,
    });
    return {
      friendlyName,
      isPubliclyListed: isPublic,
      coveyTownID: ret.coveyTownID,
      townUpdatePassword: ret.coveyTownPassword,
    };
  }

  type TestNPC = {
    id: string;
    name: string;
    sprite: string;
    startLocation: UserLocation;
    currentLocation: UserLocation;
    behavior: Behavior;
  };

  function createNPC() : TestNPC {
    const newLocation:UserLocation = { moving: false, rotation: 'front', x: 25, y: 25 };
    const script : Script = new Script(['hello'], false);
    const path : Path = new Path([newLocation, newLocation]);
    const behavior : Behavior = new Behavior('behave', script, path);

    return {
      id: nanoid(),
      name: nanoid(),
      sprite: '',
      startLocation: newLocation,
      currentLocation: newLocation,
      behavior,
    };
  }

  beforeAll(async () => {
    const app = Express();
    app.use(CORS());
    server = http.createServer(app);

    addTownRoutes(server, app);
    await server.listen();
    const address = server.address() as AddressInfo;

    apiClient = new TownsServiceClient(`http://127.0.0.1:${address.port}`);
  });
  afterAll(async () => {
    await server.close();
  });
  it('Executes without error when creating a town', async () => {
    jest.setTimeout(40000);
    const npc = createNPC();
    const array = [npc as unknown as NPC];
    const testingTown = await createTownForTesting(undefined, true, array);
    const testingSession = await apiClient.joinTown({
      userName: nanoid(),
      coveyTownID: testingTown.coveyTownID,
    });

    const res = await apiClient.joinTown({
      userName: nanoid(),
      coveyTownID: testingTown.coveyTownID,
    });
    npc.id = (res.currentNPCs[0] as unknown as RequestNPC)._id;

    await apiClient.updateNPC({
      coveyTownID: testingTown.coveyTownID,
      sessionToken: testingSession.coveySessionToken,
      npc: npc as unknown as NPC,
    });
  });
});
