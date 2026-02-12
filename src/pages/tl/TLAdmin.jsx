import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Loader2, AlertTriangle, Save, Check, X, Plus, Search, Settings
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

  // Edit state per TL
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

      // Build initial edit state
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          Team Leader Assignments
        </h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
          Dodeli timove svakom Team Leader-u. Korisnici moraju imati TL role da bi se pojavili ovde.
        </p>

        {teamLeaders.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-neutral-700 mb-3" />
            <p className="text-gray-500 dark:text-neutral-400">
              Nema korisnika sa TL role-om. Promeni role korisnika na "tl" da bi se pojavio ovde.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {teamLeaders.map(tl => (
              <div
                key={tl._id}
                className="border border-gray-200 dark:border-neutral-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tl.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">{tl.email}</p>
                  </div>
                  <button
                    onClick={() => handleSave(tl._id)}
                    disabled={!hasChanges(tl._id) || saving[tl._id]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      hasChanges(tl._id)
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {saving[tl._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Sacuvaj
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableTeams.map(team => {
                    const isSelected = (editState[tl._id] || []).includes(team);
                    return (
                      <button
                        key={team}
                        onClick={() => toggleTeam(tl._id, team)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                            : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {team}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-3">
                  {(editState[tl._id] || []).length} timova izabrano
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TLAdmin;
