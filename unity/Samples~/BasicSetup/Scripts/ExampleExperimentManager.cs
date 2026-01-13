/**
File: ExampleExperimentManager.cs
Author: Henry Burgess <henry.burgess@wustl.edu>
*/
using System.Collections.Generic;
using UnityEngine;
using Headsup.Monitoring;

namespace Headsup.Samples
{
    /// <summary>
    /// Example implementation of IHeadsupExperimentManager interface.
    /// This demonstrates how to integrate your experiment controller with Headsup monitoring.
    /// Replace this with your own experiment manager implementation.
    /// </summary>
    public class ExampleExperimentManager : MonoBehaviour, IHeadsupExperimentManager
    {
        [SerializeField]
        [Tooltip("Current block number in the experiment")]
        private int _currentBlock = 0;

        [SerializeField]
        [Tooltip("Current trial number in the experiment")]
        private int _currentTrial = 0;

        [SerializeField]
        [Tooltip("Current phase of the experiment (e.g., 'idle', 'calibration', 'task', 'ended')")]
        private string _experimentPhase = "idle";

        [SerializeField]
        [Tooltip("Participant ID for this experiment session")]
        private string _participantId = "example_001";

        /// <summary>
        /// Forces the experiment to end immediately.
        /// Called remotely via the "kill" command from Headsup client.
        /// </summary>
        public void ForceEnd()
        {
            Debug.Log("ExampleExperimentManager: Force ending experiment...");
            _experimentPhase = "ended";
            // Add your cleanup logic here:
            // - Save data
            // - Stop any running trials
            // - Reset experiment state
            // - etc.
        }

        /// <summary>
        /// Returns the current experiment status as key-value pairs.
        /// This status is broadcast to all connected Headsup clients at regular intervals.
        /// </summary>
        /// <returns>Dictionary containing experiment status information</returns>
        public Dictionary<string, string> GetExperimentStatus()
        {
            return new Dictionary<string, string>
            {
                { "active_block", _currentBlock.ToString() },
                { "trial_number", _currentTrial.ToString() },
                { "phase", _experimentPhase },
                { "participant_id", _participantId },
                { "timestamp", Time.time.ToString("F2") }
            };
        }

        /// <summary>
        /// Starts the main task/trial sequence.
        /// Called remotely via the "start_task" command from Headsup client.
        /// </summary>
        public void StartTask()
        {
            Debug.Log("ExampleExperimentManager: Starting task...");
            _experimentPhase = "task";
            _currentTrial = 1;
            // Add your task start logic here:
            // - Initialize trial sequence
            // - Present stimuli
            // - Start recording data
            // - etc.
        }

        /// <summary>
        /// Initiates the calibration process (typically eye-tracking calibration).
        /// Called remotely via the "start_calibration" command from Headsup client.
        /// </summary>
        public void StartCalibration()
        {
            Debug.Log("ExampleExperimentManager: Starting calibration...");
            _experimentPhase = "calibration";
            // Add your calibration start logic here:
            // - Show calibration points
            // - Initialize eye-tracking calibration routine
            // - etc.
        }

        // Example of advancing to the next trial (called by your own code)
        public void AdvanceToNextTrial()
        {
            _currentTrial++;
            Debug.Log($"ExampleExperimentManager: Advanced to trial {_currentTrial}");
        }

        // Example of advancing to the next block (called by your own code)
        public void AdvanceToNextBlock()
        {
            _currentBlock++;
            _currentTrial = 0;
            Debug.Log($"ExampleExperimentManager: Advanced to block {_currentBlock}");
        }
    }
}
