import { Button, Flex, FormControl, Heading, Input, Link, Progress, Select, Spacer, Spinner, StackItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, useToast } from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { useEffect, useState, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import dayjs from "dayjs";
import consola from "consola";

// Custom types
type HeadsetState = {
  "active_block": string,
  "current_trial": string,
  "total_trials": string,
  "device_name": string,
  "device_model": string,
  "device_battery": string,
};

type HeadsetMessage = {
  type: "status" | "logs",
  data: string,
};

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

  // Connection details and state
  const [address, setAddress] = useState("localhost");
  const [port, setPort] = useState(4444);
  const [scrcpyCommand, setScrcpyCommand] = useState(`scrcpy --video-codec=h265 -m1920 --max-fps=60 --no-audio -K`);
  const [isEditing, setIsEditing] = useState(false);

  // WebSocket state
  const [socketUrl, setSocketUrl] = useState("ws://" + address + ":" + port.toString());
  const [, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => {
      return true;
    },
  });

  // Connectivity and status update states
  const [connected, setConnected] = useState(false);

  // Connectivity details
  const [headsetState, setHeadsetState] = useState("connecting" as "connected" | "connecting");
  const [savedConnections, setSavedConnections] = useState([] as { address: string, port: number }[]);

  // Screenshot details
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState("");
  const [screenshotData, setScreenshotData] = useState([] as string[]);

  // Status details
  const [lastStatus, setLastStatus] = useState("");
  const [currentBlock, setCurrentBlock] = useState("Inactive");
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
  const updateAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInvalidInput(!validAddress(event.target.value));
    setAddress(event.target.value);

    if (event.target.value !== "localhost") {
      setScrcpyCommand(`scrcpy --video-codec=h265 -m1920 --max-fps=60 --no-audio -K --tcpip=${event.target.value}`);
    } else {
      setScrcpyCommand(`scrcpy --video-codec=h265 -m1920 --max-fps=60 --no-audio -K`);
    }
  };
  const updatePort = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInvalidInput(isNaN(parseInt(event.target.value)) || parseInt(event.target.value) > 9999 || parseInt(event.target.value) < 0);
    setPort(parseInt(event.target.value));
  };

  // Store incoming messages
  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
      handleMessage(lastMessage.data);
    }
  }, [lastMessage]);

  // Load the saved connections on page load
  useEffect(() => {
    const storage = localStorage.getItem("headsup");
    if (storage) {
      setSavedConnections( JSON.parse(storage));
    }
  }, []);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setConnected(true);
      setHeadsetState("connected");

      toast({
        status: "success",
        title: "Connected",
        description: `Connected to headset`,
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
      consola.success("Connected to headset");
    } else {
      setConnected(false);
      setHeadsetState("connecting");
    }
  }, [readyState]);

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
   * Handle incoming messages from the headset
   * @param {MessageEvent<any>} message Message from the headset
   */
  const handleMessage = (raw: string) => {
    try {
      const message = JSON.parse(raw) as HeadsetMessage;
      if (message.type === "status") {
        const data = JSON.parse(message.data) as HeadsetState;
        setLastStatus(new Date().toLocaleString());

        // Extract status data from response
        setCurrentBlock(data.active_block);
        setCurrentTrial(parseInt(data.current_trial));
        setTotalTrials(parseInt(data.total_trials));

        // Extract device information from response
        setDeviceName(data.device_name);
        setDeviceModel(data.device_model);
        setDeviceBattery(parseFloat(data.device_battery));
      } else if (message.type === "logs") {
        setSystemLogs(systemLogs => [JSON.parse(message.data), ...systemLogs] );
      } else if (message.type === "screenshot") {
        const data = JSON.parse(message.data) as string[];
        if (data.length > 0 && data.filter((s: string) => s !== "").length > 0) {
          const screenshots = [];
          for (const encoded of data) {
            screenshots.push(`data:image/jpeg;base64,${encoded}`);
          }
          setScreenshotData(screenshots);
          setLastScreenshot(new Date().toLocaleString());
        }
        setScreenshotLoading(false);
      }
    } catch (error) {
      consola.error("Failed to parse message:", error);
    }
  };

  /**
   * Retrieve screenshots of the headset displays
   */
  const getScreenshot = async () => {
    setScreenshotLoading(true);
    sendMessage("screenshot");
  };

  /**
   * End the experiment
   */
  const endExperiment = async () => {
    sendMessage("kill");
  };

  /**
   * Enable the fixation requirement remotely
   */
  const enableFixation = async () => {
    sendMessage("enable_fixation");
    setFixationRequired(true);
  };

  /**
   * Disable the fixation requirement remotely
   */
  const disableFixation = async () => {
    sendMessage("disable_fixation");
    setFixationRequired(false);
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

  /**
   * Handle clicking the "Edit" button
   */
  const onEditClick = useCallback(() => {
    setIsEditing(!isEditing);
    setSocketUrl("ws://" + address + ":" + port.toString());
  }, [isEditing, address, port]);

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Flex w={"100%"} align={"center"}>
        <Flex direction={"column"} gap={"2"}>
          <Heading>Headsup</Heading>
          <Text fontSize={"sm"} color={"gray.400"} fontWeight={"semibold"}>Monitor and manage VR experiments from the browser</Text>
        </Flex>
        <Spacer />
        <Flex direction={"column"} minW={"12%"} p={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"}>
          {headsetState === "connected" &&
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <CheckCircleIcon color={"green.600"} />
              <Text fontSize={"small"} color={"green.600"}>Headset connected</Text>
            </Flex>
          }
          {headsetState === "connecting" &&
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Spinner size={"sm"} color={"orange.600"} />
              <Text fontSize={"small"} color={"orange.600"}>Headset connecting</Text>
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
        <Flex maxW={"20%"}>
          <Select
            placeholder={"Saved connections"}
            value={"Saved connections"}
            isDisabled={savedConnections.length === 0 || !isEditing}
            size={"sm"}
            rounded={"md"}
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
        <FormControl isInvalid={invalidInput}>
          <Flex gap={"2"}>
            <Flex maxW={"60%"} gap={"2"}>
              <Input placeholder={"Headset Local IP Address"} value={address} onChange={updateAddress} size={"sm"} rounded={"md"} isDisabled={!isEditing} />
              <Input w={"20%"} type={"number"} placeholder={"Port"} value={port} onChange={updatePort} size={"sm"} rounded={"md"} isDisabled={!isEditing} />
            </Flex>
            <Button
              size={"sm"}
              colorScheme={isEditing ? "green" : "gray"}
              onClick={onEditClick}
            >
              {isEditing ? "Done" : "Edit"}
            </Button>
            <Button
              size={"sm"}
              colorScheme={"blue"}
              isDisabled={invalidInput}
              onClick={saveConnection}
            >
              Save Details
            </Button>
          </Flex>
        </FormControl>
      </Flex>
      <Flex direction={"row"} gap={"2"}>
        <Flex w={"60%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"}>
          <Flex align={"center"}>
            <Flex direction={"column"} gap={"1"}>
              <Heading size={"sm"}>Headset Display</Heading>
              <Flex gap={"1"} align={"center"}>
                <WarningIcon color={"orange.400"} />
                <Text color={"orange.400"} fontWeight={"semibold"} fontSize={"x-small"}>Capturing screenshots will impact performance</Text>
              </Flex>
            </Flex>
            <Spacer />
            <Button
              size={"sm"}
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
              {headsetState !== "connected" && <Text color={"white"} fontWeight={"semibold"}>Waiting for headset...</Text>}
              {headsetState === "connected" && <Text color={"white"} fontWeight={"semibold"}>Use the "Capture" button to retrieve screenshots of the headset displays</Text>}
            </Flex>
          }
          {/* Provide command to stream live video using `scrcpy` tool */}
          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Text fontSize={"xs"} color={"gray.600"} fontWeight={"semibold"}><Link href={"https://github.com/Genymobile/scrcpy"}>scrcpy</Link>:</Text>
            <Flex w={"100%"} gap={"2"}>
              <Input
                type={"text"}
                readOnly
                value={scrcpyCommand}
                size={"sm"}
                rounded={"md"}
              />
              <Button
                size={"sm"}
                colorScheme={"blue"}
                onClick={() => {
                  navigator.clipboard.writeText(scrcpyCommand);
                  toast({
                    title: "Copied",
                    description: "`scrcpy` command copied to clipboard",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                    position: "bottom-right",
                  });
                }}
              >
                Copy
              </Button>
            </Flex>
          </Flex>
        </Flex>
        <Flex w={"40%"} direction={"column"} gap={"2"} border={"1px"} borderColor={"gray.200"} rounded={"md"} p={"2"} maxH={"70vh"}>
          <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"} justify={"center"}>
            <Heading size={"sm"}>Headset Status</Heading>
            <Spacer />
            <Text color={"gray.500"} fontSize={"sm"}>Last Updated: {lastStatus !== "" ? dayjs(lastStatus).format("hh:mm:ss") : "Never"}</Text>
          </Flex>
          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Progress rounded={"md"} w={"100%"} colorScheme={"green"} size={"sm"} value={currentTrial > 0 ? Math.round(currentTrial / totalTrials * 100) : 0} />
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Current trial:</Text>
            <Text fontSize={"small"} color={"gray.600"}>{currentTrial} / {totalTrials} ({currentTrial > 0 ? Math.round(currentTrial / totalTrials * 100) : 0}% complete)</Text>
          </Flex>
          <Flex direction={"row"} gap={"1"}>
            <Text fontSize={"small"} fontWeight={"semibold"} color={"gray.600"}>Current block:</Text>
            <Text fontSize={"small"} color={"gray.600"}>{currentBlock}</Text>
          </Flex>
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
          <Flex direction={"row"} gap={"2"}>
            <Button
              size={"sm"}
              colorScheme={"blue"}
              isDisabled={!connected}
              onClick={toggleFixation}
            >
              {fixationRequired ? "Disable " : "Enable "}
              Fixation
            </Button>
            <Button
              size={"sm"}
              colorScheme={"red"}
              isDisabled={!connected}
              onClick={endExperiment}
            >
              End Experiment
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default App
