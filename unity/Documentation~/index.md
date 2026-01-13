# Headsup Monitoring Package - API Reference

Complete API documentation for the Headsup Monitoring Unity package.

## Package Overview

**Package Name**: `com.headsup.monitoring`
**Version**: 1.0.0
**Namespace**: `Headsup.Monitoring`
**Unity Version**: 2020.3+

The Headsup Monitoring package provides real-time monitoring and control capabilities for Unity VR applications, enabling researchers to remotely monitor and control experiments running on VR headsets.

## Core Components

### HeadsupServer

WebSocket server component for real-time communication with the Headsup Python client.

**Namespace**: `Headsup.Monitoring`
**Inherits**: `MonoBehaviour`

#### Inspector Fields

- **Capture Sources** (`CaptureManager[]`) - Array of CaptureManager components to retrieve screenshots from
- **Port** (`int`) - Network port to listen on (default: 4444)
- **Experiment Manager Object** (`GameObject`) - GameObject with IHeadsupExperimentManager implementation (optional)
- **Gaze Manager Object** (`GameObject`) - GameObject with IHeadsupGazeManager implementation (optional)
- **Update Interval** (`float`) - How often to broadcast status updates in seconds (default: 1.0)

#### Usage

```csharp
// Add to a GameObject in your scene
gameObject.AddComponent<HeadsupServer>();

// Configure in inspector or via code
var server = GetComponent<HeadsupServer>();
server.port = 4444;
```

#### Supported Commands

The server responds to the following WebSocket messages:

- **active** - Returns `true` if server is responsive
- **status** - Broadcasts experiment status from IHeadsupExperimentManager
- **logs** - Streams Unity console output to connected clients
- **screenshot** - Captures and returns screenshots from all capture sources
- **enable_fixation** - Calls `IHeadsupGazeManager.SetRequireFixation(true)`
- **disable_fixation** - Calls `IHeadsupGazeManager.SetRequireFixation(false)`
- **start_task** - Calls `IHeadsupExperimentManager.StartTask()`
- **start_calibration** - Calls `IHeadsupExperimentManager.StartCalibration()`
- **kill** - Calls `IHeadsupExperimentManager.ForceEnd()`

#### Graceful Degradation

The server will continue to function even if IHeadsupExperimentManager or IHeadsupGazeManager implementations are not available. When optional components are missing:

- Commands requiring those components will log warnings and return error messages
- Status broadcasts will indicate "no_experiment_manager" if IHeadsupExperimentManager is unavailable
- The server will still handle screenshot and active commands

---

### CaptureManager

Screenshot capture component for Unity cameras.

**Namespace**: `Headsup.Monitoring`
**Inherits**: `MonoBehaviour`

#### Inspector Fields

- **Capture Width** (`int`) - Width of captured screenshots in pixels (default: 1280)
- **Capture Height** (`int`) - Height of captured screenshots in pixels (default: 720)
- **Save Capture** (`bool`) - Whether to save screenshots to disk (default: false)
- **Hide Game Object** (`GameObject`) - Optional GameObject to hide during capture
- **Optimize For Many Screenshots** (`bool`) - Reuse render textures for better performance (default: true)
- **Format** (`EFormat`) - Image format: JPG or PNG (default: JPG)
- **Folder** (`string`) - Output folder for saved screenshots (optional, defaults to platform-appropriate location)

#### Public Methods

```csharp
// Trigger a screenshot capture
public void CaptureScreenshot()

// Get the most recent screenshot as byte array
public byte[] GetLastScreenshot()
```

#### Usage

```csharp
// Add to your camera
Camera.main.gameObject.AddComponent<CaptureManager>();

// Capture a screenshot
var captureManager = Camera.main.GetComponent<CaptureManager>();
captureManager.CaptureScreenshot();

// Wait for capture to complete (happens in next Update)
yield return null;

// Retrieve the screenshot
byte[] screenshotData = captureManager.GetLastScreenshot();
```

#### Platform Notes

- **Android (Quest)**: Screenshots are saved to `Application.persistentDataPath`
- **Windows/Editor**: Screenshots are saved to `Application.dataPath/../screenshots`
- The component automatically handles platform differences

---

## Interfaces

### IHeadsupExperimentManager

Interface for integrating experiment controllers with Headsup monitoring.

**Namespace**: `Headsup.Monitoring`

#### Methods

```csharp
void ForceEnd()
```

Forces the experiment to end immediately. Called when the "kill" command is received.

```csharp
Dictionary<string, string> GetExperimentStatus()
```

Returns experiment status as key-value pairs. Called periodically to broadcast status to clients.

Common status keys:

- `active_block` - Current experiment block number
- `trial_number` - Current trial number
- `phase` - Current experiment phase (e.g., "idle", "calibration", "task", "ended")
- `participant_id` - Participant identifier
- Custom keys specific to your experiment

```csharp
void StartTask()
```

Starts the main task/trial sequence. Called when "start_task" command is received.

```csharp
void StartCalibration()
```

Initiates calibration process. Called when "start_calibration" command is received.

#### Implementation Example

