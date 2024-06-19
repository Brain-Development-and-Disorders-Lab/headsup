import { Button, Flex, FormControl, Heading, Input, Spacer, StackItem, Text, VStack, useToast } from '@chakra-ui/react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
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
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Connectivity details
  const [address, setAddress] = useState("192.168.0.1");
  const [port, setPort] = useState(4444);
  const [headsetState, setHeadsetState] = useState("disconnected" as "disconnected" | "online" | "connected")

  // Screenshot details
  const [lastScreenshot, setLastScreenshot] = useState("Never");
  const [screenshotData, setScreenshotData] = useState("");

  // Status details
  const [statusInterval, setStatusInverval] = useState(0);
  const [lastStatus, setLastStatus] = useState("Never");
  const [elapsedTime, setElapsedTime] = useState(0.0);
  const [activeBlock, setActiveBlock] = useState("Inactive");
  const [systemLogs, setSystemLogs] = useState([] as string[]);

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
        status: "info",
        title: "Online",
        description: `Headset at address "${"http://" + address + ":" + port.toString()}" is online`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setHeadsetState("online");
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${"http://" + address + ":" + port.toString()}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setHeadsetState("disconnected");
    }
  };

  const makeConnection = async () => {
    setConnectionLoading(true);
    const response = await request<any>("http://" + address + ":" + port.toString() + "/active", { timeout: 5000 });
    setConnectionLoading(false);
    if (response.success) {
      toast({
        status: "success",
        title: "Connected",
        description: `Connected to headset at address "${"http://" + address + ":" + port.toString()}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setHeadsetState("connected");
      setConnected(true);
      startSync();
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${"http://" + address + ":" + port.toString()}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setHeadsetState("disconnected");
    }
  };

  const startSync = () => {
    const interval = setInterval(() => {
      updateStatus();
      updateLogs();
    }, 500);
    setStatusInverval(interval);
  };

  const stopSync = async (unexpected: boolean) => {
    clearInterval(statusInterval);
    if (unexpected) {
      toast({
        status: "error",
        title: "Connection Lost",
        description: `Lost connection to headset at address "${"http://" + address + ":" + port.toString()}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }
    setHeadsetState("disconnected");
    setConnected(false);
  };

  const updateStatus = async () => {
    const response = await request<any>("http://" + address + ":" + port.toString() + "/status", { timeout: 5000 });
    if (response.success) {
      setLastStatus(new Date().toLocaleString());
      setElapsedTime(response.data["elapsed_time"]);
      setActiveBlock(response.data["active_block"]);
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });

      // Stop sync due to connectivity error
      if (connected) {
        await stopSync(true);
      }
    }
  };

  const updateLogs = async () => {
    const response = await request<any>("http://" + address + ":" + port.toString() + "/logs", { timeout: 5000 });
    if (response.success) {
      if (response.data.length > 0) {
        setSystemLogs(systemLogs => [...systemLogs, response.data] );
      }
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });

      // Stop sync due to connectivity error
      if (connected) {
        await stopSync(true);
      }
    }
  }

  const updateScreen = async () => {
    const response = await request<any>("http://" + address + ":" + port.toString() + "/screen", { timeout: 5000 });
    if (response.success && response.data !== "") {
      setScreenshotData(`data:image/jpeg;base64,${response.data}`);
      setLastScreenshot(new Date().toLocaleString());
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${address}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  }

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Flex w={"100%"} align={"center"}>
        <Heading>Headsup :: Headset</Heading>
        <Spacer />
        {headsetState === "connected" &&
          <Flex direction={"row"} align={"center"} gap={"2"}>
            <CheckCircleIcon color={"green"} />
            <Text color={"green.600"}>Headset connected</Text>
          </Flex>
        }
        {headsetState === "online" &&
          <Flex direction={"row"} align={"center"} gap={"2"}>
            <InfoIcon color={"cornflowerblue"} />
            <Text color={"cornflowerblue"}>Headset online</Text>
          </Flex>
        }
        {headsetState === "disconnected" &&
          <Flex direction={"row"} align={"center"} gap={"2"}>
            <Text fontWeight={"semibold"} color={"gray.600"}>Status:</Text>
            <WarningIcon color={"red"} />
            <Text color={"red.600"}>Headset offline</Text>
          </Flex>
        }
      </Flex>
      <Flex w={"60%"}>
        <FormControl isInvalid={invalidInput}>
          <Text fontWeight={"semibold"} color={"gray.600"}>Connection</Text>
          <Flex w={"100%"} direction={"row"} gap={"2"}>
            <Flex w={"60%"} gap={"2"}>
              <Input placeholder={"Headset Local IP Address"} value={address} onChange={updateAddress} isDisabled={connectionLoading || connectivityLoading || connected} />
              <Input w={"20%"} type={"number"} placeholder={"Port"} value={port} onChange={updatePort} isDisabled={connectionLoading || connectivityLoading || connected} />
            </Flex>
            <Button
              isDisabled={invalidInput || connectionLoading || connected}
              isLoading={connectivityLoading}
              loadingText={"Testing..."}
              onClick={checkConnectivity}
            >
              Test
            </Button>
            <Button
              colorScheme={"green"}
              isDisabled={invalidInput || connected}
              isLoading={connectionLoading}
              loadingText={"Connecting..."}
              onClick={makeConnection}
            >
              Connect
            </Button>
            {connected &&
              <Button
                colorScheme={"red"}
                loadingText={"Disconnecting..."}
                onClick={() => stopSync(false)}
              >
                Disconnect
              </Button>
            }
          </Flex>
        </FormControl>
      </Flex>
      <Flex direction={"row"} gap={"2"}>
        <Flex w={"60%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"}>
          <Flex align={"center"}>
            <Heading size={"lg"}>Headset Display</Heading>
            <Spacer />
            <Button
              colorScheme={"blue"}
              isDisabled={!connected}
              onClick={updateScreen}
            >
              Update
            </Button>
          </Flex>
          <Text color={"gray.500"} fontSize={"sm"}>Last Update: {lastScreenshot}</Text>
          {screenshotData !== "" &&
            <img src={screenshotData} />
          }
          {screenshotData === "" &&
            <Flex h={"400px"} w={"100%"} bg={"black"} align={"center"} justify={"center"}>
              {headsetState !== "connected" && <Text color={"white"}>Display Offline</Text>}
            </Flex>
          }
        </Flex>
        <Flex w={"40%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"} maxH={"70vh"}>
          <Flex w={"100%"} direction={"row"} align={"center"}>
            <Heading size={"lg"}>Headset Status</Heading>
          </Flex>
          <Text color={"gray.500"} fontSize={"sm"}>Last Update: {lastStatus}</Text>
          <Heading size={"sm"}>Status</Heading>
          <Text>Active block: {activeBlock}</Text>
          <Text>Elapsed time: {elapsedTime}</Text>
          <Heading size={"sm"}>Logs</Heading>
          <VStack
            border={"1px"}
            borderColor={"gray.200"}
            rounded={"md"}
            p={"2"}
            spacing={"2"}
            align={"stretch"}
            h={"100%"}
            bg={"gray.50"}
            overflowY={"auto"}
          >
            {systemLogs.length === 0 && <Text>Waiting for log output...</Text>}
            {systemLogs.length > 0 && systemLogs.map((log, index) => {
              return <StackItem key={`log_${index}`}><Text fontSize={"x-small"}>{log}</Text></StackItem>;
            })}
          </VStack>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default App
