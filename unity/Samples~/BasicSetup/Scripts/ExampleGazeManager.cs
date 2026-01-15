/**
File: ExampleGazeManager.cs
Author: Henry Burgess <henry.burgess@wustl.edu>
*/
using UnityEngine;
using UnityEngine.InputSystem;
using Headsup.Monitoring;

namespace Headsup.Samples
{
    /// <summary>
    /// Example implementation of IHeadsupGazeManager interface.
    /// This demonstrates how to integrate your gaze/eye-tracking system with Headsup monitoring.
    /// Replace this with your own gaze manager implementation that controls your actual eye-tracking system.
    /// </summary>
    public class ExampleGazeManager : MonoBehaviour, IHeadsupGazeManager
    {
        [SerializeField]
        [Tooltip("Whether fixation is currently required before proceeding with trials")]
        private bool _requireFixation = true;

        [SerializeField]
        [Tooltip("Simulated fixation state (in a real implementation, this would come from your eye-tracker)")]
        private bool _isFixating = false;

        /// <summary>
        /// Sets whether fixation is required before proceeding with trials.
        /// Called remotely via "enable_fixation" or "disable_fixation" commands from Headsup client.
        /// </summary>
        /// <param name="requireFixation">True to require fixation, false to disable</param>
        public void SetRequireFixation(bool requireFixation)
        {
            _requireFixation = requireFixation;
            Debug.Log($"ExampleGazeManager: Fixation requirement set to: {requireFixation}");

            // Add your fixation control logic here:
            // - Enable/disable gaze contingent displays
            // - Modify trial progression logic
            // - Update UI indicators
            // - etc.
        }

        /// <summary>
        /// Example method to check if the user is currently fixating.
        /// In a real implementation, this would query your eye-tracking system.
        /// </summary>
        /// <returns>True if user is fixating on target, false otherwise</returns>
        public bool IsFixating()
        {
            // In a real implementation, this would:
            // - Get current gaze position from eye-tracker
            // - Check if gaze is within fixation target bounds
            // - Verify fixation duration meets threshold
            // - Return the fixation state
            return _isFixating;
        }

        /// <summary>
        /// Example method to check if fixation requirement is satisfied.
        /// </summary>
        /// <returns>True if fixation is not required or user is fixating</returns>
        public bool IsFixationRequirementMet()
        {
            if (!_requireFixation)
            {
                return true; // Fixation not required
            }

            return IsFixating(); // Check if user is actually fixating
        }

        // Example Update method showing how fixation might be used in trial logic
        private void Update()
        {
            // Example: Only allow trial progression when fixation requirement is met
            if (Keyboard.current.spaceKey.wasPressedThisFrame)
            {
                if (IsFixationRequirementMet())
                {
                    Debug.Log("ExampleGazeManager: Fixation requirement met, allowing action");
                    // Proceed with trial or action
                }
                else
                {
                    Debug.Log("ExampleGazeManager: Fixation required but not detected");
                }
            }
        }

        // Example method to simulate fixation state (for testing without real eye-tracker)
        public void SetFixationState(bool isFixating)
        {
            _isFixating = isFixating;
            Debug.Log($"ExampleGazeManager: Simulated fixation state set to: {isFixating}");
        }
    }
}
