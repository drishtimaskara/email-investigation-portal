import React, { useState, useEffect } from 'react';

const MODULES = ['Git', 'MIRROR', 'Notes', 'OSINT'];

export default function Hints({ teamId = 1 }) {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [allHints, setAllHints] = useState([]);
  const [totalUnlockedCount, setTotalUnlockedCount] = useState(0);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch hints & team progress from backend
  const fetchHints = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/hints?team_id=${teamId}`);
      if (!res.ok) throw new Error('Failed to fetch hints');
      const data = await res.json();
      setAllHints(data.hints || []);
      setTotalUnlockedCount(data.total_hints_used || 0);
    } catch (err) {
      console.error('Error fetching hints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + periodic polling for real-time team sync across tabs/devices
  useEffect(() => {
    fetchHints();

    const interval = setInterval(() => {
      fetchHints();
    }, 3000);

    const handleFocus = () => fetchHints();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [teamId]);

  // Hints belonging to the selected domain
  const domainHints = selectedDomain
    ? allHints.filter((h) => h.module === selectedDomain)
    : [];

  // Filter only those unlocked for the selected domain
  const unlockedDomainHints = domainHints.filter((h) => h.is_unlocked);
  const unlockedForDomain = unlockedDomainHints.length;
  const maxHintsForDomain = domainHints.length || 3;
  const isAllUnlocked = selectedDomain && unlockedForDomain === maxHintsForDomain;

  const handleDomainChange = (e) => {
    const domain = e.target.value;
    setSelectedDomain(domain);

    const domainUnlockedCount = allHints.filter(
      (h) => h.module === domain && h.is_unlocked
    ).length;

    if (domain && domainUnlockedCount > 0) {
      setActiveHintIndex(domainUnlockedCount - 1);
    } else {
      setActiveHintIndex(0);
    }
  };

  // Confirm and unlock next hint in DB
  const handleConfirmUnlock = async () => {
    if (!selectedDomain) return;

    const nextLockedHint = domainHints.find((h) => !h.is_unlocked);

    if (nextLockedHint) {
      try {
        const res = await fetch(`http://localhost:5001/api/hints/${nextLockedHint.id}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_id: teamId }),
        });

        if (!res.ok) throw new Error('Failed to unlock hint');

        await fetchHints();
        setActiveHintIndex(unlockedForDomain);
      } catch (err) {
        console.error('Error unlocking hint:', err);
      }
    }

    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 min-h-[80vh] flex items-center justify-center text-slate-500 text-sm">
        Loading hints...
      </div>
    );
  }

  return (
    <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 min-h-[80vh] relative">
      {/* Top Bar with Counter */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Hints & Insights</h1>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
          Total Hints Unlocked: {totalUnlockedCount}
        </div>
      </div>

      {/* Domain Selection & Unlock Action */}
      <div className="mb-6 flex items-end space-x-3 max-w-sm">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Domain:
          </label>
          <select
            value={selectedDomain}
            onChange={handleDomainChange}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Choose a Module</option>
            {MODULES.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>

        {/* Plus Button to Unlock Next Hint */}
        <button
          disabled={!selectedDomain || isAllUnlocked}
          onClick={() => setShowConfirmModal(true)}
          title={
            !selectedDomain
              ? 'Select a domain first'
              : isAllUnlocked
              ? 'All hints unlocked for this domain'
              : 'Unlock new hint'
          }
          className="h-[42px] px-4 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {/* Hint Display Box */}
      {selectedDomain && unlockedForDomain > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 max-w-4xl">
          <p className="text-sm text-slate-700 leading-relaxed mb-6">
            {unlockedDomainHints[activeHintIndex]?.content}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <button
                disabled={activeHintIndex === 0}
                onClick={() => setActiveHintIndex((prev) => prev - 1)}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                ← Prev
              </button>
              <button
                disabled={activeHintIndex === unlockedForDomain - 1}
                onClick={() => setActiveHintIndex((prev) => prev + 1)}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {!selectedDomain
            ? "Select a domain above to view unlocked hints or unlock a new one."
            : "No hints unlocked for this domain yet. Click '+' above to unlock your first hint!"}
        </p>
      )}

      {/* Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Unlock Hint for {selectedDomain}?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to unlock hint #{unlockedForDomain + 1} for{' '}
              <span className="font-semibold">{selectedDomain}</span>?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Yes, Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}