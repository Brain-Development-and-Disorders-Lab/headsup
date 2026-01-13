# Headsup Monitoring - Setup Guide

Step-by-step guide for integrating Headsup Monitoring into your Unity VR project.

## Prerequisites

- Unity 2020.3 or higher
- VR project setup (tested on Meta Quest Pro)
- Git installed (for git URL installation)
- Python 3.7+ (for running Headsup client)

---

## Part 1: Package Installation

### Option A: Install via Git URL (Recommended)

1. Open Unity Package Manager
   - Menu: **Window > Package Manager**

2. Add package from git URL
   - Click the **"+"** button in top-left corner
   - Select **"Add package from git URL"**
   - Enter: `https://github.com/Brain-Development-and-Disorders-Lab/headsup.git?path=/unity`
   - Click **"Add"**

3. Wait for installation
   - Unity will download the package and install Newtonsoft.Json dependency automatically
   - Check the Console for any errors

### Option B: Install via Local Path

1. Clone the repository
   ```bash
   git clone https://github.com/Brain-Development-and-Disorders-Lab/headsup.git
   ```

2. Add package from disk
   - Open Unity Package Manager
   - Click **"+"** → **"Add package from disk"**
   - Navigate to `headsup/unity/package.json`
   - Click **"Open"**

---

## Part 2: Install WebSocketSharp

The package requires WebSocketSharp-netstandard, which must be installed manually.

### Method A: Using NuGetForUnity (Recommended)

