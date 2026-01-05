import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Edit, Trash2, Search, GitMerge, ChevronLeft, ChevronRight,
  AlertCircle, Check, X, Loader2, Square, CheckSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  duration,
  easing
} from '../utils/animations';

const QAAllAgents = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Selection state for merge
  const [selectedAgents, setSelectedAgents] = useState([]);

  // Dialog state
  const [editDialog, setEditDialog] = useState({ open: false, agent: null });
  const [mergeDialog, setMergeDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, agent: null });

  // Merge state - destination: 'first', 'second', or 'new'
  const [mergeDestination, setMergeDestination] = useState('first');
  const [mergeFinalValues, setMergeFinalValues] = useState({
    name: '',
    position: '',
    team: ''
  });
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  // Auth headers
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Check if user is admin
  const isAdmin = ['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email);

  // Get the two selected agents
  const agent1 = selectedAgents[0] || null;
  const agent2 = selectedAgents[1] || null;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (searchDebounced) params.append('search', searchDebounced);

      const response = await axios.get(
        `${API_URL}/api/qa/all-agents?${params.toString()}`,
        getAuthHeaders()
      );

      setAgents(response.data.agents || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders, isAdmin, pagination.page, pagination.limit, searchDebounced]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedAgents([]);
  }, [searchDebounced]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      setSelectedAgents([]); // Clear selection on page change
    }
  };

  // Handle agent selection toggle
  const toggleAgentSelection = (agent) => {
    setSelectedAgents(prev => {
      const isSelected = prev.some(a => a._id === agent._id);
      if (isSelected) {
        return prev.filter(a => a._id !== agent._id);
      } else if (prev.length < 2) {
        return [...prev, agent];
      }
      return prev; // Can't select more than 2
    });
  };

  // Handle edit agent
  const handleEditSave = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/qa/all-agents/${editDialog.agent._id}`,
        {
          name: editDialog.agent.name,
          position: editDialog.agent.position,
          team: editDialog.agent.team
        },
        getAuthHeaders()
      );

      setAgents(prev => prev.map(a =>
        a._id === editDialog.agent._id ? response.data : a
      ));
      setEditDialog({ open: false, agent: null });
      toast.success('Agent updated successfully');
    } catch (err) {
      console.error('Error updating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to update agent');
    }
  };

  // Handle delete agent
  const handleDelete = async () => {
    try {
      await axios.delete(
        `${API_URL}/api/qa/all-agents/${deleteDialog.agent._id}`,
        getAuthHeaders()
      );

      setAgents(prev => prev.filter(a => a._id !== deleteDialog.agent._id));
      setDeleteDialog({ open: false, agent: null });
      setSelectedAgents(prev => prev.filter(a => a._id !== deleteDialog.agent._id));
      toast.success('Agent deleted successfully');
    } catch (err) {
      console.error('Error deleting agent:', err);
      toast.error(err.response?.data?.message || 'Failed to delete agent');
    }
  };

  // Open merge dialog
  const openMergeDialog = () => {
    if (selectedAgents.length !== 2) return;

    // Default to first selected agent
    setMergeDestination('first');
    setMergeFinalValues({
      name: agent1.name,
      position: agent1.position || '',
      team: agent1.team || ''
    });
    setMergeDialog({ open: true });
  };

  // Handle destination change
  const handleDestinationChange = (destination) => {
    setMergeDestination(destination);

    if (destination === 'first') {
      setMergeFinalValues({
        name: agent1.name,
        position: agent1.position || '',
        team: agent1.team || ''
      });
    } else if (destination === 'second') {
      setMergeFinalValues({
        name: agent2.name,
        position: agent2.position || '',
        team: agent2.team || ''
      });
    } else {
      // New agent - start fresh
      setMergeFinalValues({
        name: '',
        position: '',
        team: ''
      });
    }
  };

  // Execute merge
  const handleMerge = async () => {
    if (!mergeFinalValues.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    try {
      setMergeSubmitting(true);

      // Determine source and target based on destination
      let sourceAgentId, targetAgentId;

      if (mergeDestination === 'first') {
        // Keep agent1, delete agent2
        sourceAgentId = agent2._id;
        targetAgentId = agent1._id;
      } else if (mergeDestination === 'second') {
        // Keep agent2, delete agent1
        sourceAgentId = agent1._id;
        targetAgentId = agent2._id;
      } else {
        // New agent - we'll merge both into agent1 first, then rename
        // Actually, let's merge agent2 into agent1 with new name
        sourceAgentId = agent2._id;
        targetAgentId = agent1._id;
      }

      const response = await axios.post(
        `${API_URL}/api/qa/all-agents/merge`,
        {
          sourceAgentId,
          targetAgentId,
          finalName: mergeFinalValues.name.trim(),
          finalPosition: mergeFinalValues.position.trim(),
          finalTeam: mergeFinalValues.team.trim(),
          deleteTarget: mergeDestination === 'new' // If creating new, we need different logic
        },
        getAuthHeaders()
      );

      const stats = response.data.stats;
      toast.success(
        `Merged successfully! ${stats.ticketsMoved} tickets moved` +
        (stats.duplicatesDeleted > 0 ? `, ${stats.duplicatesDeleted} duplicates removed` : '')
      );

      setMergeDialog({ open: false });
      setSelectedAgents([]);
      fetchAgents(); // Refresh list
    } catch (err) {
      console.error('Error merging agents:', err);
      toast.error(err.response?.data?.message || 'Failed to merge agents');
    } finally {
      setMergeSubmitting(false);
    }
  };

  // Pagination component
  const Pagination = () => (
    <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-800">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} agents
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Page {pagination.page} of {pagination.pages}
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
          className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8"
    >
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-5 h-5 text-neutral-400" />
        </motion.div>
        <span className="text-neutral-500 dark:text-neutral-400">Loading agents...</span>
      </div>
    </motion.div>
  );

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8"
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Access Denied</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Only admins can access the All Agents management page.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">All Agents</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage all agents in the system ({pagination.total} total)
          </p>
        </div>

        {/* Merge button - visible when 2 agents selected */}
        <AnimatePresence>
        {selectedAgents.length === 2 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openMergeDialog}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <GitMerge className="w-4 h-4" />
            Merge Selected ({selectedAgents.length})
          </motion.button>
        )}
        </AnimatePresence>

        {selectedAgents.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-neutral-500 dark:text-neutral-400"
          >
            Select one more agent to merge
          </motion.div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name, team, or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </motion.div>

      {/* Table */}
      <motion.div variants={staggerItem}>
      {loading ? (
        <LoadingSkeleton />
      ) : agents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8"
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No agents found</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {search ? 'Try a different search term' : 'No agents in the system yet'}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase w-10">
                  {/* Checkbox column */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Tickets</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {agents.map((agent, idx) => {
                const isSelected = selectedAgents.some(a => a._id === agent._id);
                const canSelect = selectedAgents.length < 2 || isSelected;

                return (
                  <motion.tr
                    key={agent._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: duration.fast, delay: idx * 0.02 }}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleAgentSelection(agent)}
                        disabled={!canSelect}
                        className={`p-0.5 rounded transition-colors ${canSelect ? 'hover:bg-neutral-200 dark:hover:bg-neutral-700' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-400" />
                        )}
                      </motion.button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">{agent.name}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{agent.position || '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{agent.team || '-'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{agent.ticketCount || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditDialog({ open: true, agent: { ...agent } })}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </motion.button>
                        {agent.ticketCount === 0 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteDialog({ open: true, agent })}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          <Pagination />
        </motion.div>
      )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, agent: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          {editDialog.agent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editDialog.agent.name}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    agent: { ...prev.agent, name: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={editDialog.agent.position || ''}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    agent: { ...prev.agent, position: e.target.value }
                  }))}
                  placeholder="e.g., Junior, Senior, Lead"
                />
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Input
                  value={editDialog.agent.team || ''}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    agent: { ...prev.agent, team: e.target.value }
                  }))}
                  placeholder="e.g., Support, Sales"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditDialog({ open: false, agent: null })}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEditSave}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Save Changes
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, agent: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Are you sure you want to delete <strong>{deleteDialog.agent?.name}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDeleteDialog({ open: false, agent: null })}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setMergeDialog({ open: false });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Agents</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Selected agents info */}
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border-2 ${mergeDestination === 'first' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700'}`}>
                  <div className="font-medium text-neutral-900 dark:text-white">{agent1?.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {agent1?.position || 'No position'} • {agent1?.team || 'No team'}
                  </div>
                  <div className="text-sm font-semibold text-purple-600 mt-2">
                    {agent1?.ticketCount || 0} tickets
                  </div>
                </div>
                <div className={`p-3 rounded-lg border-2 ${mergeDestination === 'second' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700'}`}>
                  <div className="font-medium text-neutral-900 dark:text-white">{agent2?.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {agent2?.position || 'No position'} • {agent2?.team || 'No team'}
                  </div>
                  <div className="text-sm font-semibold text-purple-600 mt-2">
                    {agent2?.ticketCount || 0} tickets
                  </div>
                </div>
              </div>
            </div>

            {/* Destination selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Where should all tickets go?</Label>

              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mergeDestination === 'first' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}
                >
                  <input
                    type="radio"
                    name="destination"
                    checked={mergeDestination === 'first'}
                    onChange={() => handleDestinationChange('first')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      Keep "{agent1?.name}"
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      All tickets will be moved to {agent1?.name}. {agent2?.name} will be deleted.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mergeDestination === 'second' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}
                >
                  <input
                    type="radio"
                    name="destination"
                    checked={mergeDestination === 'second'}
                    onChange={() => handleDestinationChange('second')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      Keep "{agent2?.name}"
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      All tickets will be moved to {agent2?.name}. {agent1?.name} will be deleted.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mergeDestination === 'new' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}
                >
                  <input
                    type="radio"
                    name="destination"
                    checked={mergeDestination === 'new'}
                    onChange={() => handleDestinationChange('new')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      Create new agent
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      All tickets go to a new agent. Both {agent1?.name} and {agent2?.name} will be deleted.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Final values */}
            <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <Label className="text-sm font-medium">Final agent details</Label>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-500">Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={mergeFinalValues.name}
                      onChange={(e) => setMergeFinalValues(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1"
                      placeholder="Enter agent name"
                    />
                    {mergeDestination === 'new' && (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setMergeFinalValues(prev => ({ ...prev, name: agent1?.name || '' }))}
                          className={`px-3 py-1 text-xs rounded border whitespace-nowrap ${mergeFinalValues.name === agent1?.name ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                        >
                          {agent1?.name}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setMergeFinalValues(prev => ({ ...prev, name: agent2?.name || '' }))}
                          className={`px-3 py-1 text-xs rounded border whitespace-nowrap ${mergeFinalValues.name === agent2?.name ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                        >
                          {agent2?.name}
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-500">Position</Label>
                    <div className="flex gap-2">
                      <Input
                        value={mergeFinalValues.position}
                        onChange={(e) => setMergeFinalValues(prev => ({ ...prev, position: e.target.value }))}
                        className="flex-1"
                        placeholder="Position"
                      />
                    </div>
                    {(agent1?.position || agent2?.position) && (
                      <div className="flex gap-1 flex-wrap">
                        {agent1?.position && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setMergeFinalValues(prev => ({ ...prev, position: agent1.position }))}
                            className={`px-2 py-0.5 text-xs rounded border ${mergeFinalValues.position === agent1.position ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                          >
                            {agent1.position}
                          </motion.button>
                        )}
                        {agent2?.position && agent2.position !== agent1?.position && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setMergeFinalValues(prev => ({ ...prev, position: agent2.position }))}
                            className={`px-2 py-0.5 text-xs rounded border ${mergeFinalValues.position === agent2.position ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                          >
                            {agent2.position}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-500">Team</Label>
                    <div className="flex gap-2">
                      <Input
                        value={mergeFinalValues.team}
                        onChange={(e) => setMergeFinalValues(prev => ({ ...prev, team: e.target.value }))}
                        className="flex-1"
                        placeholder="Team"
                      />
                    </div>
                    {(agent1?.team || agent2?.team) && (
                      <div className="flex gap-1 flex-wrap">
                        {agent1?.team && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setMergeFinalValues(prev => ({ ...prev, team: agent1.team }))}
                            className={`px-2 py-0.5 text-xs rounded border ${mergeFinalValues.team === agent1.team ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                          >
                            {agent1.team}
                          </motion.button>
                        )}
                        {agent2?.team && agent2.team !== agent1?.team && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setMergeFinalValues(prev => ({ ...prev, team: agent2.team }))}
                            className={`px-2 py-0.5 text-xs rounded border ${mergeFinalValues.team === agent2.team ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                          >
                            {agent2.team}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitMerge className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900 dark:text-purple-100">Summary</span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {mergeDestination === 'new' ? (
                  <>
                    Creating new agent "<strong>{mergeFinalValues.name || '(enter name)'}</strong>" with{' '}
                    <strong>{(agent1?.ticketCount || 0) + (agent2?.ticketCount || 0)}</strong> total tickets.
                    Both original agents will be removed.
                  </>
                ) : mergeDestination === 'first' ? (
                  <>
                    Moving <strong>{agent2?.ticketCount || 0}</strong> tickets from {agent2?.name} to{' '}
                    <strong>{mergeFinalValues.name}</strong>. Total: <strong>{(agent1?.ticketCount || 0) + (agent2?.ticketCount || 0)}</strong> tickets.
                  </>
                ) : (
                  <>
                    Moving <strong>{agent1?.ticketCount || 0}</strong> tickets from {agent1?.name} to{' '}
                    <strong>{mergeFinalValues.name}</strong>. Total: <strong>{(agent1?.ticketCount || 0) + (agent2?.ticketCount || 0)}</strong> tickets.
                  </>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMergeDialog({ open: false })}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              disabled={mergeSubmitting}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMerge}
              disabled={!mergeFinalValues.name.trim() || mergeSubmitting}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mergeSubmitting && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-4 h-4" />
                </motion.div>
              )}
              Merge Agents
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default QAAllAgents;
