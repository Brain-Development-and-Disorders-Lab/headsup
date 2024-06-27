# Headsup - Client

Client dashboard allowing users to connect to a headset on the local network. Outputs information about the headset status, connectivity status, and provides ability to retrieve screenshots of the current headset display.

## Usage

1. Install dependencies (`yarn`), start the dashboard (`yarn dev`), and open the dashboard at [localhost:5173](http://localhost:5173).
2. Specify an IP address (or `localhost`) and port number (default port is `4444`). This can be tested prior to connecting by clicking `Test`, and the status of the headset will be updated. Optionally click `Save` to store the connection details locally.
3. Click `Connect` to connect to the headset and start receiving status information and logs from the headset.

Click `Disconnect` at any time to disconnect from the headset.

### Screenshots

> [!CAUTION]
> Screenshots have a significant performance impact on the client VR application, resulting in a brief (> 1 second) pause and break in headset tracking.

To capture a screenshot, connect to a headset and click the `Screenshot` button. One screenshot will be returned for each specified capture source in Unity via `CaptureManager.cs`.

> [!WARNING]
> Screenshot functionality is not completely stable. The `Screenshot` button may need to pressed multiple times prior to receiving an updated screenshot.

Screenshots will displayed in a tab interface, one display to each tab. For a VR application, typically `Display 0` and `Display 1` are the left and right eyes respectively.

`End Experiment` acts as a kill-switch, and can be used to end an experiment gracefully, saving experiment data in the process. `Enable Fixation` or `Disable Fixation` is used to toggle the pre-trial central fixation requirement.

Built using [Vite](https://vitejs.dev/), with help from libraries like [Axios](https://axios-http.com/) and [Chakra UI](https://v2.chakra-ui.com/).

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
