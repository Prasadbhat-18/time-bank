import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';
import { Skill } from '../../types';
import { dataService } from '../../services/dataService';

interface ServiceModalProps {
  onClose: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillId, setSkillId] = useState('');
  const [type, setType] = useState<'offer' | 'request'>('offer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    const skillsData = await dataService.getSkills();
    setSkills(skillsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await dataService.createService({
        provider_id: user.id,
        skill_id: skillId,
        title,
        description,
        credits_per_hour: 1.0,
        status: 'active',
        type,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Post a Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('offer')}
                className={`p-4 rounded-lg border-2 transition ${
                  type === 'offer'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">I'm Offering</div>
                <div className="text-sm opacity-75">A service I can provide</div>
              </button>
              <button
                type="button"
                onClick={() => setType('request')}
                className={`p-4 rounded-lg border-2 transition ${
                  type === 'request'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">I'm Requesting</div>
                <div className="text-sm opacity-75">A service I need</div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Category
            </label>
            <select
              id="skill"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            >
              <option value="">Select a skill</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Service Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React & TypeScript Development Help"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're offering or what you need help with..."
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              required
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Note:</span> All services are priced at 1 time credit per hour.
              This ensures fair exchange across all skill levels.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};