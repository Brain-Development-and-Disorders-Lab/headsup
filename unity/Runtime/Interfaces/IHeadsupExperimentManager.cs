/**
File: IHeadsupExperimentManager.cs
Author: Henry Burgess <henry.burgess@wustl.edu>
*/
using System.Collections.Generic;

namespace Headsup.Monitoring
{
    /// <summary>
    /// Interface for experiment managers to integrate with Headsup monitoring system.
    /// Implement this interface in your experiment controller to enable remote monitoring and control.
    /// </summary>
    public interface IHeadsupExperimentManager
    {
        /// <summary>
        /// Forces the experiment to end immediately.
        /// Called when the "kill" command is received from the Headsup client.
        /// </summary>
        void ForceEnd();

        /// <summary>
        /// Returns the current experiment status as key-value pairs.
        /// This status is broadcast to all connected clients at regular intervals.
        /// Common keys: "active_block", "trial_number", "phase", "participant_id"
        /// </summary>
        /// <returns>Dictionary containing experiment status information</returns>
        Dictionary<string, string> GetExperimentStatus();

        /// <summary>
        /// Starts the main task/trial sequence.
        /// Called when the "start_task" command is received from the Headsup client.
        /// </summary>
        void StartTask();

        /// <summary>
        /// Initiates the calibration process (typically eye-tracking calibration).
        /// Called when the "start_calibration" command is received from the Headsup client.
        /// </summary>
        void StartCalibration();
    }
}
