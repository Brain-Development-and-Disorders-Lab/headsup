# Headsup Unity Package

Unity Package Manager (UPM) package for integrating real-time monitoring and remote control into VR experiments. Provides WebSocket-based communication, screenshot capture, and experiment management interfaces for behavioral research applications.

## Installation

### Via Git URL (Recommended)

1. Open Unity Package Manager (Window > Package Manager)
2. Click "+" and select "Add package from git URL"
3. Enter: `https://github.com/Brain-Development-and-Disorders-Lab/headsup.git?path=/unity`
4. Click "Add"

Unity automatically installs the package and Newtonsoft.Json dependency.

### Via Local Path

1. Clone the repository
2. Open Unity Package Manager (Window > Package Manager)
3. Click "+" and select "Add package from disk"
4. Navigate to the `unity` folder and select `package.json`

## Dependencies

**Automatic:**

- Newtonsoft.Json (3.2.1+) - installed via Unity Package Manager

**Manual:**

- WebSocketSharp-netstandard - required for WebSocket functionality (Alternative: Install via NuGetForUnity)
  1. Download from [NuGet](https://www.nuget.org/packages/WebSocketSharp-netstandard/)
  2. Extract DLL from package
  3. Place `websocket-sharp.dll` in `Assets/Plugins/`

**Unity Version:**

- Unity 2020.3 or higher

## Integration

### 1. Implement Required Interfaces

Add Headsup interfaces to your experiment manager:

```csharp
using Headsup.Monitoring;
using System.Collections.Generic;

public class YourExperimentManager : MonoBehaviour, IHeadsupExperimentManager
{
    public void ForceEnd()
    {
        // Force terminate experiment
    }

    public Dictionary<string, string> GetExperimentStatus()
    {
        return new Dictionary<string, string>
        {
            { "active_block", currentBlock.ToString() },
            { "trial_number", currentTrial.ToString() }
            // Add custom status fields as needed
        };
    }

    public void StartTask()
    {
        // Start experiment task
    }

    public void StartCalibration()
    {
        // Start calibration sequence
    }
}
```

Optionally implement `IHeadsupGazeManager` for eye-tracking integration.

### 2. Add Components to Scene

1. Add `HeadsupServer` component to a GameObject
2. Add `CaptureManager` component to VR camera(s)
3. Configure HeadsupServer inspector:
   - Set port (default: 4444)
   - Assign CaptureManager(s) to Capture Sources
   - Assign experiment manager GameObject
   - Assign gaze manager GameObject (optional)

### 3. Connect Client

Run the Python client from the repository's `/client` folder to connect and monitor your VR application.

## Components

### HeadsupServer

WebSocket server handling remote commands:

- `active` - Server health check
- `status` - Experiment status from IHeadsupExperimentManager
- `logs` - Unity console log stream
- `screenshot` - Capture camera view
- `enable_fixation` / `disable_fixation` - Control fixation via IHeadsupGazeManager
- `start_task` - Trigger task start
- `start_calibration` - Trigger calibration
- `kill` - Force terminate experiment

### CaptureManager

Screenshot capture system:

- Configurable resolution (default: 1280x720)
- Image formats: JPG, PNG
- Optional file saving
- Optimized render texture reuse
- Public API: `CaptureScreenshot()`, `GetLastScreenshot()`

### Interfaces

- `IHeadsupExperimentManager` - Required for experiment integration
- `IHeadsupGazeManager` - Optional for eye-tracking integration

## Sample Usage

The package includes a "Basic Setup Example" demonstrating a complete integration.

### Import the Sample

1. Open Unity Package Manager (Window > Package Manager)
2. Find "Headsup Monitoring" in the package list
3. Expand the "Samples" section
4. Click "Import" next to "Basic Setup Example"

### Sample Contents

The sample includes:

- `ExampleExperimentManager.cs` - Reference implementation of IHeadsupExperimentManager
- `ExampleGazeManager.cs` - Reference implementation of IHeadsupGazeManager

### Using the Sample

After importing:

1. Open your scene
2. Create a GameObject and add `ExampleExperimentManager` component
3. Add `HeadsupServer` component to the same GameObject
4. Add `CaptureManager` to your camera
5. Configure HeadsupServer inspector:
   - Assign the GameObject to Experiment Manager Object
   - Assign CaptureManager(s) to Capture Sources
6. Press Play to test

The example scripts demonstrate proper interface implementation and can be adapted for your experiment needs.

## Documentation

- [Documentation~/setup-guide.md](Documentation~/setup-guide.md) - Step-by-step integration guide
- [Documentation~/index.md](Documentation~/index.md) - Complete API reference

## Platform Support

- Tested: Meta Quest Pro
- Compatible: Android VR platforms

## License

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Contact

**Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)>
