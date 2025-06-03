# Headsup Client

A Python-based control panel for managing and monitoring VR experiments in Unity. This application provides a user-friendly interface for connecting to the VR headset, capturing screenshots, and monitoring experiment progress.

## Features

- **Connection Management**
  - Connect to VR headset via WebSocket
  - Real-time connection status monitoring
  - Configurable IP address and port

- **Device Status**
  - Display device name and model
  - Monitor battery level
  - Track experiment progress
  - View current block and trial information

- **Experiment Control**
  - Toggle fixation point
  - End experiment safely
  - Capture screenshots from the headset

- **System Monitoring**
  - Real-time system logs with color-coded messages
  - Dark theme console for better readability
  - Timestamped log entries

## Requirements

- Python 3.7 or higher
- Required Python packages:

  ```txt
  tkinter
  websockets
  pillow
  ```

## Installation

1. Ensure Python 3.7+ is installed on your system
2. Install required packages:

   ```bash
   pip3 install websockets pillow
   ```

   Note: `tkinter` is typically included with Python installation

## Usage

1. Start the application:

   ```bash
   python3 main.py
   ```

2. Connection:
   - Default connection settings: `localhost:4444`
   - Click "Connect" to establish connection with the headset
   - Status indicator shows connection state

3. Controls:
   - **Capture Screenshot**: Takes a screenshot from the headset view
   - **Toggle Fixation**: Enable/disable the fixation point
   - **End Experiment**: Safely terminate the current experiment

4. Monitoring:
   - Device status panel shows real-time information
   - System logs display connection and experiment events
   - Screenshot preview shows current headset view

## Window Layout

- **Connection Panel**: Top section for connection management
- **Status Panel**: Left side showing device and experiment status
- **Screenshot Panel**: Right side displaying headset view (16:9 aspect ratio)
- **Log Panel**: Bottom section with system logs

## Troubleshooting

- **Connection Issues**:
  - Verify headset is running and accessible
  - Check IP address and port settings
  - Ensure no firewall is blocking the connection

- **Screenshot Issues**:
  - Verify headset is connected
  - Check if the experiment is running
  - Ensure sufficient memory is available

## License

<!-- CC BY-NC-SA 4.0 License -->
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Issues and Feedback

Please contact **Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)> for all code-related issues and feedback.
