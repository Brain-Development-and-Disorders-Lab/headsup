/**
File: HeadsupServer.cs
Author: Henry Burgess <henry.burgess@wustl.edu>
*/
using UnityEngine;
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace Headsup.Monitoring
{
    public class Handler : WebSocketBehavior
    {
        private readonly IHeadsupExperimentManager _experiment;
        private readonly IHeadsupPresentationManager _presentationManager;
        private readonly CaptureManager[] _captureSources;

        public Handler(IHeadsupExperimentManager manager, IHeadsupPresentationManager presentationManager, CaptureManager[] sources)
        {
            _experiment = manager;
            _presentationManager = presentationManager;
            _captureSources = sources;
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            // Handle received messages and respond accordingly
            if (e.Data == "active")
            {
                // Return active status, "true" if responsive
                Send(JsonConvert.SerializeObject(true));
            }
            else if (e.Data == "kill")
            {
                // Force the experiment to end
                if (_experiment != null)
                {
                    _experiment.ForceEnd();
                    Send(JsonConvert.SerializeObject("Done"));
                }
                else
                {
                    Debug.LogWarning("Cannot execute 'kill' command: No IHeadsupExperimentManager available");
                    Send(JsonConvert.SerializeObject("Error: Experiment manager not available"));
                }
            }
            else if (e.Data == "disable_fixation")
            {
                // Disable the fixation requirement
                if (_presentationManager != null)
                {
                    _presentationManager.SetRequireFixation(false);
                    Send(JsonConvert.SerializeObject("Fixation Disabled"));
                }
                else
                {
                    Debug.LogWarning("Cannot execute 'disable_fixation' command: No IHeadsupPresentationManager available");
                    Send(JsonConvert.SerializeObject("Error: PresentationManager not available"));
                }
            }
            else if (e.Data == "enable_fixation")
            {
                // Enable the fixation requirement
                if (_presentationManager != null)
                {
                    _presentationManager.SetRequireFixation(true);
                    Send(JsonConvert.SerializeObject("Fixation Enabled"));
                }
                else
                {
                    Debug.LogWarning("Cannot execute 'enable_fixation' command: No IHeadsupPresentationManager available");
                    Send(JsonConvert.SerializeObject("Error: PresentationManager not available"));
                }
            }
            else if (e.Data == "start_task")
            {
                if (_experiment != null)
                {
                    _experiment.StartTask();
                    Send(JsonConvert.SerializeObject("Started Task"));
                }
                else
                {
                    Debug.LogWarning("Cannot execute 'start_task' command: No IHeadsupExperimentManager available");
                    Send(JsonConvert.SerializeObject("Error: Experiment manager not available"));
                }
            }
            else if (e.Data == "start_calibration")
            {
                if (_experiment != null)
                {
                    _experiment.StartCalibration();
                    Send(JsonConvert.SerializeObject("Started Calibration"));
                }
                else
                {
                    Debug.LogWarning("Cannot execute 'start_calibration' command: No IHeadsupExperimentManager available");
                    Send(JsonConvert.SerializeObject("Error: Experiment manager not available"));
                }
            }
            else if (e.Data == "screenshot")
            {
                // Capture screenshot of current view
                // Retrieve screenshots from each of the in-game displays
                List<string> sourceCaptures = new();
                foreach (var source in _captureSources)
                {
                    // For each source, capture the screenshots and convert to base64 string for network communication
                    source.CaptureScreenshot();
                    byte[] screenshot = source.GetLastScreenshot();
                    string bufferContents = Convert.ToBase64String(screenshot);
                    sourceCaptures.Add(bufferContents);
                }

                Dictionary<string, string> toSend = new() { { "type", "screenshot" }, { "data", JsonConvert.SerializeObject(sourceCaptures) } };
                Send(JsonConvert.SerializeObject(toSend));
            }

            else
            {
                // Default error message
                Debug.LogWarning("Invalid Command: " + e.Data);
                Send(JsonConvert.SerializeObject("Invalid Command"));
            }
        }
    }

    /// <summary>
    /// Server component for Headsup system, enables communication to and from Headsup client over the local
    /// network. Listens on defined port and responds to specific commands. Optionally integrates with
    /// IHeadsupExperimentManager and IHeadsupPresentationManager implementations to enable remote experiment control and eye-tracking
    /// management.
    /// </summary>
    public class HeadsupServer : MonoBehaviour
    {
        // Collection of CaptureManager instances to retrieve screenshots from
        [SerializeField]
        private CaptureManager[] _captureSources;

        // Network port to listen on
        public int port = 4444;

        // Optional GameObjects containing IHeadsupExperimentManager and IHeadsupPresentationManager implementations
        [SerializeField]
        [Tooltip("GameObject with a component implementing IHeadsupExperimentManager interface (optional)")]
        private GameObject _experimentManagerObject;

        [SerializeField]
        [Tooltip("GameObject with a component implementing IHeadsupPresentationManager interface (optional)")]
        private GameObject _presentationManagerObject;

        // Interface references
        private IHeadsupExperimentManager _experiment;
        private IHeadsupPresentationManager _presentationManager;

        // WebSocket server instance
        private WebSocketServer _server;

        // Queue to manage log messages
        private Queue<string> _logsPreflight;

        private float _nextUpdateTime = 0.0f;
        [SerializeField]
        private float _updateInterval = 1.0f;

        private void Start()
        {
            // Try to get experiment manager from serialized GameObject
            if (_experimentManagerObject != null)
            {
                _experiment = _experimentManagerObject.GetComponent<IHeadsupExperimentManager>();
                if (_experiment == null)
                {
                    Debug.LogWarning("HeadsupServer: Experiment manager GameObject specified but does not implement IHeadsupExperimentManager interface");
                }
            }
            else
            {
                // Fallback: search scene for any MonoBehaviour implementing IHeadsupExperimentManager
                MonoBehaviour[] allMonoBehaviours = FindObjectsOfType<MonoBehaviour>();
                foreach (var mb in allMonoBehaviours)
                {
                    if (mb is IHeadsupExperimentManager experimentMgr)
                    {
                        _experiment = experimentMgr;
                        Debug.Log($"HeadsupServer: Found IHeadsupExperimentManager implementation on {mb.gameObject.name}");
                        break;
                    }
                }

                if (_experiment == null)
                {
                    Debug.LogWarning("HeadsupServer: No IHeadsupExperimentManager found in scene. Experiment control features will be disabled.");
                }
            }

            // Try to get PresentationManager from serialized GameObject
            if (_presentationManagerObject != null)
            {
                _presentationManager = _presentationManagerObject.GetComponent<IHeadsupPresentationManager>();
                if (_presentationManager == null)
                {
                    Debug.LogWarning("HeadsupServer: PresentationManager GameObject specified but does not implement IHeadsupPresentationManager interface");
                }
            }
            else if (_experimentManagerObject != null)
            {
                // Try to get PresentationManager from the same GameObject as experiment manager
                _presentationManager = _experimentManagerObject.GetComponent<IHeadsupPresentationManager>();
                if (_presentationManager != null)
                {
                    Debug.Log($"HeadsupServer: Found IHeadsupPresentationManager on same GameObject as experiment manager");
                }
            }
            else
            {
                // Fallback: search scene for any MonoBehaviour implementing IHeadsupPresentationManager
                MonoBehaviour[] allMonoBehaviours = FindObjectsOfType<MonoBehaviour>();
                foreach (var mb in allMonoBehaviours)
                {
                    if (mb is IHeadsupPresentationManager presentationManager)
                    {
                        _presentationManager = presentationManager;
                        Debug.Log($"HeadsupServer: Found IHeadsupPresentationManager implementation on {mb.gameObject.name}");
                        break;
                    }
                }
            }

            if (_presentationManager == null)
            {
                Debug.LogWarning("HeadsupServer: No IHeadsupPresentationManager found in scene. Gaze control features will be disabled.");
            }

            _logsPreflight = new Queue<string>();

            _server = new WebSocketServer(port);
            _server.AddWebSocketService<Handler>("/", () => new Handler(_experiment, _presentationManager, _captureSources));
            _server.Start();

            Debug.Log($"HeadsupServer: Started WebSocket server on port {port}");

            Application.logMessageReceived += HandleLogMessage;
        }

        private void Update()
        {
            // Broadcast the status to all connected clients
            if (Time.time >= _nextUpdateTime)
            {
                var status = _experiment != null ?
                    _experiment.GetExperimentStatus() :
                    new Dictionary<string, string>() { { "status", "no_experiment_manager" } };
                Dictionary<string, string> toSend = new() { { "type", "status" }, { "data", JsonConvert.SerializeObject(status) } };
                _server.WebSocketServices["/"].Sessions.Broadcast(JsonConvert.SerializeObject(toSend));
                _nextUpdateTime += _updateInterval;
            }

            // Broadcast any log messages to the client interface
            if (_logsPreflight.Count > 0)
            {
                Dictionary<string, string> toSend = new() { { "type", "logs" }, { "data", JsonConvert.SerializeObject(_logsPreflight.Dequeue()) } };
                _server.WebSocketServices["/"].Sessions.Broadcast(JsonConvert.SerializeObject(toSend));
            }
        }

        /// <summary>
        /// When destroyed, stop the WebSocketServer instance
        /// </summary>
        private void OnDestroy()
        {
            if (_server != null)
            {
                _server.Stop();
                Debug.Log("HeadsupServer: Stopped WebSocket server");
            }
        }

        /// <summary>
        /// Utility function to enqueue log messages for transmission to client interface
        /// </summary>
        /// <param name="condition">Details of log message</param>
        /// <param name="stackTrace">Stacktrace leading to message</param>
        /// <param name="type">Type of log message / level</param>
        private void HandleLogMessage(string condition, string stackTrace, LogType type) => _logsPreflight.Enqueue(condition);
    }
}
