import React, { useState } from 'react';

export const HINTS_DATA = {
  Git: [
    "The current branch is not the whole story.",
    "Look at commit metadata and removed files.",
    "Compare author and committer dates; recover validation_summary.md."
  ],
  MIRROR: [
    "Anonymous does not always mean unidentifiable.",
    "Compare retained attributes with the separate roster.",
    "Match MIR-1042 and inspect the sync/export diagnostics."
  ],
  Notes: [
    "The activity log knows more than the notes list.",
    "Check the unknown device and Settings.",
    "The version number opens the private note."
  ],
  OSINT: [
    "A username is not a person.",
    "Compare the directory with older announcements",
    "Find the historical purpose of orion-review-17."
  ]
};

export default function Hints() {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [unlockedState, setUnlockedState] = useState({
    Git: 0,
    MIRROR: 0,
    Notes: 0,
    OSINT: 0,
  });
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const totalUnlockedCount = Object.values(unlockedState).reduce((acc, count) => acc + count, 0);

  // Simply change domain without auto-unlocking
  const handleDomainChange = (e) => {
    const domain = e.target.value;
    setSelectedDomain(domain);
    if (domain && unlockedState[domain] > 0) {
      setActiveHintIndex(unlockedState[domain] - 1);
    } else {
      setActiveHintIndex(0);
    }
  };

  // Confirm and unlock next hint
  const handleConfirmUnlock = () => {
    if (!selectedDomain) return;

    const currentUnlocked = unlockedState[selectedDomain];
    const maxHints = HINTS_DATA[selectedDomain].length;

    if (currentUnlocked < maxHints) {
      const newUnlockedCount = currentUnlocked + 1;
      setUnlockedState((prev) => ({
        ...prev,
        [selectedDomain]: newUnlockedCount,
      }));
      setActiveHintIndex(newUnlockedCount - 1);
    }

    setShowConfirmModal(false);
  };

  const unlockedForDomain = selectedDomain ? unlockedState[selectedDomain] : 0;
  const maxHintsForDomain = selectedDomain ? HINTS_DATA[selectedDomain].length : 0;
  const currentHintsList = selectedDomain ? HINTS_DATA[selectedDomain] : [];
  const isAllUnlocked = selectedDomain && unlockedForDomain === maxHintsForDomain;

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
            {Object.keys(HINTS_DATA).map((domain) => (
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
            {currentHintsList[activeHintIndex]}
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