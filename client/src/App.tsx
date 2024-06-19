import { Button, Flex, FormControl, Heading, Input, Spacer, StackItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, useToast } from '@chakra-ui/react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { useEffect, useState } from 'react';
import { request } from './util';
import dayjs from 'dayjs';

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
  const [lastScreenshot, setLastScreenshot] = useState("");
  const [screenshotData, setScreenshotData] = useState([] as string[]);

  // Status details
  const [statusInterval, setStatusInterval] = useState(-1);
  const [lastStatus, setLastStatus] = useState("");
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

  useEffect(() => {
    if (!connected) {
      stopSync(false);
    }
  }, [connected]);

  /**
   * Utility function to test connectivity and response from headset
   */
  const testConnectivity = async () => {
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

  /**
   * Function to establish that connectivity to the headset exists, and start the synchronization interval function
   */
  const connect = async () => {
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
      setConnected(false);
    }
  };

  /**
   * Handles clicking "Disconnect" button
   */
  const disconnect = () => {
    setConnected(false);
  };

  /**
   * Function to create a new interval responsible for refreshing the status and log output
   */
  const startSync = () => {
   setStatusInterval(setInterval(() => {
      refreshStatus();
      updateLogs();
    }, 500));
  };

  /**
   * Function to clear interval responsible for synchronizing data between dashboard and headset
   * @param unexpected Denotes if this function is being called out of error or on user disconnect
   */
  const stopSync = (unexpected: boolean) => {
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
  };

  /**
   * Retrieve the status values from the headset
   */
  const refreshStatus = async () => {
    const response = await request<any>("http://" + address + ":" + port.toString() + "/status", { timeout: 5000 });
    if (response.success) {
      setLastStatus(new Date().toLocaleString());
      setActiveBlock(response.data["active_block"]);
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset at address "${"http://" + address + ":" + port.toString()}"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * Retrieve log output from the headset
   */
  const updateLogs = async () => {
    const response = await request<any>("http://" + address + ":" + port.toString() + "/logs", { timeout: 5000 });
    if (response.success) {
      if (response.data.length > 0) {
        setSystemLogs(systemLogs => [...response.data.reverse(), ...systemLogs] );
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
      setConnected(false);
    }
  }

  /**
   * Retrieve screenshots of the headset displays
   */
  const refreshScreen = async () => {
    // Send a trigger request first
    const response = await request<any>("http://" + address + ":" + port.toString() + "/screen", { timeout: 5000 });
    if (response.success) {
      if (response.data.length > 0 && response.data.filter((s: string) => s !== "").length > 0) {
        const screenshots = [];
        for (let encoded of response.data) {
          screenshots.push(`data:image/jpeg;base64,${encoded}`);
        }
        setScreenshotData(screenshots);
        setLastScreenshot(new Date().toLocaleString());
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
      setConnected(false);
    }
  }

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Flex w={"100%"} align={"center"}>
        <Heading>Headsup</Heading>
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
              onClick={testConnectivity}
            >
              Test
            </Button>
            <Button
              colorScheme={"green"}
              isDisabled={invalidInput || connected}
              isLoading={connectionLoading}
              loadingText={"Connecting..."}
              onClick={connect}
            >
              Connect
            </Button>
            {connected &&
              <Button
                colorScheme={"red"}
                loadingText={"Disconnecting..."}
                onClick={disconnect}
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
            <Heading size={"lg"}>Headset Displays</Heading>
            <Spacer />
            <Button
              colorScheme={"blue"}
              isDisabled={!connected}
              onClick={refreshScreen}
            >
              Refresh
            </Button>
          </Flex>
          <Text color={"gray.500"} fontSize={"sm"}>Last Updated: {lastScreenshot !== "" ? dayjs(lastScreenshot).format("hh:MM:ss") : "Never"}</Text>
          {screenshotData.filter((s) => s !== "").length > 0 &&
            <Tabs>
              <TabList>
                {screenshotData.map((_s, i) => {
                  return (
                    <Tab key={`tab_${i}`} fontSize={"x-small"} fontWeight={"semibold"} color={"gray.600"}>Display: {i}</Tab>
                  )
                })}
              </TabList>

              <TabPanels>
                {screenshotData.map((s, i) => {
                  return (
                    <TabPanel key={`tab_panel_${i}`}>
                      <img src={s} width={600} />
                    </TabPanel>
                  )
                })}
              </TabPanels>
            </Tabs>
          }
          {screenshotData.length === 0 &&
            <Flex h={"400px"} w={"100%"} bg={"black"} align={"center"} justify={"center"}>
              {headsetState !== "connected" && <Text color={"white"}>Display Offline</Text>}
            </Flex>
          }
        </Flex>
        <Flex w={"40%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"} maxH={"70vh"}>
          <Flex w={"100%"} direction={"row"} align={"center"}>
            <Heading size={"lg"}>Headset Status</Heading>
          </Flex>
          <Text color={"gray.500"} fontSize={"sm"}>Last Updated: {lastStatus !== "" ? dayjs(lastStatus).format("hh:MM:ss") : "Never"}</Text>
          <Heading size={"sm"}>Status</Heading>
          <Text>Active block: {activeBlock}</Text>
          <Heading size={"sm"}>Logs</Heading>
          <VStack
            border={"1px"}
            borderColor={"gray.200"}
            rounded={"md"}
            p={"2"}
            spacing={"1"}
            align={"stretch"}
            h={"100%"}
            bg={"gray.50"}
            overflowY={"auto"}
            flexDirection={"column-reverse"}
          >
            {systemLogs.length === 0 && <Text fontSize={"x-small"} fontWeight={"semibold"} color={"gray.600"}>Waiting for log output...</Text>}
            {systemLogs.length > 0 && systemLogs.map((log, index) => {
              return (
                <StackItem key={`log_${index}`}>
                  <Text fontSize={"x-small"}>{log}</Text>
                </StackItem>
              );
            })}
          </VStack>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default App
