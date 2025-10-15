import { uploadToCloudinary } from '../../services/uploadToCloudinary';

// Use environment variable if available, else fallback to hardcoded
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'diecgt687';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned';
  // Cloudinary config (replace with your own values)
  // (Cloud name and preset are now set above)
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
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [creditsPerHour, setCreditsPerHour] = useState<number>(1.0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Handle image file selection
  // Allow multiple image selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  // Simple level rule: allow custom pricing once user has >= 5 reviews and rating >= 4.5
  const canSetCustomCredits = !!user && user.total_reviews >= 5 && user.reputation_score >= 4.5;

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
    setError('');
    setUploading(false);
    setUploadProgress(0);
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        for (let i = 0; i < imageFiles.length; i++) {
          const url = await uploadToCloudinary(imageFiles[i], CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
          imageUrls.push(url);
          setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
        }
        setUploading(false);
      }
      await dataService.createService({
        provider_id: user.id,
        skill_id: skillId,
        title,
        description,
        credits_per_hour: canSetCustomCredits ? creditsPerHour : 1.0,
        status: 'active',
        type,
        imageUrls,
      });
      onClose();
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      console.error('Failed to create service:', error);
      setError((error as any).message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <label className="block font-medium mb-1">Service Images (multiple allowed)</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} />
          <div className="flex gap-2 mt-2">
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt="preview" className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
          {uploading && (
            <div className="mt-2 text-sm text-blue-600">Uploading images... {uploadProgress}%</div>
          )}
          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}
        </div>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Post a Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits per hour</label>
                  {canSetCustomCredits ? (
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={creditsPerHour}
                      onChange={(e) => setCreditsPerHour(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  ) : (
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      You currently earn at the default rate of <span className="font-semibold">1.0 credit/hr</span>.
                      Reach <span className="font-semibold">level</span> (≥ 5 reviews, rating ≥ 4.5) to set your own rate.
                    </div>
                  )}
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

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