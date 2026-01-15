# Headsup Client

Python-based control panel for monitoring and managing Unity VR experiments. Provides remote control capabilities, real-time status monitoring, and screenshot capture for VR headsets running the Headsup Unity package.

## Features

- Remote application launch and connection management
- Real-time device status monitoring (battery level, headset model)
- Experiment progress tracking (blocks, trials, custom status fields)
- Screenshot capture from VR headset
- Live system log streaming with color-coded messages
- Experiment control (start, end, fixation toggle)

## Requirements

- Python 3.7 or higher
- Dependencies: `websockets`, `pillow`

## Installation

Install required packages:

```bash
pip3 install websockets pillow
```

## Usage

Start the control panel:

```bash
python3 main.py
```

### Connection

1. Enter the VR headset's IP address (found in device network settings)
2. Click "Launch Application" to remotely start the VR application
3. Click "Connect" once the application is running
4. Connection status indicator shows current state

### Controls

- **Quit Application**: Force quit the VR application (may result in data loss)
- **Capture Screenshot**: Capture current headset view
- **Enable/Disable Fixation**: Toggle fixation requirement
- **End Experiment**: Safely terminate the experiment

### Monitoring Panels

- **Device Status**: Real-time headset information and experiment progress
- **Headset Display**: Screenshot viewer
- **System Logs**: Live log feed from VR application and client

## Troubleshooting

**Connection fails:**

- Verify VR application is running
- Confirm IP address is correct
- Check both devices are on the same network
- Ensure no firewall is blocking port 4444

**Screenshots not working:**

- Verify headset is connected
- Confirm experiment is running
- Check available memory on headset

## License

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
</a>
<br />
This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

## Contact

**Henry Burgess** <[henry.burgess@wustl.edu](mailto:henry.burgess@wustl.edu)>
