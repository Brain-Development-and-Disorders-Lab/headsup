# Headsup

Headsup is a dashboard tool to remotely monitor and interact with VR headsets over LAN while delivering behavioral experiments to participants.

## Requirements

1. VR application created using Unity. Both `CaptureManager.cs` and `HeadsupServer.cs` must be added to the Unity project and integrated as described in the [README](unity/README.md).
2. Local network without restrictions on peer-to-peer communications. There has been mixed success using private networks (enterprise, research facility) that are centrally administered. A very effective alternative is to purchase an inexpensive router (e.g. [TP-Link Archer AX1500](https://www.tp-link.com/us/home-networking/wifi-router/archer-ax1500/)) and connect all headsets and client dashboard to this network.
3. Knowledge of the local IP address of the VR headset. This can easily be found via the network settings menus, within the Wi-Fi connection details.

## Components

Client: Dashboard UI presenting a screenshot feed and debugging information via a web browser.

Unity: Required Unity scripts for VR applications to stream information.

## Considerations

* Screenshots / streaming of the display content is very limited. Screenshots can be obtained, but capture results in a brief delay in the VR application while the PNG / JPG is processed. This is a technical limitation, this process must be performed on the main thread. Utilizing libraries such as [UnityRenderStreaming](https://github.com/Unity-Technologies/UnityRenderStreaming) has also generated mixed results, with significant framerate instability.

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
