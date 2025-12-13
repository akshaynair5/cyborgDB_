// src/pages/Profile.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Edit,
  Save,
  X,
  Key,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user } = useApp();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    department: user?.department || '',
    specialization: user?.specialization || '',
    bio: user?.bio || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const [hospital, setHospital] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(false);
  const [showHospital, setShowHospital] = useState(false);

  const fetchHospital = async () => {
    if (!user?.hospital) {
      toast.error('No hospital assigned to this user');
      return;
    }
    try {
      setLoadingHospital(true);
      const res = await api.getHospitalById(user.hospital);
      const payload = res?.data?.data?.hospital || res?.data?.hospital || res?.data || null;
      setHospital(payload);
      setShowHospital(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hospital details');
    } finally {
      setLoadingHospital(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover & Avatar */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                </div>
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                  {user?.role || 'Staff'}
                </span>
                {profile.department && (
                  <span className="text-gray-500 text-sm">{profile.department}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchHospital}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
              >
                {loadingHospital ? 'Loading...' : 'View Hospital'}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField
              icon={User}
              label="First Name"
              value={profile.firstName}
              editing={editing}
              onChange={(val) => handleChange('firstName', val)}
            />
            <ProfileField
              icon={User}
              label="Last Name"
              value={profile.lastName}
              editing={editing}
              onChange={(val) => handleChange('lastName', val)}
            />
            <ProfileField
              icon={Mail}
              label="Email"
              value={profile.email}
              editing={editing}
              onChange={(val) => handleChange('email', val)}
              type="email"
            />
            <ProfileField
              icon={Phone}
              label="Phone"
              value={profile.phone}
              editing={editing}
              onChange={(val) => handleChange('phone', val)}
              type="tel"
            />
            <ProfileField
              icon={MapPin}
              label="Address"
              value={profile.address}
              editing={editing}
              onChange={(val) => handleChange('address', val)}
              className="md:col-span-2"
            />
            <ProfileField
              icon={Shield}
              label="Department"
              value={profile.department}
              editing={editing}
              onChange={(val) => handleChange('department', val)}
            />
            <ProfileField
              icon={User}
              label="Specialization"
              value={profile.specialization}
              editing={editing}
              onChange={(val) => handleChange('specialization', val)}
            />
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            {editing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write a short bio..."
              />
            ) : (
              <p className="text-gray-600">{profile.bio || 'No bio added yet.'}</p>
            )}
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hospital Modal */}
      {showHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHospital(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Hospital Details</h3>
              <button onClick={() => setShowHospital(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            {!hospital ? (
              <div className="text-center py-10 text-gray-500">No hospital information available.</div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-gray-800">{hospital.name || hospital.hospitalName || 'Hospital'}</p>
                {hospital.address && <p className="text-gray-600">{hospital.address}</p>}
                {hospital.contactNumber && <p className="text-gray-600">Phone: {hospital.contactNumber}</p>}
                {hospital.email && <p className="text-gray-600">Email: {hospital.email}</p>}
                <div className="pt-4">
                  <button onClick={() => setShowHospital(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Key size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Password & Security</h3>
              <p className="text-sm text-gray-500">Manage your password and security settings</p>
            </div>
          </div>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Change Password
            </button>
          )}
        </div>

        {changingPassword && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setPasswords({ current: '', new: '', confirm: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

        {/* Last Login Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          Last login: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Profile Field Component
const ProfileField = ({ icon: Icon, label, value, editing, onChange, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {editing ? (
      <div className="relative">
        <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    ) : (
      <div className="flex items-center gap-2 text-gray-600">
        <Icon size={18} className="text-gray-400" />
        <span>{value || 'Not specified'}</span>
      </div>
    )}
  </div>
);

export default Profile;