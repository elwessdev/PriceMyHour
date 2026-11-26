import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RateField, RateInputs } from './calc';
import { CURRENCIES, parseNumber, type CurrencySetting } from './format';

/** Inputs are kept as raw text so the user can freely edit (and empty) fields. */
export type RateForm = Record<RateField, string>;

export interface ProjectForm {
  hours: string;
  bufferPct: string;
}

export interface SavedState {
  form: RateForm;
  currency: CurrencySetting;
  project: ProjectForm;
}

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  hourlyRate: number;
  form: RateForm;
  currency: CurrencySetting;
}

export const DEFAULT_FORM: RateForm = {
  monthlyIncome: '2000',
  hoursPerDay: '6',
  daysPerWeek: '5',
  vacationDays: '20',
  nonBillablePct: '25',
  platformFeePct: '10',
  taxPct: '15',
  monthlyExpenses: '100',
  marginPct: '10',
};

export const DEFAULT_CURRENCY: CurrencySetting = { code: 'USD', customSymbol: '' };
export const DEFAULT_PROJECT: ProjectForm = { hours: '40', bufferPct: '20' };

export const DEFAULT_STATE: SavedState = {
  form: DEFAULT_FORM,
  currency: DEFAULT_CURRENCY,
  project: DEFAULT_PROJECT,
};

const KEYS = {
  state: 'frc:lastState:v1',
  presets: 'frc:presets:v1',
} as const;

export function formToInputs(form: RateForm): RateInputs {
  return {
    monthlyIncome: parseNumber(form.monthlyIncome),
    hoursPerDay: parseNumber(form.hoursPerDay),
    daysPerWeek: parseNumber(form.daysPerWeek),
    vacationDays: parseNumber(form.vacationDays),
    nonBillablePct: parseNumber(form.nonBillablePct),
    platformFeePct: parseNumber(form.platformFeePct),
    taxPct: parseNumber(form.taxPct),
    monthlyExpenses: parseNumber(form.monthlyExpenses),
    marginPct: parseNumber(form.marginPct),
  };
}

// --- Defensive parsing: storage may hold data from an older/corrupt version. ---

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeForm(raw: unknown): RateForm {
  const form = { ...DEFAULT_FORM };
  if (!isObject(raw)) return form;
  for (const key of Object.keys(DEFAULT_FORM) as RateField[]) {
    const v = raw[key];
    if (typeof v === 'string') form[key] = v.slice(0, 12);
  }
  return form;
}

function sanitizeCurrency(raw: unknown): CurrencySetting {
  if (!isObject(raw)) return DEFAULT_CURRENCY;
  const code = CURRENCIES.some((c) => c.code === raw.code)
    ? (raw.code as CurrencySetting['code'])
    : DEFAULT_CURRENCY.code;
  const customSymbol = typeof raw.customSymbol === 'string' ? raw.customSymbol.slice(0, 4) : '';
  return { code, customSymbol };
}

function sanitizeProject(raw: unknown): ProjectForm {
  if (!isObject(raw)) return DEFAULT_PROJECT;
  return {
    hours: typeof raw.hours === 'string' ? raw.hours.slice(0, 12) : DEFAULT_PROJECT.hours,
    bufferPct: typeof raw.bufferPct === 'string' ? raw.bufferPct.slice(0, 12) : DEFAULT_PROJECT.bufferPct,
  };
}

function sanitizePreset(raw: unknown): Preset | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  return {
    id: raw.id,
    name: raw.name.slice(0, 40),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    hourlyRate: typeof raw.hourlyRate === 'number' && Number.isFinite(raw.hourlyRate) ? raw.hourlyRate : 0,
    form: sanitizeForm(raw.form),
    currency: sanitizeCurrency(raw.currency),
  };
}

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working with in-memory state.
  }
}

export async function loadState(): Promise<SavedState> {
  const raw = await readJson(KEYS.state);
  if (!isObject(raw)) return DEFAULT_STATE;
  return {
    form: sanitizeForm(raw.form),
    currency: sanitizeCurrency(raw.currency),
    project: sanitizeProject(raw.project),
  };
}

export function saveState(state: SavedState): Promise<void> {
  return writeJson(KEYS.state, state);
}

export async function loadPresets(): Promise<Preset[]> {
  const raw = await readJson(KEYS.presets);
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizePreset).filter((p): p is Preset => p !== null);
}

export function savePresets(presets: Preset[]): Promise<void> {
  return writeJson(KEYS.presets, presets);
}

export function newPresetId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
