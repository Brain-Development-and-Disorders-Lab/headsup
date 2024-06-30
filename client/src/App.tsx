import { Button, Flex, FormControl, Heading, Input, Select, Spacer, StackItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, useToast } from "@chakra-ui/react";
import { CheckCircleIcon, InfoIcon, WarningIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { request } from "./util";
import dayjs from "dayjs";

// Custom types
type HeadsetState = {
  "active_block": string,
  "current_trial": string,
  "total_trials": string,
  "device_name": string,
  "device_model": string,
  "device_battery": string,
};

// Timing constants
const DEFAULT_TIMEOUT = 5000; // Milliseconds

/**
 * Utility function to validate if a value IP address has been specified
 * @param {string} address Specified IP address
 * @return {boolean}
 */
const validAddress = (address: string): boolean => {
  // https://stackoverflow.com/a/27434991
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(address) || address === "localhost";
};

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
  const [savedConnections, setSavedConnections] = useState([] as { address: string, port: number }[]);

  // Screenshot details
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState("");
  const [screenshotData, setScreenshotData] = useState([] as string[]);

  // Status details
  const [statusInterval, setStatusInterval] = useState(-1);
  const [lastStatus, setLastStatus] = useState("");
  const [activeBlock, setActiveBlock] = useState("Inactive");
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [fixationRequired, setFixationRequired] = useState(true);

  // Device details
  const [deviceName, setDeviceName] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceBattery, setDeviceBattery] = useState(0.0);

  // Logs
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

  // Load the saved connections on page load
  useEffect(() => {
    const storage = localStorage.getItem("headsup");
    if (storage) {
      setSavedConnections( JSON.parse(storage));
    }
  }, []);

  // Listen for changes in connection state
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
    const response = await request<any>("http://" + address + ":" + port.toString() + "/active", { timeout: DEFAULT_TIMEOUT * 2 });
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
        description: `Could not connect to headset`,
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
        description: `Connected to headset`,
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
        description: `Could not connect to headset`,
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
   * Handles saving a valid connection
   */
  const saveConnection = () => {
    const storage = localStorage.getItem("headsup");
    if (storage) {
      // Extract saved connections
      const allSavedConnections: { address: string, port: number }[] = JSON.parse(storage);
      const currentConnection = {
        address: address,
        port: port,
      };

      const matchingConnections = allSavedConnections.filter((connection) => {
        return connection.address === currentConnection.address && connection.port === currentConnection.port;
      });
      if (matchingConnections.length === 0) {
        // Only add the connection if it hasn't already been saved
        allSavedConnections.push(currentConnection);
        localStorage.setItem("headsup", JSON.stringify(allSavedConnections));
        setSavedConnections(allSavedConnections);
        toast({
          status: "success",
          title: "Saved",
          description: "Connection saved",
          duration: 2000,
          isClosable: true,
          position: "bottom-right",
        });
      } else {
        toast({
          status: "warning",
          title: "Connection Exists",
          description: "Connection already saved",
          duration: 2000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    } else {
      // Create a new list of connections with the new connection
      const currentConnection = [{
        "address": address,
        "port": port,
      }];
      localStorage.setItem("headsup", JSON.stringify(currentConnection));
      setSavedConnections(currentConnection);
      toast({
        status: "success",
        title: "Saved",
        description: "Connection saved",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }
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
        description: `Lost connection to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }
    setHeadsetState("disconnected");
    setActiveBlock("Inactive");
    setFixationRequired(true);
    setCurrentTrial(0);
    setTotalTrials(0);
    setDeviceBattery(0.0);
  };

  /**
   * Retrieve the status values from the headset
   */
  const refreshStatus = async () => {
    const response = await request<HeadsetState>("http://" + address + ":" + port.toString() + "/status", { timeout: DEFAULT_TIMEOUT });
    if (response.success) {
      setLastStatus(new Date().toLocaleString());

      // Extract status data from response
      setActiveBlock(response.data.active_block);
      setCurrentTrial(parseInt(response.data.current_trial));
      setTotalTrials(parseInt(response.data.total_trials));

      // Extract device information from response
      setDeviceName(response.data.device_name);
      setDeviceModel(response.data.device_model);
      setDeviceBattery(parseFloat(response.data.device_battery));
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset`,
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
    const response = await request<any>("http://" + address + ":" + port.toString() + "/logs", { timeout: DEFAULT_TIMEOUT });
    if (response.success) {
      if (response.data.length > 0) {
        setSystemLogs(systemLogs => [...response.data.reverse(), ...systemLogs] );
      }
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * Retrieve screenshots of the headset displays
   */
  const getScreenshot = async () => {
    setScreenshotLoading(true);
    const response = await request<any>("http://" + address + ":" + port.toString() + "/screen", { timeout: DEFAULT_TIMEOUT });
    setScreenshotLoading(false);
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
        description: `Could not connect to headset"`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * End the experiment
   */
  const endExperiment = async () => {
    const response = await request<HeadsetState>("http://" + address + ":" + port.toString() + "/kill", { timeout: DEFAULT_TIMEOUT });
    if (response.success) {
      toast({
        status: "success",
        title: "Experiment Ended",
        description: `Ended experiment successfully`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * Enable the fixation requirement remotely
   */
  const enableFixation = async () => {
    const response = await request<HeadsetState>("http://" + address + ":" + port.toString() + "/fixation/enable", { timeout: DEFAULT_TIMEOUT });
    if (response.success) {
      setFixationRequired(true);
      toast({
        status: "success",
        title: "Enabled Fixation",
        description: `Requirement for fixation enabled`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * Disable the fixation requirement remotely
   */
  const disableFixation = async () => {
    const response = await request<HeadsetState>("http://" + address + ":" + port.toString() + "/fixation/disable", { timeout: DEFAULT_TIMEOUT });
    if (response.success) {
      setFixationRequired(false);
      toast({
        status: "success",
        title: "Disabled Fixation",
        description: `Requirement for fixation disabled`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } else {
      toast({
        status: "error",
        title: "Connectivity Error",
        description: `Could not connect to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      setConnected(false);
    }
  };

  /**
   * Toggle the fixation requirement
   */
  const toggleFixation = async () => {
    if (fixationRequired === true) {
      await disableFixation();
    } else {
      await enableFixation();
    }
  };

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Flex w={"100%"} align={"center"}>
        <Heading>Headsup</Heading>
        <Spacer />
        <Flex direction={"column"} minW={"12%"} p={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"}>
          {headsetState === "connected" &&
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <CheckCircleIcon color={"green.600"} />
              <Text fontSize={"small"} color={"green.600"}>Headset connected</Text>
            </Flex>
          }
          {headsetState === "online" &&
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <InfoIcon color={"green.600"} />
              <Text fontSize={"small"} color={"green.600"}>Headset online</Text>
            </Flex>
          }
          {headsetState === "disconnected" &&
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <WarningIcon color={"red"} />
              <Text fontSize={"small"} color={"red.600"}>Headset offline</Text>
            </Flex>
          }
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Name:</Text>
            <Text fontSize={"small"} color={"gray.600"}>
              {connected ? deviceName : "Offline"}
            </Text>
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Model:</Text>
            <Text fontSize={"small"} color={"gray.600"}>
              {connected ? deviceModel : "Offline"}
            </Text>
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Battery:</Text>
            {connected &&
              <Text fontSize={"small"} color={deviceBattery > 0.5 ? "green.600" : "orange.600"}>
                {`${Math.round(deviceBattery * 100)}%`}
              </Text>
            }
            {!connected &&
              <Text fontSize={"small"} color={"gray.600"}>
                Offline
              </Text>
            }
          </Flex>
        </Flex>
      </Flex>
      <Flex w={"100%"} direction={"row"} gap={"2"}>
        {!connected &&
          <Flex maxW={"20%"}>
            <Select
              placeholder={"Saved connections"}
              isDisabled={savedConnections.length === 0 || connected || connectivityLoading || connectionLoading}
              onChange={(event) => {
                const selected = event.target.selectedIndex;
                if (selected > 0 && selected <= savedConnections.length) {
                  const selectedConnection = savedConnections[selected - 1];
                  setAddress(selectedConnection.address);
                  setPort(selectedConnection.port);
                }
              }}
            >
              {savedConnections.map((connection) => {
                return <option key={`${connection.address}:${connection.port}`}>http://{connection.address}:{connection.port}</option>
              })}
            </Select>
          </Flex>
        }
        <FormControl isInvalid={invalidInput}>
          <Flex gap={"2"}>
            <Flex maxW={"60%"} gap={"2"}>
              <Input placeholder={"Headset Local IP Address"} value={address} onChange={updateAddress} isDisabled={connectionLoading || connectivityLoading || connected} />
              <Input w={"20%"} type={"number"} placeholder={"Port"} value={port} onChange={updatePort} isDisabled={connectionLoading || connectivityLoading || connected} />
            </Flex>
            {!connected &&
              <Button
                colorScheme={"blue"}
                isDisabled={invalidInput || connectivityLoading || connectionLoading}
                onClick={saveConnection}
              >
                Save
              </Button>
            }
            <Spacer />
            {!connected &&
              <Button
                isDisabled={invalidInput || connectionLoading || connected}
                isLoading={connectivityLoading}
                loadingText={"Testing..."}
                onClick={testConnectivity}
              >
                Test
              </Button>
            }
            {!connected &&
              <Button
                colorScheme={"green"}
                isDisabled={invalidInput || connected}
                isLoading={connectionLoading}
                loadingText={"Connecting..."}
                onClick={connect}
              >
                Connect
              </Button>
            }
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
            <Flex direction={"column"} gap={"1"}>
              <Heading size={"md"}>Display Screenshots</Heading>
              <Flex gap={"1"} align={"center"}>
                <WarningIcon color={"orange.400"} />
                <Text color={"orange.400"} fontWeight={"semibold"} fontSize={"x-small"}>Screenshots will impact performance</Text>
              </Flex>
            </Flex>
            <Spacer />
            <Button
              colorScheme={"blue"}
              isDisabled={!connected}
              isLoading={screenshotLoading}
              onClick={getScreenshot}
            >
              Capture
            </Button>
          </Flex>
          <Text color={"gray.500"} fontSize={"sm"}>Last Updated: {lastScreenshot !== "" ? dayjs(lastScreenshot).format("hh:mm:ss") : "Never"}</Text>
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
                      <img src={s} width={"auto"} />
                    </TabPanel>
                  )
                })}
              </TabPanels>
            </Tabs>
          }
          {screenshotData.length === 0 &&
            <Flex h={"400px"} w={"100%"} bg={"black"} align={"center"} justify={"center"}>
              {headsetState !== "connected" && <Text color={"white"}>Offline</Text>}
            </Flex>
          }
        </Flex>
        <Flex w={"40%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"} maxH={"70vh"}>
          <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"} justify={"center"}>
            <Heading size={"sm"}>Actions</Heading>
            <Spacer />
          </Flex>
          <Flex direction={"row"} gap={"2"}>
            <Button
              colorScheme={"blue"}
              isDisabled={!connected}
              onClick={toggleFixation}
            >
              {fixationRequired ? "Disable " : "Enable "}
              Fixation
            </Button>
            <Button
              colorScheme={"red"}
              isDisabled={!connected}
              onClick={endExperiment}
            >
              End Experiment
            </Button>
          </Flex>
          <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"} justify={"center"}>
            <Heading size={"sm"}>Status</Heading>
            <Spacer />
            <Text color={"gray.500"} fontSize={"sm"}>Last Updated: {lastStatus !== "" ? dayjs(lastStatus).format("hh:mm:ss") : "Never"}</Text>
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Active block:</Text>
            <Text fontSize={"small"} color={"gray.600"}>{activeBlock}</Text>
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Current trial:</Text>
            <Text fontSize={"small"} color={"gray.600"}>{currentTrial} / {totalTrials}</Text>
            <Spacer />
            <Text fontSize={"small"} color={"gray.600"}>{currentTrial > 0 ? Math.round(currentTrial / totalTrials * 100) : 0}% complete</Text>
          </Flex>
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
