import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Star, Mail, Calendar, CreditCard as Edit2, Plus, X, Phone, Shield } from 'lucide-react';
import { UserSkill, Skill } from '../../types';
import { dataService } from '../../services/dataService';
import { EmergencyContactsManager } from '../SOS/EmergencyContacts';

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillType, setSkillType] = useState<'offered' | 'needed'>('offered');
  const [proficiency, setProficiency] = useState('intermediate');
  const [activeTab, setActiveTab] = useState<'profile' | 'emergency'>('profile');

  useEffect(() => {
    if (user) {
      loadUserSkills();
      loadAllSkills();
    }
  }, [user]);

  const loadUserSkills = async () => {
    if (user) {
      const skills = await dataService.getUserSkills(user.id);
      setUserSkills(skills);
    }
  };

  const loadAllSkills = async () => {
    const skills = await dataService.getSkills();
    setAllSkills(skills);
  };

  const handleSave = async () => {
    await updateUser({ bio, username });
    setEditing(false);
  };

  const handleAddSkill = async () => {
    if (user && selectedSkillId) {
      await dataService.addUserSkill(user.id, selectedSkillId, skillType, proficiency);
      await loadUserSkills();
      setShowAddSkill(false);
      setSelectedSkillId('');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    await dataService.removeUserSkill(skillId);
    await loadUserSkills();
  };

  if (!user) return null;

  const offeredSkills = userSkills.filter((s) => s.type === 'offered');
  const neededSkills = userSkills.filter((s) => s.type === 'needed');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

        <div className="px-6 pb-6">
          <div className="flex items-start -mt-16 mb-6">
            <div className="w-32 h-32 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>

            <div className="ml-6 flex-1 mt-20">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-amber-700">{user.reputation_score.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-600">({user.total_reviews} reviews)</span>
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
              <p className="text-gray-600">{user.bio || 'No bio added yet.'}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex gap-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile & Skills
                </div>
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'emergency'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Emergency Contacts
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Skills I Offer</h2>
                <button
                  onClick={() => {
                    setSkillType('offered');
                    setShowAddSkill(true);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  <Plus className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
              <div className="space-y-2">
                {offeredSkills.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No skills added yet</p>
                ) : (
                  offeredSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div>
                        <span className="font-medium text-emerald-900">{skill.skill?.name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                          {skill.proficiency_level}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="p-1 hover:bg-emerald-200 rounded transition"
                      >
                        <X className="w-4 h-4 text-emerald-700" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Skills I Need</h2>
                <button
                  onClick={() => {
                    setSkillType('needed');
                    setShowAddSkill(true);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              <div className="space-y-2">
                {neededSkills.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No skills added yet</p>
                ) : (
                  neededSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <span className="font-medium text-blue-900">{skill.skill?.name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                          {skill.proficiency_level}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="p-1 hover:bg-blue-200 rounded transition"
                      >
                        <X className="w-4 h-4 text-blue-700" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          )}
          {activeTab === 'emergency' && (
            <EmergencyContactsManager />
          )}
        </div>
      </div>

      {showAddSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Skill</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select a skill</option>
                  {allSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                <select
                  value={proficiency}
                  onChange={(e) => setProficiency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSkill(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                disabled={!selectedSkillId}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};