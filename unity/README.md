# Headsup Monitoring Package

Unity Package Manager (UPM) package for real-time monitoring and control of VR experiments. Provides WebSocket-based communication, screenshot capture, and experiment management integration for behavioral research.

## Installation

### Via Git URL (Recommended)

1. Open Unity Package Manager (Window > Package Manager)
2. Click the "+" button in the top-left corner
3. Select "Add package from git URL"
4. Enter: `https://github.com/Brain-Development-and-Disorders-Lab/headsup.git?path=/unity`
5. Click "Add"

Unity will automatically install the package and its dependencies (Newtonsoft.Json).

### Via Local Path

1. Clone this repository to your local machine
2. Open Unity Package Manager (Window > Package Manager)
3. Click the "+" button and select "Add package from disk"
4. Navigate to the `unity` folder and select `package.json`
5. Click "Open"

## Quick Start

### 1. Install Dependencies

The package requires two external dependencies:

- **Newtonsoft.Json** - Automatically installed via Unity Package Manager
- **WebSocketSharp** - Must be installed manually (see [Dependencies](#dependencies) section below)

### 2. Implement Interfaces

Add the Headsup interfaces to your experiment manager:

```csharp
using Headsup.Monitoring;
using System.Collections.Generic;

public class YourExperimentManager : MonoBehaviour, IHeadsupExperimentManager
{
    public void ForceEnd() { /* Your implementation */ }

    public Dictionary<string, string> GetExperimentStatus()
    {
        return new Dictionary<string, string>
        {
            { "active_block", currentBlock.ToString() },
            { "trial_number", currentTrial.ToString() }
        };
    }

    public void StartTask() { /* Your implementation */ }
    public void StartCalibration() { /* Your implementation */ }
}
```

### 3. Add Components to Scene

1. Add `HeadsupServer` component to a GameObject in your scene
2. Add `CaptureManager` component to your camera(s)
3. In the HeadsupServer inspector:
   - Set Port (default: 4444)
   - Assign CaptureManager(s) to Capture Sources
   - Assign your experiment manager GameObject
   - Optionally assign your gaze manager GameObject

### 4. Connect with Client

Run the Python Headsup client from the `/client` folder to connect to your Unity application.

## Package Components

### HeadsupServer

WebSocket server for real-time communication (default port: 4444). Handles commands:

- `active` - Returns server responsive status
- `status` - Broadcasts experiment status from IHeadsupExperimentManager
- `logs` - Streams Unity console output
- `screenshot` - Captures and sends camera views
- `enable_fixation`/`disable_fixation` - Controls fixation requirements via IHeadsupGazeManager
- `start_task` - Triggers task start via IHeadsupExperimentManager
- `start_calibration` - Initiates calibration via IHeadsupExperimentManager
- `kill` - Safely terminates experiment via IHeadsupExperimentManager

### CaptureManager

Screenshot capture system for VR cameras. Features:

- Configurable resolution (default: 1280x720)
- Multiple image formats (JPG/PNG)
- Optional file saving
- Performance optimizations (render texture reuse)
- Public API: `CaptureScreenshot()`, `GetLastScreenshot()`

### Interfaces

- `IHeadsupExperimentManager` - Integrate your experiment controller
- `IHeadsupGazeManager` - Integrate your eye-tracking system (optional)

## Sample

Import the "Basic Setup Example" sample from Package Manager to see a working implementation with example scripts.

## Dependencies

### Automatic Dependencies

- **Newtonsoft.Json** (3.2.1+) - Automatically installed via Unity Package Manager

### Manual Dependencies

- **WebSocketSharp-netstandard** - Must be installed manually:
  1. Download the NuGet package: [WebSocketSharp-netstandard](https://www.nuget.org/packages/WebSocketSharp-netstandard/)
  2. Extract the DLL from the package
  3. Place `websocket-sharp.dll` in your project's `Assets/Plugins/` folder
  4. Alternative: Use NuGetForUnity to install the package

### Unity Version

- Unity 2020.3 or higher

## Documentation

For detailed setup instructions and API documentation, see:
- [Documentation~/setup-guide.md](Documentation~/setup-guide.md) - Step-by-step integration guide
- [Documentation~/index.md](Documentation~/index.md) - Complete API reference
- [Samples~/BasicSetup/README.md](Samples~/BasicSetup/README.md) - Sample usage guide

## Platform Support

- Tested on Meta Quest Pro
- Compatible with Android VR platforms
- Windows Editor support

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
