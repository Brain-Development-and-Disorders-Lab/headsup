import { Button, Flex, FormControl, Heading, Input, Text } from '@chakra-ui/react'
import { CheckCircleIcon, RepeatIcon, WarningIcon } from '@chakra-ui/icons'
import { useState } from 'react';

const validIP = (ip: string): boolean => {
  // https://stackoverflow.com/a/27434991
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

const App = () => {
  // Input states
  const [invalidInput, setInvalidInput] = useState(false);

  // Connectivity and status update states
  const [connected, setConnected] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState("Never");
  const [lastStatus, setLastStatus] = useState("Never");
  const [address, setAddress] = useState("192.168.0.1")

  // Response states
  const [elapsedTime, setElapsedTime] = useState(0.0);
  const [activeBlock, setActiveBlock] = useState("Inactive");

  const updateAddress = (event: any) => {
    setInvalidInput(!validIP(event.target.value));
    setAddress(event.target.value);
  };

  return (
    <Flex w={"100%"} minH={"100vh"} direction={"column"} gap={"4"} p={"4"}>
      <Heading>Headsup :: Headset</Heading>
      <Flex w={"60%"}>
        <FormControl isInvalid={invalidInput}>
          <Flex w={"100%"} direction={"row"} gap={"2"}>
            <Flex w={"60%"}>
              <Input placeholder={"Headset Local IP Address"} value={address} onChange={updateAddress} />
            </Flex>
            <Button colorScheme={"green"} leftIcon={<RepeatIcon />} isDisabled={invalidInput}>
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
            <Button colorScheme={"blue"} isDisabled={!connected}>Refresh</Button>
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
