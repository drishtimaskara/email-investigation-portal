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

  const totalUnlockedCount = Object.values(unlockedState).reduce((acc, count) => acc + count, 0);

  const handleDomainChange = (e) => {
    const domain = e.target.value;
    if (!domain) return;

    setSelectedDomain(domain);
    const currentUnlocked = unlockedState[domain];
    const maxHints = HINTS_DATA[domain].length;

    if (currentUnlocked < maxHints) {
      const newUnlockedCount = currentUnlocked + 1;
      setUnlockedState((prev) => ({
        ...prev,
        [domain]: newUnlockedCount,
      }));
      setActiveHintIndex(newUnlockedCount - 1);
    } else {
      setActiveHintIndex(currentUnlocked - 1);
    }
  };

  const unlockedForDomain = selectedDomain ? unlockedState[selectedDomain] : 0;
  const currentHintsList = selectedDomain ? HINTS_DATA[selectedDomain] : [];

  return (
    <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 min-h-[80vh]">
      {/* Top Bar with Counter */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Hints & Insights</h1>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
          Total Hints Unlocked: {totalUnlockedCount}
        </div>
      </div>

      {/* Domain Selection Dropdown */}
      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Domain:
        </label>
        <select
          value={selectedDomain}
          onChange={handleDomainChange}
          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Choose a Module --</option>
          {Object.keys(HINTS_DATA).map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      {/* Hint Display Box */}
      {selectedDomain && unlockedForDomain > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 max-w-4xl">
          <p className="text-sm text-slate-700 leading-relaxed">
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
          Select a domain above to unlock your first hint for that module.
        </p>
      )}
    </div>
  );
}