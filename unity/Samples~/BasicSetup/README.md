# Headsup Monitoring - Basic Setup Example

This sample demonstrates how to integrate the Headsup Monitoring package into your Unity VR project.

## What's Included

- **ExampleExperimentManager.cs** - Sample implementation of `IHeadsupExperimentManager` interface
- **ExampleGazeManager.cs** - Sample implementation of `IHeadsupGazeManager` interface
- **HeadsupExample.unity** - Example scene demonstrating the setup

## Quick Start

1. **Import the Sample**:
   - Open Unity Package Manager (Window > Package Manager)
   - Find "Headsup Monitoring" in the list
   - Expand "Samples" section
   - Click "Import" next to "Basic Setup Example"

2. **Open the Example Scene**:
   - Navigate to `Samples/Headsup Monitoring/[version]/BasicSetup/Scenes/`
   - Open `HeadsupExample.unity`

3. **Play the Scene**:
   - Press Play in Unity Editor
   - The HeadsupServer will start on port 4444
   - Connect from your Headsup Python client to monitor the experiment

## Integration into Your Project

To integrate Headsup into your own VR project:

### 1. Implement the Interfaces

Add the interfaces to your existing experiment and gaze manager classes:

```csharp
using Headsup.Monitoring;

public class YourExperimentManager : MonoBehaviour, IHeadsupExperimentManager
{
    public void ForceEnd()
    {
        // Your implementation
    }

    public Dictionary<string, string> GetExperimentStatus()
    {
        // Return your experiment status
        return new Dictionary<string, string>
        {
            { "active_block", currentBlock.ToString() },
            { "trial_number", currentTrial.ToString() },
            // ... add your status fields
        };
    }

    public void StartTask()
    {
        // Your task start logic
    }

    public void StartCalibration()
    {
        // Your calibration start logic
    }
}
```

### 2. Add HeadsupServer to Your Scene

1. Create an empty GameObject in your scene (name it "HeadsupServer")
2. Add the `HeadsupServer` component to it
3. Add `CaptureManager` component(s) to your camera(s)
4. In the HeadsupServer inspector:
   - Set the Port (default: 4444)
   - Assign your CaptureManager(s) to the Capture Sources array
   - Assign your experiment manager GameObject to the Experiment Manager Object field
   - Assign your gaze manager GameObject to the Gaze Manager Object field (if applicable)

### 3. Connect with Python Client

Run the Python client from the `/client` folder to connect to your Unity application:

```bash
cd client
python app.py
```

The client will connect to your Unity application on port 4444 and provide a web interface for monitoring and control.

## Scene Structure Example

```
YourGameScene
├── Main Camera
│   └── CaptureManager (component)
├── ExperimentController (GameObject)
│   ├── ExampleExperimentManager (component)
│   ├── ExampleGazeManager (component)
│   └── HeadsupServer (component)
```

## Inspector Setup

1. On the HeadsupServer component:
   - Set Port (default: 4444)
   - Assign Capture Sources array with your CaptureManager(s)
   - Assign Experiment Manager Object (GameObject with IHeadsupExperimentManager)
   - Assign Gaze Manager Object (GameObject with IHeadsupGazeManager)

2. On the Camera with CaptureManager:
   - Configure capture dimensions
   - Set image format (JPG/PNG)
   - Optionally enable save capture for debugging

## Testing the Sample

1. Run the scene in Unity
2. Start the Python Headsup client from the `/client` folder
3. Connect to the Unity application
4. Test commands: active, status, screenshot, start_task, start_calibration, enable_fixation, disable_fixation, kill

## Adapting for Your Project

To integrate Headsup into your own VR project:

1. Implement IHeadsupExperimentManager interface in your experiment controller
2. Implement IHeadsupGazeManager interface in your gaze tracking controller (if applicable)
3. Add HeadsupServer component to a GameObject in your scene
4. Add CaptureManager component(s) to your camera(s)
5. Assign references in the HeadsupServer inspector
6. Run your project and connect via the Python Headsup client

See the full documentation at [Documentation~/setup-guide.md](../../Documentation~/setup-guide.md) for detailed integration instructions.
