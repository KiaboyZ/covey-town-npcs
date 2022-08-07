import {Button, Td, Tr} from "@chakra-ui/react";
import React, {useCallback, useEffect, useState} from "react";
import {CoveyTownInfo} from "../../classes/TownsServiceClient";
import useCoveyAppState from "../../hooks/useCoveyAppState";


interface CurrentPublicTownsProps {
  handleJoin: (coveyRoomID: string) => Promise<void>;
}

export default function CurrentPublicTowns({handleJoin} : CurrentPublicTownsProps): JSX.Element {
  const { apiClient } = useCoveyAppState();
  const [currentPublicTowns, setCurrentPublicTowns] = useState<CoveyTownInfo[]>();

  const updateTownListings = useCallback(() => {
    apiClient.listTowns()
      .then((towns) => {
        setCurrentPublicTowns(towns.towns
          .sort((a, b) => b.currentOccupancy - a.currentOccupancy)
        );
      })
  }, [setCurrentPublicTowns, apiClient]);
  useEffect(() => {
    updateTownListings();
    const timer = setInterval(updateTownListings, 2000);
    return () => {
      clearInterval(timer)
    };
  }, [updateTownListings]);

  return <>
    {currentPublicTowns?.map((town) => (
      <Tr key={town.coveyTownID}><Td role='cell'>{town.friendlyName}</Td><Td
        role='cell'>{town.coveyTownID}</Td>
        <Td role='cell'>{town.currentOccupancy}/{town.maximumOccupancy}
          <Button onClick={() => handleJoin(town.coveyTownID)}
                  disabled={town.currentOccupancy >= town.maximumOccupancy}>Connect</Button></Td></Tr>
      ))}
  </>
}
