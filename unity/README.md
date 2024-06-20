# Headsup - Unity

> [!IMPORTANT]
> Headsup has been tested only with Unity 2022.3 and a Meta Quest Pro headset.

`HeadsupServer.cs` acts as a server on the headset, listening for requests from the client dashboard (default address is `localhost:4444`). The server supports multiple paths:

* `/active`: Returns `true` if the headset is active and the Unity application is running
* `/status`: Returns a JSON object containing information about task progress and device battery.
* `/logs`: Returns a list of strings with the most recent logger output.
* `/screen`: Returns a list of strings, one for each active display, encoding a screenshot using base64 to be turned into a JPG by the client dashboard.

`HeadsupServer.cs` should be attached to another `GameObject` in the scene and the `Prefix` value can be updated if required.

`CaptureManager.cs` is a utility class to manage capturing screenshots and saving the generated images. It exposes the following public methods:

* `CaptureScreenshot`: Trigger a screenshot to be captured.
* `GetLastScreenshot`: After capturing a screenshot, returns a `byte[]` array containing the data from the most recent screenshot.

`CaptureManager.cs` should be attached to every `Camera` instance to capture from. Each `CaptureManager.cs` instance added as a `Capture Source` under the `HeadsupServer.cs`.

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
