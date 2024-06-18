import { Button, Flex, FormControl, Heading, Input, Text, useToast } from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { useState } from 'react';
import { request } from './util';

const validAddress = (address: string): boolean => {
  // https://stackoverflow.com/a/27434991
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(address) || address === "localhost";
}

const App = () => {
  // Input states
  const [invalidInput, setInvalidInput] = useState(false);

  // Connectivity and status update states
  const [connected, setConnected] = useState(false);
  const [connectivityLoading, setConnectivityLoading] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState("Never");
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState("Never");
  const [address, setAddress] = useState("192.168.0.1");
  const [port, setPort] = useState(4444);

  // Response states
  const [elapsedTime, setElapsedTime] = useState(0.0);
  const [activeBlock, setActiveBlock] = useState("Inactive");

  // Toast instance
  const toast = useToast();

  // Update states and do input validation
  const updateAddress = (event: any) => {
    setInvalidInput(!validAddress(event.target.value));
    setAddress(event.target.value);
  };
  const updatePort = (event: any) => {
    setInvalidInput(isNaN(event.target.value) || event.target.value > 9999 || event.target.value < 0);
    setPort(event.target.value);
  };

  const checkConnectivity = async () => {
    setConnectivityLoading(true);
    const response = await request<any>("http://" + address + ":" + port.toString() + "/active", { timeout: 10000 });
    setConnectivityLoading(false);
    if (response.success) {
      toast({
        status: "success",
        title: "Connected!",
        description: `Connected to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(true);
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  const refreshStatus = async () => {
    setStatusLoading(true);
    const response = await request<any>("http://" + address + ":" + port.toString() + "/status", { timeout: 10000 });
    setStatusLoading(false);
    if (response.success) {
      const status = JSON.parse(response.data);
      setLastStatus(new Date().toLocaleString());
      setElapsedTime(status["elapsed_time"]);
      setActiveBlock(status["active_block"]);
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Heading>Headsup :: Headset</Heading>
      <Flex w={"60%"}>
        <FormControl isInvalid={invalidInput}>
          <Flex w={"100%"} direction={"row"} gap={"2"}>
            <Flex w={"60%"} gap={"2"}>
              <Input placeholder={"Headset Local IP Address"} value={address} onChange={updateAddress} />
              <Input w={"20%"} type={"number"} placeholder={"Port"} value={port} onChange={updatePort} />
            </Flex>
            <Button
              colorScheme={"green"}
              isDisabled={invalidInput}
              isLoading={connectivityLoading}
              loadingText={"Testing..."}
              onClick={checkConnectivity}
            >
              Test Connectivity
            </Button>
            <Flex direction={"row"} align={"center"} gap={"2"}>
              {connected ? <CheckCircleIcon color={"green"} /> : <WarningIcon color={"red"} />}
              <Text color={connected ? "green.600" : "red.600"} fontWeight={"semibold"}>{connected ? "Connected!" : "Not connected"}</Text>
            </Flex>
          </Flex>
        </FormControl>
      </Flex>
      <Flex direction={"row"} gap={"2"}>
        <Flex w={"70%"} direction={"column"} gap={"2"}>
          <Heading size={"md"}>Headset View</Heading>
          <Flex w={"100%"} direction={"row"} gap={"6"} align={"center"}>
            <Button colorScheme={"blue"} isDisabled={!connected}>Refresh</Button>
            <Text color={"gray.500"} fontSize={"sm"}>Last Update: {lastScreenshot}</Text>
          </Flex>
          <Flex><Text>Screenshot Placeholder</Text></Flex>
        </Flex>
        <Flex w={"30%"} direction={"column"} gap={"2"}>
          <Heading size={"md"}>Headset Status</Heading>
          <Flex w={"100%"} direction={"row"} gap={"6"} align={"center"}>
            <Button
              colorScheme={"blue"}
              isDisabled={!connected}
              isLoading={statusLoading}
              loadingText={"Refreshing..."}
              onClick={refreshStatus}
            >
              Refresh
            </Button>
            <Text color={"gray.500"} fontSize={"sm"}>Last Update: {lastStatus}</Text>
          </Flex>
          <Heading size={"sm"}>Status</Heading>
          <Text>Active block: {activeBlock}</Text>
          <Text>Elapsed time: {elapsedTime}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default App
