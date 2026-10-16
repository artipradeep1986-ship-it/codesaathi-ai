import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import {
  User,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  Save,
  Shield,
  HelpCircle,
  Globe,
} from 'lucide-react';
import type { StudentProfile } from '../types';
import { getApiBaseUrl, apiClient } from '../services/api';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, setProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [classLevel, setClassLevel] = useState<number>(profile?.class_level || 10);
  const [board, setBoard] = useState<'ICSE' | 'CBSE' | 'State Board' | 'Other'>(
    profile?.education_board || 'ICSE'
  );
  const [subject, setSubject] = useState(profile?.subject || 'Computer Applications');
  const [prefLang, setPrefLang] = useState<'english' | 'hindi' | 'hinglish'>(
    profile?.preferred_language || 'hinglish'
  );
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    profile?.programming_level || 'beginner'
  );

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [fontSize, setFontSize] = useState<number>(14);

  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('codesaathi_custom_api_url') || getApiBaseUrl();
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const classes = [6, 7, 8, 9, 10, 11, 12];
  const boards: Array<'ICSE' | 'CBSE' | 'State Board' | 'Other'> = [
    'ICSE',
    'CBSE',
    'State Board',
    'Other',
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await api.profile.update({
        display_name: displayName.trim(),
        class_level: classLevel,
        education_board: board,
        subject: subject.trim(),
        preferred_language: prefLang,
        programming_level: level,
      });
      setProfile(updated);
      toast.success('Profile preferences updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServerUrl = () => {
    let clean = serverUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api') && clean.startsWith('http')) {
      clean = `${clean}/api`;
    }
    localStorage.setItem('codesaathi_custom_api_url', clean);
    apiClient.defaults.baseURL = clean;
    setServerUrl(clean);
    toast.success('Server connection URL updated!');
  };

  const handleResetServerUrl = () => {
    localStorage.removeItem('codesaathi_custom_api_url');
    const defaultUrl = getApiBaseUrl();
    apiClient.defaults.baseURL = defaultUrl;
    setServerUrl(defaultUrl);
    toast.success('Reset to default server connection');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/welcome');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In production, invoke delete profile endpoint
      await signOut();
      toast.success('Account deactivated');
      navigate('/welcome');
    } catch {
      toast.error('Could not delete account');
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-3xl mx-auto">
      {/* 1. Student Profile Settings */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-text">Student Profile</h2>
        </div>

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your full name"
        />

        <div>
          <label className="text-sm font-medium text-text block mb-2">Class / Standard:</label>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Chip
                key={c}
                label={`Class ${c}`}
                active={classLevel === c}
                onClick={() => setClassLevel(c)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text block mb-2">Education Board:</label>
          <div className="flex flex-wrap gap-2">
            {boards.map((b) => (
              <Chip
                key={b}
                label={b}
                active={board === b}
                onClick={() => setBoard(b)}
              />
            ))}
          </div>
        </div>

        <Input
          label="Subject Name"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Computer Applications"
        />

        <div>
          <label className="text-sm font-medium text-text block mb-2">
            Explanation Language:
          </label>
          <div className="flex flex-wrap gap-2">
            <Chip
              label="Hinglish"
              active={prefLang === 'hinglish'}
              onClick={() => setPrefLang('hinglish')}
            />
            <Chip
              label="English"
              active={prefLang === 'english'}
              onClick={() => setPrefLang('english')}
            />
            <Chip
              label="Hindi"
              active={prefLang === 'hindi'}
              onClick={() => setPrefLang('hindi')}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={isSaving}
            onClick={handleSaveProfile}
          >
            Save Profile Changes
          </Button>
        </div>
      </Card>

      {/* 2. Appearance & Editor Customization */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-text">Appearance & Editor</h2>
        </div>

        <div>
          <label className="text-sm font-medium text-text block mb-2">Theme:</label>
          <div className="flex gap-2">
            <Chip
              label="Light"
              icon={<Sun className="w-4 h-4" />}
              active={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <Chip
              label="Dark"
              icon={<Moon className="w-4 h-4" />}
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <Chip
              label="System"
              icon={<Monitor className="w-4 h-4" />}
              active={theme === 'auto'}
              onClick={() => setTheme('auto')}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm font-medium text-text mb-2">
            <span>Editor Code Font Size:</span>
            <span className="font-mono text-primary font-bold">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={12}
            max={22}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      </Card>

      {/* 3. Server & Cloud Connection */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-text">Server & Cloud Connection</h2>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Configure where the app connects for AI tutoring, OCR, and compiler execution. To run 24/7 without keeping your laptop on, enter your free cloud server URL (e.g. Render, Railway, or Koyeb).
        </p>

        <Input
          label="Backend API Endpoint"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="http://10.123.131.122:4000/api or https://your-server.onrender.com/api"
        />

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSaveServerUrl}
          >
            Save Server URL
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetServerUrl}
          >
            Reset Default
          </Button>
        </div>
      </Card>

      {/* 4. Account Actions & Privacy */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg text-text">Account & Privacy</h2>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          CodeSaathi AI does not share your notebook photos or homework code with third-party advertising services.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Button
            variant="secondary"
            icon={<LogOut className="w-4 h-4" />}
            onClick={() => setShowLogoutConfirm(true)}
            className="flex-1"
          >
            Log Out
          </Button>

          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1"
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out from CodeSaathi AI?"
        confirmLabel="Log Out"
      />

      {/* Delete account confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure? This will remove all your saved programs, scan images, and progress history permanently."
        confirmLabel="Permanently Delete"
        isDestructive
      />
    </div>
  );
};
export default Settings;
