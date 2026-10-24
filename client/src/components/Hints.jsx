import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'

const MODULE_OPTIONS = ['Git', 'MIRROR', 'Notes', 'OSINT']

export default function Hints() {
  const { authFetch } = useAuth()

  const [hintsData, setHintsData] = useState({
    totalUnlocked: 0,
    maxHints: 5,
    modules: {},
  })
  const [selectedDomain, setSelectedDomain] = useState('')
  const [activeHintIndex, setActiveHintIndex] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [toast, setToast] = useState('')

  const showNotification = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    let cancelled = false
    authFetch('/api/hints')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load hint status from server.')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setHintsData(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err.message || 'Error loading hints')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  const handleDomainChange = (e) => {
    const domain = e.target.value
    setSelectedDomain(domain)
    const mod = hintsData.modules?.[domain]
    if (mod && mod.unlockedCount > 0) {
      setActiveHintIndex(mod.unlockedCount - 1)
    } else {
      setActiveHintIndex(0)
    }
  }

  // Confirm and unlock next hint on the server
  const handleConfirmUnlock = async () => {
    if (!selectedDomain || unlocking) return

    setUnlocking(true)
    setErrorMsg('')
    try {
      const res = await authFetch('/api/hints/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: selectedDomain }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlock hint')
      }

      // Update state with newly unlocked hint from server
      setHintsData((prev) => {
        const mod = prev.modules[selectedDomain] || {
          totalAvailable: 3,
          unlockedCount: 0,
          unlockedHints: [],
        }

        const newUnlockedHints = [...(mod.unlockedHints || []), data.unlockedHint]
        const newUnlockedCount = newUnlockedHints.length

        return {
          ...prev,
          totalUnlocked: data.totalUnlocked,
          modules: {
            ...prev.modules,
            [selectedDomain]: {
              ...mod,
              unlockedCount: newUnlockedCount,
              unlockedHints: newUnlockedHints,
              nextHintNumber:
                newUnlockedCount < mod.totalAvailable ? newUnlockedCount + 1 : null,
            },
          },
        }
      })

      const currentMod = hintsData.modules?.[selectedDomain]
      setActiveHintIndex(currentMod ? currentMod.unlockedCount : 0)
      showNotification(`Hint #${data.unlockedHint.number} unlocked for ${selectedDomain}`)
      setShowConfirmModal(false)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setUnlocking(false)
    }
  }

  const currentModule = selectedDomain ? hintsData.modules?.[selectedDomain] : null
  const unlockedHints = currentModule?.unlockedHints || []
  const unlockedCount = currentModule?.unlockedCount || 0
  const totalAvailable = currentModule?.totalAvailable || 3
  const isAllUnlocked = unlockedCount >= totalAvailable
  const isLimitReached = (hintsData.totalUnlocked || 0) >= (hintsData.maxHints || 5)

  return (
    <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 min-h-[80vh] relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-800 px-4 py-2.5 text-xs text-white shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Top Bar with Counter */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hints &amp; Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Progressive clues retrieved from server repository. Max 5 hints per team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${
              isLimitReached
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}
          >
            Hints Unlocked: {hintsData.totalUnlocked} / {hintsData.maxHints}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Domain Selection & Unlock Action */}
      <div className="mb-6 flex items-end space-x-3 max-w-sm">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Select Investigation Module:
          </label>
          <select
            value={selectedDomain}
            onChange={handleDomainChange}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Choose a Module</option>
            {MODULE_OPTIONS.map((domain) => {
              const count = hintsData.modules?.[domain]?.unlockedCount || 0
              return (
                <option key={domain} value={domain}>
                  {domain} ({count}/3 unlocked)
                </option>
              )
            })}
          </select>
        </div>

        {/* Plus Button to Unlock Next Hint */}
        <button
          disabled={!selectedDomain || isAllUnlocked || isLimitReached || unlocking}
          onClick={() => setShowConfirmModal(true)}
          title={
            !selectedDomain
              ? 'Select a module first'
              : isAllUnlocked
              ? 'All hints unlocked for this module'
              : isLimitReached
              ? 'Team limit of 5 hints reached'
              : 'Unlock next hint'
          }
          className="h-[42px] px-4 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading hints from server…</p>
      ) : selectedDomain && unlockedCount > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 max-w-4xl">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
            <span>
              {selectedDomain} &bull; Hint {activeHintIndex + 1} of {unlockedCount} unlocked
            </span>
            {unlockedHints[activeHintIndex]?.unlockedAt && (
              <span className="font-mono text-[11px] text-slate-400">
                Unlocked: {unlockedHints[activeHintIndex].unlockedAt}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-800 leading-relaxed mb-6 font-medium bg-white p-4 rounded-md border border-slate-200">
            {unlockedHints[activeHintIndex]?.content}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <button
                disabled={activeHintIndex === 0}
                onClick={() => setActiveHintIndex((prev) => prev - 1)}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                &larr; Previous Hint
              </button>
              <button
                disabled={activeHintIndex === unlockedCount - 1}
                onClick={() => setActiveHintIndex((prev) => prev + 1)}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                Next Hint &rarr;
              </button>
            </div>
            <span className="text-slate-400">
              {unlockedCount < totalAvailable
                ? `${totalAvailable - unlockedCount} more hint(s) available in this module`
                : 'All hints in this module unlocked'}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center max-w-4xl">
          <p className="text-sm text-slate-500">
            {!selectedDomain
              ? 'Select an investigation module above to view or unlock hints.'
              : 'No hints unlocked for this module yet. Click the "+" button above to unlock Hint #1!'}
          </p>
          {isLimitReached && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              Note: Your team has reached the maximum quota of 5 hints.
            </p>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-lg">
            <h3 className="text-base font-semibold text-slate-800 mb-2">
              Unlock Hint for {selectedDomain}?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to unlock{' '}
              <span className="font-semibold text-slate-900">
                Hint #{unlockedCount + 1}
              </span>{' '}
              for <span className="font-semibold text-slate-900">{selectedDomain}</span>?
            </p>
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
              <span className="font-semibold">Team quota reminder:</span> This will use hint{' '}
              <span className="font-bold">{hintsData.totalUnlocked + 1}</span> of your{' '}
              <span className="font-bold">{hintsData.maxHints}</span> total hints. This action is
              logged on the server and cannot be undone.
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={unlocking}
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={unlocking}
                onClick={handleConfirmUnlock}
                className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {unlocking ? 'Unlocking…' : 'Yes, Unlock Hint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
