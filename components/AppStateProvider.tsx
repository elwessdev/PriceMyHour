import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { calculateRate, type CalcOutcome, type RateField } from '@/lib/calc';
import type { CurrencySetting } from '@/lib/format';
import {
  DEFAULT_STATE,
  formToInputs,
  loadPresets,
  loadState,
  newPresetId,
  savePresets,
  saveState,
  type Preset,
  type ProjectForm,
  type RateForm,
} from '@/lib/storage';

interface AppState {
  ready: boolean;
  form: RateForm;
  currency: CurrencySetting;
  project: ProjectForm;
  presets: Preset[];
  outcome: CalcOutcome;
  setField: (field: RateField, value: string) => void;
  setCurrency: (currency: CurrencySetting) => void;
  setProjectField: (field: keyof ProjectForm, value: string) => void;
  resetForm: () => void;
  /** Returns false when the current inputs are invalid and nothing was saved. */
  addPreset: (name: string) => boolean;
  deletePreset: (id: string) => void;
  applyPreset: (preset: Preset) => void;
}

const AppStateContext = createContext<AppState | null>(null);

const SAVE_DEBOUNCE_MS = 400;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<RateForm>(DEFAULT_STATE.form);
  const [currency, setCurrency] = useState<CurrencySetting>(DEFAULT_STATE.currency);
  const [project, setProject] = useState<ProjectForm>(DEFAULT_STATE.project);
  const [presets, setPresets] = useState<Preset[]>([]);

  // Hydrate from storage once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadState(), loadPresets()])
      .then(([state, savedPresets]) => {
        if (cancelled) return;
        setForm(state.form);
        setCurrency(state.currency);
        setProject(state.project);
        setPresets(savedPresets);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save last-used inputs (debounced) once hydrated.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveState({ form, currency, project });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, form, currency, project]);

  const outcome = useMemo(() => calculateRate(formToInputs(form)), [form]);

  const setField = useCallback((field: RateField, value: string) => {
    setForm((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const setProjectField = useCallback((field: keyof ProjectForm, value: string) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => setForm(DEFAULT_STATE.form), []);

  const updatePresets = useCallback((updater: (prev: Preset[]) => Preset[]) => {
    setPresets((prev) => {
      const next = updater(prev);
      void savePresets(next);
      return next;
    });
  }, []);

  const addPreset = useCallback(
    (name: string) => {
      if (!outcome.ok) return false;
      const preset: Preset = {
        id: newPresetId(),
        name: name.trim().slice(0, 40) || 'Untitled preset',
        createdAt: Date.now(),
        hourlyRate: outcome.result.hourlyRate,
        form,
        currency,
      };
      updatePresets((prev) => [preset, ...prev]);
      return true;
    },
    [outcome, form, currency, updatePresets],
  );

  const deletePreset = useCallback(
    (id: string) => updatePresets((prev) => prev.filter((p) => p.id !== id)),
    [updatePresets],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setForm(preset.form);
    setCurrency(preset.currency);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      form,
      currency,
      project,
      presets,
      outcome,
      setField,
      setCurrency,
      setProjectField,
      resetForm,
      addPreset,
      deletePreset,
      applyPreset,
    }),
    [ready, form, currency, project, presets, outcome, setField, setProjectField, resetForm, addPreset, deletePreset, applyPreset],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
