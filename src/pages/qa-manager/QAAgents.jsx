import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Users, Edit, Trash2, Eye, Download, Play, ChevronDown, ChevronRight,
  Loader2, CheckCircle, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useQAManager } from '../../context/QAManagerContext';
import { Button, LoadingSkeleton, EmptyState, GlassActions, GlassActionButton, GlassActionDivider } from './components';

const QAAgents = () => {
  const {
    loading,
    agents,
    allExistingAgents,
    expandedAgentId,
    agentIssues,
    validationErrors,
    extensionLogs,
    extensionActive,
    extensionLogsRef,
    // Dialogs
    agentDialog,
    setAgentDialog,
    addExistingAgentDialog,
    setAddExistingAgentDialog,
    similarAgentDialog,
    setSimilarAgentDialog,
    deleteDialog,
    setDeleteDialog,
    // Functions
    fetchAgents,
    fetchAllExistingAgents,
    handleCreateAgent,
    handleUpdateAgent,
    handleDeleteAgent,
    handleAddExistingAgent,
    handleConfirmSimilarAgent,
    handleViewAgentTickets,
    handleExportMaestro,
    handleStartGrading,
    handleAgentExpand,
    handleSort,
    getSortedData,
    handleCancelExtension,
    handleClearExtensionLogs,
  } = useQAManager();

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const sortedAgents = getSortedData(agents);

  // Agent Dialog Content
  const AgentDialogContent = () => {
    const [formData, setFormData] = React.useState({
      name: agentDialog.data?.name || '',
      email: agentDialog.data?.email || '',
      position: agentDialog.data?.position || '',
      team: agentDialog.data?.team || '',
      maestroName: agentDialog.data?.maestroName || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (agentDialog.mode === 'create') {
        handleCreateAgent(formData);
      } else {
        handleUpdateAgent(agentDialog.data._id, formData);
      }
    };

    const isHighlighted = validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id;

    return (
      <Dialog open={agentDialog.open} onOpenChange={(open) => setAgentDialog({ ...agentDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {agentDialog.mode === 'create' ? 'Add New Agent' : 'Edit Agent'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-neutral-400">
              {agentDialog.mode === 'create' ? 'Create a new QA agent to track' : 'Update agent information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Agent name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className={`text-sm font-medium ${isHighlighted ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-neutral-300'}`}>
                MaestroQA Name {isHighlighted && <span className="text-xs">(Required for grading)</span>}
              </Label>
              <Input
                value={formData.maestroName}
                onChange={(e) => setFormData({ ...formData, maestroName: e.target.value })}
                placeholder="Name as it appears in MaestroQA"
                className={`mt-1 ${isHighlighted ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}
                autoFocus={isHighlighted}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Position</Label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">Select position</option>
                <option value="Notes">Notes</option>
                <option value="Junior Scorecard">Junior Scorecard</option>
                <option value="Medior Scorecard">Medior Scorecard</option>
                <option value="Senior Scorecard">Senior Scorecard</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Team</Label>
              <Input
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="Team name"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAgentDialog({ open: false, mode: 'create', data: null })}>
                Cancel
              </Button>
              <Button type="submit" variant="glass">
                {agentDialog.mode === 'create' ? 'Create Agent' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Add Existing Agent Dialog
  const AddExistingAgentDialogContent = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const existingAgentIds = agents.map(a => a._id);
    const availableAgents = allExistingAgents.filter(
      a => !existingAgentIds.includes(a._id) &&
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Dialog open={addExistingAgentDialog.open} onOpenChange={(open) => setAddExistingAgentDialog({ open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Existing Agent</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-neutral-400">
              Select an agent from the system to add to your grading list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agents..."
              className="w-full"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableAgents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-neutral-400 text-center py-4">
                  No matching agents found
                </p>
              ) : (
                availableAgents.map(agent => (
                  <button
                    key={agent._id}
                    onClick={() => handleAddExistingAgent(agent._id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                      {agent.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">{agent.position || 'No position'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddExistingAgentDialog({ open: false })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Similar Agent Dialog
  const SimilarAgentDialogContent = () => {
    const [selectedAgent, setSelectedAgent] = React.useState(null);

    return (
      <Dialog open={similarAgentDialog.open} onOpenChange={(open) => setSimilarAgentDialog({ ...similarAgentDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Similar Agent Found</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-neutral-400">
              We found similar agents in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Did you want to add one of these existing agents?
            </p>
            <div className="space-y-2">
              {similarAgentDialog.similarAgents.map(agent => (
                <label
                  key={agent._id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="similarAgent"
                    value={agent._id}
                    checked={selectedAgent === agent._id}
                    onChange={() => setSelectedAgent(agent._id)}
                    className="text-black dark:text-white"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                      {agent.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      {agent.position && (
                        <p className="text-xs text-gray-500 dark:text-neutral-400">{agent.position}</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-neutral-800 rounded-lg">
              <input
                type="radio"
                name="similarAgent"
                value="create-new"
                checked={selectedAgent === 'create-new'}
                onChange={() => setSelectedAgent('create-new')}
                className="text-black dark:text-white"
              />
              <label className="text-sm text-gray-700 dark:text-neutral-300 cursor-pointer">
                No, create new agent: <strong>{similarAgentDialog.newAgentName}</strong>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setSimilarAgentDialog({ open: false, similarAgents: [], newAgentName: '', formData: null });
              setSelectedAgent(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="glass"
              onClick={() => {
                if (selectedAgent === 'create-new') {
                  handleConfirmSimilarAgent(null);
                } else if (selectedAgent) {
                  handleConfirmSimilarAgent(selectedAgent);
                }
                setSelectedAgent(null);
              }}
              disabled={!selectedAgent}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete Dialog
  const DeleteDialogContent = () => (
    <Dialog open={deleteDialog.open && deleteDialog.type === 'agent'} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Remove Agent</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-neutral-400">
            This will remove the agent from your grading list
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          Are you sure you want to remove <strong>{deleteDialog.name}</strong> from your list?
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => handleDeleteAgent(deleteDialog.id)}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agents</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Manage QA agents for this week's grading</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm" onClick={() => {
            fetchAllExistingAgents();
            setAddExistingAgentDialog({ open: true });
          }}>
            <Users className="w-4 h-4 mr-1.5" />
            Add Existing
          </Button>
          <Button variant="glass" size="sm" onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Agent
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : agents.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <EmptyState
            icon={Users}
            title="No agents found"
            description="Get started by creating your first QA agent."
            action={
              <Button variant="glass" onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Agent
              </Button>
            }
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
              <tr>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Position</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Team</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sortedAgents.map((agent) => {
                const isExpanded = expandedAgentId === agent._id;
                const isHighlightedForValidation = validationErrors.validationMode && validationErrors.highlightedAgentId === agent._id;
                return (
                  <React.Fragment key={agent._id}>
                    <tr
                      className={`group transition-colors ${
                        isHighlightedForValidation
                          ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-400 dark:ring-red-500 ring-inset'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                      }`}
                      title={isHighlightedForValidation ? 'MaestroQA Name is required' : ''}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleAgentExpand(agent._id)}
                          className="flex items-center gap-3 w-full text-left group/name"
                        >
                          <div className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                          <div className="w-7 h-7 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                            {agent.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover/name:text-blue-600 dark:group-hover/name:text-blue-400 transition-colors">{agent.name}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">{agent.position || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">{agent.team || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <GlassActions>
                            <GlassActionButton
                              onClick={() => handleStartGrading(agent._id, 'agents')}
                              title="Start Grading (Extension)"
                              variant="success"
                              isFirst
                            >
                              <Play className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/success:text-green-500 dark:group-hover/success:text-green-400 transition-colors" />
                            </GlassActionButton>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => handleViewAgentTickets(agent._id)}
                              title="View Tickets"
                              variant="primary"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/primary:text-blue-500 dark:group-hover/primary:text-blue-400 transition-colors" />
                            </GlassActionButton>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => handleExportMaestro(agent._id)}
                              title="Export"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300" />
                            </GlassActionButton>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => setAgentDialog({ open: true, mode: 'edit', data: agent })}
                              title={isHighlightedForValidation ? 'Click to add MaestroQA Name' : 'Edit'}
                              className={isHighlightedForValidation ? 'bg-red-100 dark:bg-red-900/50 ring-2 ring-red-400 dark:ring-red-500 animate-pulse' : ''}
                            >
                              <Edit className={`w-3.5 h-3.5 ${isHighlightedForValidation ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-neutral-300'}`} />
                            </GlassActionButton>
                            <GlassActionDivider />
                            <GlassActionButton
                              onClick={() => setDeleteDialog({ open: true, type: 'agent', id: agent._id, name: agent.name })}
                              title="Remove"
                              variant="danger"
                              isLast
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-300 group-hover/delete:text-red-500 dark:group-hover/delete:text-red-400 transition-colors" />
                            </GlassActionButton>
                          </GlassActions>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row - Agent Issues */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50 dark:bg-neutral-900/50">
                        <td colSpan={4} className="px-4 py-4">
                          <div className="ml-8">
                            {agentIssues.loading ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading issues...
                              </div>
                            ) : agentIssues.data?.unresolvedCount === 0 ? (
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                No unresolved issues - great performance!
                              </div>
                            ) : agentIssues.data?.issues?.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="w-4 h-4" />
                                  {agentIssues.data.unresolvedCount} unresolved issue{agentIssues.data.unresolvedCount !== 1 ? 's' : ''} (last 3 weeks)
                                </div>
                                <div className="grid gap-2">
                                  {agentIssues.data.issues.map((issue, idx) => (
                                    <div
                                      key={issue.ticketId || idx}
                                      className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500 dark:text-neutral-500">
                                              {issue.ticketNumber}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                              issue.qualityScore < 70
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                : issue.qualityScore < 80
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            }`}>
                                              {issue.qualityScore}%
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-900 dark:text-white">
                                            {issue.summary}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-neutral-400">
                                No issues data available
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Extension Logs Panel */}
      {extensionLogs.length > 0 && (
        <div className="mt-6 bg-gray-900 dark:bg-black border border-gray-700 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-neutral-900 border-b border-gray-700 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${extensionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm font-medium text-white">Extension Logs</span>
              <span className="text-xs text-gray-400">({extensionLogs.length} entries)</span>
            </div>
            <div className="flex items-center gap-2">
              {extensionActive && (
                <button
                  onClick={handleCancelExtension}
                  className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleClearExtensionLogs}
                className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div
            ref={extensionLogsRef}
            className="p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1"
          >
            {extensionLogs.map((log, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  log.level === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}
              >
                <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AgentDialogContent />
      <AddExistingAgentDialogContent />
      <SimilarAgentDialogContent />
      <DeleteDialogContent />
    </div>
  );
};

export default QAAgents;
