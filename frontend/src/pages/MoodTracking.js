import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { moodAPI } from '../services/api';
import MoodChart from '../components/MoodTracking/MoodChart';
import MoodInsights from '../components/MoodTracking/MoodInsights';
import MoodErrorBoundary from '../components/common/MoodErrorBoundary';
import './MoodTracking.css';
import { useTheme } from '../contexts/ThemeContext';

const MoodTracking = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, _setActiveTab] = useState('overview');

  const [selectedMood, setSelectedMood] = useState(null);
  const [_showTagSelection, setShowTagSelection] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const [_isQuickSaving, setIsQuickSaving] = useState(false);
  const [, setQuickSaveSuccess] = useState(false);
  const [, setShowSuccessMessage] = useState(false);

  const [_tipsRefreshKey] = useState(0);
  const [, setSavedMoodForTips] = useState(null);

  const [_userProgress, setUserProgress] = useState({
    dayStreak: 0,
    moodScore: 0,
    totalEntries: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    neutralPercentage: 0,
    moodCounts: {
      very_sad: 0,
      sad: 0,
      neutral: 0,
      happy: 0,
      very_happy: 0
    },
    loading: true,
    error: null
  });

  const moodActivities = {
    very_sad: [
      { icon: '🧘‍♀️', title: 'Practice Deep Breathing', description: 'Take 5 deep breaths.' },
      { icon: '☀️', title: 'Get Some Sunlight', description: 'Step outside for 10 minutes.' }
    ],
    sad: [
      { icon: '🚶‍♀️', title: 'Take a Walk', description: 'A 15-minute walk can boost your mood.' },
      { icon: '🎨', title: 'Express Yourself', description: 'Draw or write your feelings.' }
    ],
    neutral: [
      { icon: '🎯', title: 'Set a Small Goal', description: 'Choose one thing to accomplish today.' },
      { icon: '🌟', title: 'Practice Gratitude', description: 'Write down 3 things you’re thankful for.' }
    ],
    happy: [
      { icon: '🎊', title: 'Celebrate Your Joy', description: 'Appreciate the moment.' },
      { icon: '📸', title: 'Capture the Moment', description: 'Take a photo or journal it.' }
    ],
    very_happy: [
      { icon: '🌟', title: 'Bask in the Moment', description: 'Fully experience this joy.' },
      { icon: '🎁', title: 'Share Your Light', description: 'Spread positivity to others.' }
    ]
  };

  const _getRandomActivities = (mood, count = 2) => {
    const activities = moodActivities[mood] || [];
    const shuffled = [...activities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleMoodAdded = () => {
    setRefreshTrigger(prev => prev + 1);

    setTimeout(() => fetchUserProgress(), 1000);

    window.dispatchEvent(
      new CustomEvent('moodDataUpdated', {
        detail: { source: 'moodTracking', timestamp: Date.now() }
      })
    );
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      setUserProgress(prev => ({ ...prev, loading: true, error: null }));

      const response = await moodAPI.getEntries({ limit: 1000 });

      if (!response?.data?.success) throw new Error('Failed to fetch entries');

      const entries = response.data.data || [];

      if (entries.length === 0) {
        setUserProgress(prev => ({ ...prev, loading: false }));
        return;
      }

      const moodValues = {
        very_sad: 1,
        sad: 2,
        neutral: 3,
        happy: 4,
        very_happy: 5
      };

      let totalMoodValue = 0;
      let validEntries = 0;

      const moodCounts = {
        very_sad: 0,
        sad: 0,
        neutral: 0,
        happy: 0,
        very_happy: 0
      };

      entries.forEach(entry => {
        if (entry.mood && moodValues[entry.mood] !== undefined) {
          totalMoodValue += moodValues[entry.mood];
          validEntries++;
          moodCounts[entry.mood]++;
        }
      });

      const moodScore =
        validEntries > 0
          ? Math.round((totalMoodValue / validEntries / 5) * 100)
          : 0;

      setUserProgress(prev => ({
        ...prev,
        moodScore,
        totalEntries: entries.length,
        moodCounts,
        loading: false
      }));
    } catch (error) {
      setUserProgress(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  const saveQuickMoodEntry = async (mood, tags = []) => {
    if (!user) return false;

    setIsQuickSaving(true);

    try {
      const moodData = {
        mood: mood.value,
        intensity: 5,
        timeOfDay: getCurrentTimeOfDay(),
        activity: 'other',
        entryMethod: 'quick_button',
        tags,
        notes: `Quick mood entry: ${mood.label}`
      };

      const response = await moodAPI.createEntry(moodData);

      if (response?.data?.success) {
        setQuickSaveSuccess(true);
        setShowSuccessMessage(true);

        handleMoodAdded();

        setTimeout(() => setShowSuccessMessage(false), 3000);

        return true;
      }

      throw new Error('Failed to save mood');
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsQuickSaving(false);
    }
  };

  const _handleMoodSelect = mood => {
    setSelectedMood(mood);
    setShowTagSelection(true);
    setSavedMoodForTips(null);
  };

  const _handleTagsSelected = async () => {
    if (!selectedMood) return;

    const saved = await saveQuickMoodEntry(selectedMood, selectedTags);

    if (saved) {
      setSavedMoodForTips(selectedMood);
      setShowTagSelection(false);
      setSelectedMood(null);
      setSelectedTags([]);
    }
  };

  const _handleTagClick = tag => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const _handleBackToMood = () => {
    setShowTagSelection(false);
    setSelectedMood(null);
    setSelectedTags([]);
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
      fetchUserProgress();
    }
    // eslint-disable-next-line
  }, [user]);

  if (loading) {
    return <div className="mood-tracking-page">Loading...</div>;
  }

  return (
    <div className="mood-tracking-page">
      {activeTab === 'analytics' && (
        <MoodErrorBoundary>
          <MoodChart refreshTrigger={refreshTrigger} isDarkMode={isDarkMode} />
        </MoodErrorBoundary>
      )}

      {activeTab === 'insights' && (
        <MoodErrorBoundary>
          <MoodInsights refreshTrigger={refreshTrigger} />
        </MoodErrorBoundary>
      )}
    </div>
  );
};

export default MoodTracking;