1. Install NuGetForUnity if not already installed:
   - Download from [GitHub](https://github.com/GlitchEnzo/NuGetForUnity)
   - Or via git URL: `https://github.com/GlitchEnzo/NuGetForUnity.git?path=/src/NuGetForUnity`

2. Install WebSocketSharp:
   - Open NuGet window: **NuGet > Manage NuGet Packages**
   - Search for "WebSocketSharp-netstandard"
   - Click **"Install"**
   - Version 1.0.3-rc11 or newer recommended

### Method B: Manual DLL Installation

1. Download the NuGet package:
   - Visit: [WebSocketSharp-netstandard on NuGet](https://www.nuget.org/packages/WebSocketSharp-netstandard/)
   - Download the `.nupkg` file (version 1.0.3-rc11 or newer)

2. Extract the DLL:
   - Rename `.nupkg` to `.zip`
   - Extract the archive
   - Locate `websocket-sharp.dll` in `lib/netstandard2.0/` folder

3. Add to Unity project:
   - Create folder: `Assets/Plugins/` (if it doesn't exist)
   - Copy `websocket-sharp.dll` to `Assets/Plugins/`
   - Wait for Unity to import the DLL

4. Verify import:
   - Select the DLL in Unity Project window
   - In Inspector, ensure "Any Platform" is checked
   - Click "Apply"

---

## Part 3: Implement Interfaces

### Step 1: Locate Your Experiment Manager

Find your existing experiment controller script. If you don't have one, create a new MonoBehaviour.

### Step 2: Implement IHeadsupExperimentManager

Add the interface to your experiment manager:

```csharp
using System.Collections.Generic;
using UnityEngine;
using Headsup.Monitoring;  // Add this namespace

public class YourExperimentManager : MonoBehaviour, IHeadsupExperimentManager  // Add interface
{
    // Your existing fields
    private int currentBlock = 0;
    private int currentTrial = 0;
    private string experimentPhase = "idle";

    // Implement required interface methods

    public void ForceEnd()
    {
        Debug.Log("Experiment force ended via Headsup");
        experimentPhase = "ended";

        // Add your cleanup logic:
        // - Save any unsaved data
        // - Stop running trials
        // - Reset state
        // - etc.
    }

    public Dictionary<string, string> GetExperimentStatus()
    {
        // Return current experiment status
        return new Dictionary<string, string>
        {
            { "active_block", currentBlock.ToString() },
            { "trial_number", currentTrial.ToString() },
            { "phase", experimentPhase },
            { "participant_id", "P001" },  // Replace with actual ID
            // Add any other status fields you want to monitor
        };
    }

    public void StartTask()
    {
        Debug.Log("Task started via Headsup");
        experimentPhase = "task";

        // Add your task start logic:
        // - Initialize trials
        // - Show instructions
        // - Begin stimulus presentation
        // - etc.
    }

    public void StartCalibration()
    {
        Debug.Log("Calibration started via Headsup");
        experimentPhase = "calibration";

        // Add your calibration logic:
        // - Show calibration points
        // - Initialize eye-tracker calibration
        // - etc.
    }

    // Your existing methods continue here...
}
```

### Step 3: Implement IHeadsupGazeManager (Optional)

If you have eye-tracking/gaze control, add the interface:

```csharp
using UnityEngine;
using Headsup.Monitoring;

public class YourGazeManager : MonoBehaviour, IHeadsupGazeManager
{
    private bool requireFixation = true;

    public void SetRequireFixation(bool require)
    {
        requireFixation = require;
        Debug.Log($"Fixation requirement set to: {require}");

        // Update your gaze-contingent logic:
        // - Enable/disable fixation checks
        // - Modify trial progression
        // - etc.
    }

    // Your existing gaze tracking methods...
}
```

---

## Part 4: Scene Setup

### Step 1: Add HeadsupServer Component

1. Create or select a GameObject in your scene
   - Recommended: Use the same GameObject that has your experiment manager
   - Or create new: **GameObject > Create Empty**, name it "HeadsupController"

2. Add HeadsupServer component
   - Select the GameObject
   - **Add Component > Headsup Monitoring > Headsup Server**

3. Configure HeadsupServer in Inspector:
   - **Port**: Leave as 4444 (default) or change if needed
   - **Experiment Manager Object**: Drag the GameObject with your IHeadsupExperimentManager implementation
   - **Gaze Manager Object**: (Optional) Drag GameObject with IHeadsupGazeManager implementation
   - **Update Interval**: 1.0 second (adjust as needed)

### Step 2: Add CaptureManager to Camera(s)

1. Select your main camera (typically "Main Camera")
   - For VR: Select the camera used for rendering

2. Add CaptureManager component
   - **Add Component > Headsup Monitoring > Capture Manager**

3. Configure CaptureManager in Inspector:
   - **Capture Width**: 1280 (or desired width)
   - **Capture Height**: 720 (or desired height)
   - **Format**: JPG (smaller) or PNG (higher quality)
   - **Save Capture**: Unchecked (unless you want to save screenshots locally)
   - **Optimize For Many Screenshots**: Checked (recommended)

4. For multiple cameras (optional):
   - Repeat for each camera you want to capture
   - Add all CaptureManagers to HeadsupServer's "Capture Sources" array

### Step 3: Link CaptureManagers to HeadsupServer

1. Select the GameObject with HeadsupServer component

2. In Inspector, find "Capture Sources" array
   - Set **Size** to number of cameras (typically 1)
   - Drag CaptureManager components into array slots

---

## Part 5: Testing

### Test in Unity Editor

1. Press **Play** in Unity Editor

2. Check Console for initialization messages:
   ```
   HeadsupServer: Found IHeadsupExperimentManager implementation on [GameObject name]
   HeadsupServer: Started WebSocket server on port 4444
   ```

3. If you see warnings:
   - "No IHeadsupExperimentManager found" - Check interface implementation and assignment
   - "No IHeadsupGazeManager found" - Normal if you didn't implement it (optional)

### Connect Python Client

1. Open terminal and navigate to client folder:
   ```bash
   cd /path/to/headsup/client
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the client:
   ```bash
   python app.py
   ```

4. Open web browser to `http://localhost:5000`

5. In the web interface:
   - Click **"Connect"** to connect to Unity
   - You should see "Connected" status
   - Try commands: **Active**, **Status**, **Screenshot**

---

## Part 6: Build and Deploy to VR Headset

### For Meta Quest

1. Configure Build Settings:
   - **File > Build Settings**
   - Platform: **Android**
   - Click **"Switch Platform"** if needed

2. Configure Player Settings:
   - **Edit > Project Settings > Player**
   - Set **Minimum API Level**: Android 10.0 (API level 29) or higher

3. Build and deploy:
   - Connect Quest via USB
   - **File > Build and Run**
   - Select output location
   - Wait for build and installation

4. Enable ADB port forwarding:
   ```bash
   adb forward tcp:4444 tcp:4444
   ```

5. Run the app on Quest

6. Connect Python client:
   - Use `localhost:4444` (will connect via ADB forward)
   - Or use Quest's IP address on local network

---

## Part 7: Network Configuration

### Local Network Setup (Recommended for VR)

1. Find Quest's IP address:
   - Quest: **Settings > Wi-Fi > [Your Network] > Advanced**
   - Note the IP address (e.g., 192.168.1.100)

2. Ensure PC and Quest are on same network

3. Test connection:
   ```bash
   ping [Quest IP address]
   ```

4. Connect Python client to Quest IP:
   - Modify client configuration to use Quest's IP:port
   - Example: `ws://192.168.1.100:4444`

### Firewall Configuration

If connection fails, check firewall:

- **Windows**: Allow Unity.exe through Windows Firewall
- **macOS**: System Preferences > Security & Privacy > Firewall > Firewall Options > Allow Unity

---

## Common Issues and Solutions

### Issue: "No IHeadsupExperimentManager found in scene"

**Cause**: HeadsupServer cannot find your IHeadsupExperimentManager implementation

**Solutions**:
1. Verify your class implements IHeadsupExperimentManager
2. Check GameObject is assigned in HeadsupServer inspector
3. Ensure script has no compilation errors
4. Try assigning via inspector instead of relying on auto-discovery

### Issue: "WebSocketSharp.dll not found"

**Cause**: WebSocketSharp DLL not installed

**Solutions**:
1. Follow Part 2 to install WebSocketSharp
2. Verify DLL is in `Assets/Plugins/`
3. Check DLL import settings in Inspector
4. Try reimporting the DLL

### Issue: Python client cannot connect

**Cause**: Network configuration or firewall blocking connection

**Solutions**:
1. Verify Unity app is running and HeadsupServer started
2. Check port number matches (default: 4444)
3. For Quest: Set up ADB port forwarding
4. Check firewall settings
5. Verify PC and Quest on same network
6. Try `localhost` first, then IP address

### Issue: Screenshots are blank

**Cause**: Camera or CaptureManager misconfiguration

**Solutions**:
1. Ensure CaptureManager attached to correct camera
2. Verify camera is active and rendering
3. Try disabling "Hide Game Object" option
4. Check capture resolution is reasonable
5. Test with PNG format instead of JPG

### Issue: Status not updating

**Cause**: GetExperimentStatus() not being called or returning empty data

**Solutions**:
1. Verify IHeadsupExperimentManager implementation
2. Check Update Interval in HeadsupServer (default: 1 second)
3. Ensure no exceptions in GetExperimentStatus()
4. Check Python client is connected and subscribed to status updates

---

## Next Steps

- Import the **Basic Setup Example** sample for reference implementation
- Review [API Documentation](index.md) for advanced usage
- Customize status fields to match your experiment needs
- Set up data logging integration
- Configure multiple capture sources if needed

---

## Support

For additional help:

- **GitHub Issues**: [https://github.com/Brain-Development-and-Disorders-Lab/headsup/issues](https://github.com/Brain-Development-and-Disorders-Lab/headsup/issues)
- **Email**: henry.burgess@wustl.edu
- **Sample Code**: Import "Basic Setup Example" from Package Manager

---

## Advanced Topics

### Multiple Experiment Scenes

If you have multiple scenes, add HeadsupServer to each scene or use a DontDestroyOnLoad singleton pattern.

### Custom Port Configuration

```csharp
void Awake()
{
    var server = GetComponent<HeadsupServer>();
    server.port = 5555;  // Custom port
}
```

### Dynamic Manager Assignment

```csharp
void Start()
{
    var server = GetComponent<HeadsupServer>();
    // HeadsupServer will auto-discover managers if not assigned
    // Or assign manually if needed
}
```

### Build Automation

Include HeadsupServer setup in your build automation scripts to ensure consistent configuration across builds.
