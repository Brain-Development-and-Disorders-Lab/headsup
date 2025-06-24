# Headsup Unity Components

## Server Component

`HeadsupServer.cs` implements a WebSocket server on the headset for real-time communication with the client control panel (default address: `localhost:4444`). The server handles the following message types:

* `active`: Returns a boolean indicating if the server is responsive
* `status`: Sends a JSON object containing experiment status from ExperimentManager
* `logs`: Streams Unity console output to the client
* `screenshot`: Captures and sends the current camera view from all capture sources
* `enable_fixation`/`disable_fixation`: Toggles the fixation requirement
* `start_task`: Continue from the initial fit screen
* `start_calibration`: Begin the eye-tracking calibration process
* `kill`: Safely terminates the experiment

`HeadsupServer.cs` should be attached to a GameObject in the scene that also has an `ExperimentManager` component. The server automatically manages WebSocket connections and message handling.

## Screenshot Component

`CaptureManager.cs` provides screenshot functionality for the VR headset. It should be attached to the main camera in the scene. The component features:

* Configurable capture settings:
  - Resolution (default: 1280x720)
  - Image format (JPG/PNG)
  - Optional file saving
  - Optional object hiding during capture

* Public methods:
  - `CaptureScreenshot()`: Triggers a screenshot capture
  - `GetLastScreenshot()`: Returns the most recent screenshot as a byte array

* Performance optimizations:
  - Reuses render textures for multiple captures
  - Optional cleanup after capture
  - Configurable object hiding during capture

## Setup Instructions

1. Add `HeadsupServer.cs` to a GameObject in your scene that has an `ExperimentManager` component
2. Attach `CaptureManager.cs` to your main camera
3. Configure the capture settings in the Unity Inspector:
   - Set desired resolution
   - Choose image format
   - Configure save settings if needed
   - Set optional object to hide during capture

## Notes

* Tested on a Meta Quest Pro headset
* Screenshots are captured at the configured resolution and maintain aspect ratio
* Screenshot capture may cause a brief performance impact

## Dependencies

* Unity 2020.3 or higher
* `WebSocketSharp` library for Unity
* `Camera` component for screenshot capture
* `ExperimentManager` component for experiment status

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
