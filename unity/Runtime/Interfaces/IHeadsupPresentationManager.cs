/**
File: IHeadsupPresentationManager.cs
Author: Henry Burgess <henry.burgess@wustl.edu>
*/

namespace Headsup.Monitoring
{
    /// <summary>
    /// Interface for gaze/eye-tracking managers to integrate with Headsup monitoring system.
    /// Implement this interface in your gaze tracking controller to enable remote fixation control.
    /// </summary>
    public interface IHeadsupPresentationManager
    {
        /// <summary>
        /// Sets whether fixation is required before proceeding with trials.
        /// Called when "enable_fixation" or "disable_fixation" commands are received from the Headsup client.
        /// </summary>
        /// <param name="requireFixation">True to require fixation, false to disable</param>
        void SetRequireFixation(bool requireFixation);
    }
}