```csharp
using System.Collections.Generic;
using UnityEngine;
using Headsup.Monitoring;

public class MyExperimentManager : MonoBehaviour, IHeadsupExperimentManager
{
    private int currentBlock = 0;
    private int currentTrial = 0;
    private string phase = "idle";

    public void ForceEnd()
    {
        phase = "ended";
        // Clean up and save data
    }

    public Dictionary<string, string> GetExperimentStatus()
    {
        return new Dictionary<string, string>
        {
            { "active_block", currentBlock.ToString() },
            { "trial_number", currentTrial.ToString() },
            { "phase", phase }
        };
    }

    public void StartTask()
    {
        phase = "task";
        // Begin task sequence
    }

    public void StartCalibration()
    {
        phase = "calibration";
        // Start calibration routine
    }
}
```

---

### IHeadsupGazeManager

Interface for integrating eye-tracking/gaze systems with Headsup monitoring.

**Namespace**: `Headsup.Monitoring`

#### Methods

```csharp
void SetRequireFixation(bool requireFixation)
```

Controls whether fixation is required before trial progression. Called when "enable_fixation" or "disable_fixation" commands are received.

**Parameters**:

- `requireFixation` - `true` to require fixation, `false` to disable

#### Implementation Example

```csharp
using UnityEngine;
using Headsup.Monitoring;

public class MyGazeManager : MonoBehaviour, IHeadsupGazeManager
{
    private bool requireFixation = true;

    public void SetRequireFixation(bool require)
    {
        requireFixation = require;
        Debug.Log($"Fixation requirement: {require}");
        // Update gaze-contingent display logic
    }

    // Your own gaze tracking methods
    public bool IsFixating()
    {
        // Check eye-tracker for fixation
        return true;
    }
}
```

---

## Integration Workflow

### 1. Install Package

Via git URL: `https://github.com/henryjburg/headsup.git?path=/unity`

### 2. Install WebSocketSharp

Download and install WebSocketSharp-netstandard DLL into your project's `Assets/Plugins/` folder.

### 3. Implement Interfaces

Add `IHeadsupExperimentManager` to your experiment controller and optionally `IHeadsupGazeManager` to your gaze controller.

### 4. Add Components

- Add `HeadsupServer` component to a GameObject
- Add `CaptureManager` to your camera(s)
- Assign references in HeadsupServer inspector

### 5. Connect Client

Run the Python Headsup client from the `/client` folder to connect and monitor your experiment.

---

## Message Protocol

### Status Broadcast Format

```json
{
  "type": "status",
  "data": "{\"active_block\":\"1\",\"trial_number\":\"5\",\"phase\":\"task\"}"
}
```

### Log Message Format

```json
{
  "type": "logs",
  "data": "\"Your log message here\""
}
```

### Screenshot Format

```json
{
  "type": "screenshot",
  "data": "[\"base64_encoded_image1\",\"base64_encoded_image2\"]"
}
```

---

## Advanced Usage

### Multiple Capture Sources

```csharp
// Assign multiple cameras for multi-view capture
public CaptureManager[] captureSources = new CaptureManager[]
{
    leftCamera.GetComponent<CaptureManager>(),
    rightCamera.GetComponent<CaptureManager>(),
    overviewCamera.GetComponent<CaptureManager>()
};
```

### Custom Status Fields

```csharp
public Dictionary<string, string> GetExperimentStatus()
{
    return new Dictionary<string, string>
    {
        { "active_block", currentBlock.ToString() },
        { "trial_number", currentTrial.ToString() },
        { "phase", phase },
        { "participant_id", participantId },
        { "stimulus_type", currentStimulus },
        { "response_time", responseTime.ToString("F2") },
        { "accuracy", accuracy.ToString("F2") }
    };
}
```

### Dynamic Port Configuration

```csharp
void Start()
{
    var server = gameObject.AddComponent<HeadsupServer>();
    server.port = PlayerPrefs.GetInt("HeadsupPort", 4444);
}
```

---

## Troubleshooting

### "No IHeadsupExperimentManager found in scene"

This warning appears if HeadsupServer cannot find a component implementing IHeadsupExperimentManager. The server will still function but experiment control commands will be unavailable.

**Solution**: Ensure your experiment manager implements IHeadsupExperimentManager and is referenced in the HeadsupServer inspector.

### "Gaze manager GameObject specified but does not implement IHeadsupGazeManager"

You assigned a GameObject to the Gaze Manager Object field but it doesn't have a component implementing IHeadsupGazeManager.

**Solution**: Add the IHeadsupGazeManager interface to your gaze manager component.

### WebSocket Connection Refused

The Python client cannot connect to the Unity application.

**Solutions**:

- Verify Unity application is running
- Check firewall settings
- Ensure correct IP address and port
- For Quest: Verify ADB port forwarding is set up correctly

### Screenshots are blank or incorrect

**Solutions**:

- Ensure CaptureManager is attached to the correct camera
- Verify camera is rendering to a valid render target
- Check capture resolution matches camera settings
- Disable "Hide Game Object" if needed

---

## Performance Considerations

- Screenshot capture causes a brief performance impact (typically 1-2 frames)
- Enable "Optimize For Many Screenshots" to reuse render textures
- Adjust status broadcast interval (`updateInterval`) to balance responsiveness vs. network traffic
- Consider using JPG format for smaller file sizes over network

---

## License

See [LICENSE.md](../LICENSE.md) for license information.

---

## Support

For issues, questions, or feedback:

- GitHub Issues: [https://github.com/henryjburg/headsup/issues](https://github.com/henryjburg/headsup/issues)
- Email: [henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)
