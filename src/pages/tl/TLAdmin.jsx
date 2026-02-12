import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Loader2, Save, Check, Search, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const TLAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editState, setEditState] = useState({});

  const isAdmin = user?.email?.toLowerCase() === 'filipkozomara@mebit.io' || user?.role === 'admin';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignRes, tlRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/tl/admin/assignments`, getAuthHeaders()),
        axios.get(`${API_URL}/api/tl/admin/team-leaders`, getAuthHeaders()),
        axios.get(`${API_URL}/api/tl/available-teams`, getAuthHeaders())
      ]);

      setAssignments(assignRes.data.assignments || []);
      setAvailableTeams(assignRes.data.availableTeams || teamsRes.data.teams || []);
      setTeamLeaders(tlRes.data || []);

      const state = {};
      (tlRes.data || []).forEach(tl => {
        const assignment = (assignRes.data.assignments || []).find(
          a => a.userId?._id === tl._id || a.userId === tl._id
        );
        state[tl._id] = assignment?.teams || [];
      });
      setEditState(state);
    } catch (err) {
      console.error('Error fetching TL admin data:', err);
      if (err.response?.status === 403) {
        toast.error('Nemas pristup admin panelu');
        navigate('/tl');
      } else {
        toast.error('Greska pri ucitavanju');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/tl');
      return;
    }
    fetchData();
  }, [fetchData, isAdmin, navigate]);

  const toggleTeam = (userId, teamName) => {
    setEditState(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(teamName)
        ? current.filter(t => t !== teamName)
        : [...current, teamName];
      return { ...prev, [userId]: updated };
    });
  };

  const handleSave = async (userId) => {
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.put(
        `${API_URL}/api/tl/admin/assignments/${userId}`,
        { teams: editState[userId] || [] },
        getAuthHeaders()
      );
      toast.success('Timovi sacuvani');
    } catch (err) {
      console.error('Error saving assignment:', err);
      toast.error('Greska pri cuvanju');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const hasChanges = (userId) => {
    const assignment = assignments.find(
      a => a.userId?._id === userId || a.userId === userId
    );
    const original = assignment?.teams || [];
    const current = editState[userId] || [];
    return JSON.stringify([...original].sort()) !== JSON.stringify([...current].sort());
  };

  const filteredTeamLeaders = teamLeaders.filter(tl => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tl.name?.toLowerCase().includes(q) || tl.email?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED] flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
            Team Leader Assignments
          </h2>
          <p className="text-sm text-gray-400 dark:text-[#5B5D67] mt-1 ml-6">
            Dodeli timove svakom Team Leader-u.
          </p>
        </div>

        {teamLeaders.length > 2 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretrazi..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#1E1E28] rounded bg-white dark:bg-[#1A1A21] text-gray-900 dark:text-[#E8E9ED] placeholder-gray-400 dark:placeholder-[#5B5D67] focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#3A3A45] focus:border-gray-300 dark:focus:border-[#3A3A45] w-full sm:w-52"
            />
          </div>
        )}
      </div>

      {teamLeaders.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-8 h-8 mx-auto text-gray-200 dark:text-[#2A2A35] mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#6B6D77]">
            Nema korisnika sa TL role-om.
          </p>
          <p className="text-xs text-gray-400 dark:text-[#5B5D67] mt-1">
            Promeni role korisnika na "tl" da bi se pojavio ovde.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg">
          {filteredTeamLeaders.map((tl, idx) => (
            <div
              key={tl._id}
              className={`px-5 sm:px-6 py-5 ${idx < filteredTeamLeaders.length - 1 ? 'border-b border-gray-200/40 dark:border-[#1E1E28]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0 sm:w-56 flex-shrink-0">
                  <div className="w-9 h-9 rounded bg-white dark:bg-[#1A1A21] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600 dark:text-[#A0A2AC]">
                      {tl.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-[#E8E9ED] truncate">{tl.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-[#5B5D67] truncate">{tl.email}</p>
                  </div>
                </div>

                {/* Team Chips + Save */}
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {availableTeams.map(team => {
                    const isSelected = (editState[tl._id] || []).includes(team);
                    return (
                      <button
                        key={team}
                        onClick={() => toggleTeam(tl._id, team)}
                        className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'bg-gray-900 dark:bg-[#E8E9ED] border-gray-900 dark:border-[#E8E9ED] text-white dark:text-[#0C0C10]'
                            : 'bg-white dark:bg-transparent border-gray-200 dark:border-[#1E1E28] text-gray-600 dark:text-[#6B6D77] hover:border-gray-300 dark:hover:border-[#2A2A35]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {team}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handleSave(tl._id)}
                    disabled={!hasChanges(tl._id) || saving[tl._id]}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors flex-shrink-0 ${
                      hasChanges(tl._id)
                        ? 'bg-gray-900 dark:bg-[#E8E9ED] hover:bg-gray-800 dark:hover:bg-white text-white dark:text-[#0C0C10]'
                        : 'bg-white dark:bg-[#1A1A21] text-gray-400 dark:text-[#5B5D67] cursor-not-allowed'
                    }`}
                  >
                    {saving[tl._id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>

              {/* Status line */}
              <div className="flex items-center gap-1.5 mt-2 ml-12 sm:ml-[236px]">
                <span className="text-xs text-gray-400 dark:text-[#5B5D67]">
                  {(editState[tl._id] || []).length} timova
                </span>
                {hasChanges(tl._id) && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-[#3A3A45]" />
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Nesacuvano
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {filteredTeamLeaders.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <Search className="w-6 h-6 mx-auto text-gray-200 dark:text-[#2A2A35] mb-2" />
              <p className="text-sm text-gray-500 dark:text-[#6B6D77]">
                Nema rezultata za "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TLAdmin;
