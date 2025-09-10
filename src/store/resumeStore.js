// src/store/resumeStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

function extractCompaniesFromHistories(histories = []) {
  let inWork = false;
  const companies = [];
  const normalize = (s) => (s || '').replace(/[\s\u3000]/g, '');

  for (const h of histories) {
    const desc = h?.description || '';
    if (h.type === 'header' && normalize(desc) === '職歴') {
      inWork = true;
      continue;
    }
    if (!inWork) continue;
    if (h.type === 'footer') break;
    if (h.type === 'entry' && /(入社|入所|配属|参画)/.test(desc)) {
      const name = (desc.split(/[ \u3000]/)[0] || '').trim();
      companies.push(name);
    }
  }
  const unique = [...new Set(companies)];
  return unique.map((c, i) => c || `会社${i + 1}`);
}

const initialResumeData = {
  profile: {
    name: '',
    nameFurigana: '',
    birthdate: { year: '', month: '', day: '' },
    address: '',
    contact: '',
    phone: '',
    email: '',
    date: { year: '2025', month: '8', day: '30' },
  },
  histories: [
    { id: uuidv4(), type: 'header', year: '', month: '', description: '学 歴' },
    { id: uuidv4(), type: 'entry',  year: '', month: '', description: '' },
    { id: uuidv4(), type: 'header', year: '', month: '', description: '職 歴' },
    { id: uuidv4(), type: 'entry',  year: '', month: '', description: '' },
    { id: uuidv4(), type: 'footer', year: '', month: '', description: '以 上' },
  ],
  licenses: [{ id: uuidv4(), year: '', month: '', description: '' }],

  // テキスト欄
  motivation: '',
  selfPromotion: '',
  requests: '',
  // ▼ 職務経歴書 用の状態
  jobSummary: '',           // 職務経歴要約
  jobDetails: [],           // 会社ごとの詳細（可変配列）

  // 証明写真（Base64 Data URL を想定）
  photoUrl: '',
};

export const useResumeStore = create(
  persist(
    (set) => ({
      ...initialResumeData,

      // --- profile / date / birthdate
      updateProfile: (field, value) =>
        set((state) => ({ profile: { ...state.profile, [field]: value } })),
      updateDate: (field, value) =>
        set((state) => ({
          profile: {
            ...state.profile,
            date: { ...state.profile.date, [field]: value },
          },
        })),
      updateBirthdate: (field, value) =>
        set((state) => ({
          profile: {
            ...state.profile,
            birthdate: { ...state.profile.birthdate, [field]: value },
          },
        })),

      // --- histories
      updateHistory: (id, field, value) =>
        set((state) => ({
          histories: state.histories.map((h) =>
            h.id === id ? { ...h, [field]: value } : h
          ),
        })),
      addHistory: (index) =>
        set((state) => {
          const newHistories = [...state.histories];
          newHistories.splice(index, 0, {
            id: uuidv4(),
            type: 'entry',
            year: '',
            month: '',
            description: '',
          });
          return { histories: newHistories };
        }),
      deleteHistory: (id) =>
        set((state) => ({
          histories: state.histories.filter((h) => h.id !== id),
        })),

      // --- licenses
      updateLicense: (id, field, value) =>
        set((state) => ({
          licenses: state.licenses.map((l) =>
            l.id === id ? { ...l, [field]: value } : l
          ),
        })),
      addLicense: (index) =>
        set((state) => {
          const newLicenses = [...state.licenses];
          newLicenses.splice(index, 0, {
            id: uuidv4(),
            year: '',
            month: '',
            description: '',
          });
          return { licenses: newLicenses };
        }),
      deleteLicense: (id) =>
        set((state) => ({
          licenses: state.licenses.filter((l) => l.id !== id),
        })),

      // --- text sections
      updateMotivation: (value) => set({ motivation: value }),
      updateSelfPromotion: (value) => set({ selfPromotion: value }),
      updateRequests: (value) => set({ requests: value }),
      // ▼ 職務経歴書 用のupdate
      setJobSummary: (value) => set({ jobSummary: value }),
      setJobDetails: (arr) =>
        set((state) => {
          const companies = extractCompaniesFromHistories(state.histories);
          const input = Array.isArray(arr) ? arr : state.jobDetails;
          const normalized = companies.map((company, i) => {
            const found = Array.isArray(input)
              ? input.find((d) => d?.company === company) || input[i]
              : null;
            const detail =
              typeof found === 'string'
                ? found
                : typeof found?.detail === 'string'
                  ? found.detail
                  : '';
            return { company, detail };
          });
          return { jobDetails: normalized };
        }),
      upsertJobDetail: (index, value) =>
        set((state) => {
          const companies = extractCompaniesFromHistories(state.histories);
          const next = Array.isArray(state.jobDetails)
            ? [...state.jobDetails]
            : [];
          const company = companies[index] || `会社${index + 1}`;
          next[index] = { company, detail: value };
          return { jobDetails: next };
        }),

      // --- photo
      updatePhotoUrl: (dataUrl) => set({ photoUrl: dataUrl }),
      clearPhoto: () => set({ photoUrl: '' }),
    }),
    {
      name: 'resume-data-storage',
    }
  )
);
