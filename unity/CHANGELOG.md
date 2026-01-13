# Changelog

All notable changes to the Headsup Monitoring package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-13

### Added

- Initial Unity Package Manager (UPM) package release
- Interface-based dependency injection system
  - `IHeadsupExperimentManager` interface for experiment control integration
  - `IHeadsupGazeManager` interface for eye-tracking/gaze control integration
- Core components:
  - `HeadsupServer` - WebSocket server for remote monitoring and control
  - `CaptureManager` - Screenshot capture system for VR cameras
- WebSocket command support:
  - `active` - Server responsiveness check
  - `status` - Experiment status broadcasting
  - `logs` - Unity console output streaming
  - `screenshot` - Multi-camera screenshot capture
  - `enable_fixation` / `disable_fixation` - Gaze control
  - `start_task` - Task initiation
  - `start_calibration` - Calibration trigger
  - `kill` - Experiment termination
- Graceful degradation when optional components (IHeadsupExperimentManager, IHeadsupGazeManager) are unavailable
- Sample implementation with example scripts:
  - `ExampleExperimentManager` - Reference IHeadsupExperimentManager implementation
  - `ExampleGazeManager` - Reference IHeadsupGazeManager implementation
- Comprehensive documentation:
  - API reference documentation
  - Step-by-step setup guide
  - Sample integration guide
  - Troubleshooting guide
- Assembly definition for proper package isolation
- Namespace organization under `Headsup.Monitoring`

### Changed

- Migrated from loose scripts to proper UPM package structure
- Refactored from hard-coded component dependencies to interface-based design
- Unified namespace from `Monitoring` to `Headsup.Monitoring`
- Enhanced error handling with informative warnings instead of exceptions
- Improved auto-discovery of interface implementations in scene

### Dependencies

- Unity 2020.3 or higher (minimum LTS version)
- Newtonsoft.Json 3.2.1+ (automatically installed via UPM)
- WebSocketSharp-netstandard 1.0.3-rc11+ (manual installation required)

### Installation

Install via Unity Package Manager using git URL:
```
https://github.com/henryjburg/headsup.git?path=/unity
```

### Migration Notes

For users upgrading from loose scripts:

1. Remove old `CaptureManager.cs` and `HeadsupServer.cs` from Assets folder
2. Install package via UPM
3. Add `IHeadsupExperimentManager` interface to your experiment manager class
4. Add `IHeadsupGazeManager` interface to your gaze manager class (if applicable)
5. Update `using` statements to include `Headsup.Monitoring` namespace
6. Reassign component references in HeadsupServer inspector
7. Install WebSocketSharp-netstandard DLL if not already present

### Platform Support

- Windows Editor - Fully supported
- Android (Meta Quest) - Fully supported and tested on Quest Pro
- Other VR platforms - Should work but not extensively tested

### Known Issues

- WebSocketSharp must be installed manually (not available via UPM)
- Unity may show warnings about missing assembly references until WebSocketSharp is installed

---

## [Unreleased]

### Planned Features

- Optional WebSocketSharp DLL bundling
- Additional command support (pause, resume, etc.)
- Enhanced status customization options
- Performance profiling integration
- Data export utilities

---

## Version History

- **1.0.0** (2026-01-13) - Initial UPM package release
