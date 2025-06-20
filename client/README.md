# Headsup Client

A Python-based control panel for managing and monitoring VR experiments in Unity. This application provides a user-friendly interface for connecting to the VR headset, capturing screenshots, and monitoring experiment progress.

## Features

- **Remote Start**
  - Configurable IP address and port
  - Start the VR experiment remotely

- **Device Status**
  - Connect to the VR headset via the realtime WebSocket protocol
  - Real-time VR headset status monitoring (name, model, battery level)
  - Track the experiment progress
  - View current experiment block and trial information
  - Real-time system logs with color-coded messages

- **Experiment Control**
  - Toggle fixation requirement
  - End experiment safely
  - Capture screenshots from the headset

## Requirements

- Python 3.7 or higher
- Required Python packages:

  ```txt
  websockets
  pillow
  ```

## Setup

1. Ensure Python 3.7+ is installed on your system
2. Install required packages:

   ```bash
   pip3 install websockets pillow
   ```

## Usage

1. Start the GUI:

   ```bash
   python3 main.py
   ```

2. Connection:
   - Change IP address to the IP address of the VR headset on the network
   - Click "Launch Application" to attempt a remote start of the application
   - Click "Connect" after successfully launching the application to connect to the experiment
   - Status indicator shows connection state

3. Controls:
   - **Quit Application**: Force-quit the experiment, results in data loss
   - **Capture Screenshot**: Takes a screenshot from the headset view
   - **Disable/Enable Fixation**: Enable/disable the fixation point
   - **End Experiment**: Safely terminate the current experiment

4. Monitoring:
   - **Device Status**: Real-time headset and experiment status information
   - **Headset Display**: Capture and display screenshots
   - **System Logs**: Display live feed of headset logs and GUI logs

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
