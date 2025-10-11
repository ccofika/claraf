import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Checkmark, Close } from '@carbon/icons-react';

const PendingInvites = ({ onInviteResponse }) => {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(null);

  useEffect(() => {
    fetchPendingInvites();
    // Poll for new invites every 30 seconds
    const interval = setInterval(fetchPendingInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingInvites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/workspaces/pending-invites`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingInvites(response.data);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  };

  const handleAcceptInvite = async (workspaceId) => {
    setProcessingInvite(workspaceId);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workspaces/${workspaceId}/accept-invite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from pending invites
      setPendingInvites((prev) => prev.filter((invite) => invite._id !== workspaceId));

      // Notify parent component to refresh workspaces
      if (onInviteResponse) {
        onInviteResponse();
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert(error.response?.data?.message || 'Failed to accept invite');
    } finally {
      setLoading(false);
      setProcessingInvite(null);
    }
  };

  const handleRejectInvite = async (workspaceId) => {
    setProcessingInvite(workspaceId);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workspaces/${workspaceId}/reject-invite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from pending invites
      setPendingInvites((prev) => prev.filter((invite) => invite._id !== workspaceId));

      // Notify parent component
      if (onInviteResponse) {
        onInviteResponse();
      }
    } catch (error) {
      console.error('Error rejecting invite:', error);
      alert(error.response?.data?.message || 'Failed to reject invite');
    } finally {
      setLoading(false);
      setProcessingInvite(null);
    }
  };

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-neutral-800">
      <div className="px-2 py-1">
        <div className="text-sm font-medium text-gray-600 dark:text-neutral-400">
          Pending Invites
        </div>
      </div>

      {pendingInvites.map((invite) => (
        <div
          key={invite._id}
          className="w-full rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 transition-all duration-200"
        >
          {/* Workspace Name */}
          <div className="flex items-center gap-2 mb-2">
            <Home size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-sm font-semibold text-gray-900 dark:text-neutral-50 truncate">
              {invite.name}
            </div>
          </div>

          {/* Owner Email */}
          <div className="text-xs text-gray-600 dark:text-neutral-400 mb-3 pl-6">
            Invited by: <span className="font-medium">{invite.owner?.email || 'Unknown'}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAcceptInvite(invite._id)}
              disabled={loading && processingInvite === invite._id}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Checkmark size={16} />
              <span>Accept</span>
            </button>

            <button
              onClick={() => handleRejectInvite(invite._id)}
              disabled={loading && processingInvite === invite._id}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Close size={16} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingInvites;
