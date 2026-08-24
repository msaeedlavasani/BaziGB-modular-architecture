'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Locale } from '@/i18n/config';
import {
  fetchSiteSettings,
  type FooterContent,
  FOOTER_DEFAULTS_BY_LOCALE,
  saveLocalizedFooterSettings,
} from '@/lib/site-settings';

const EDITOR_LOCALES: Locale[] = ['fa', 'en'];

interface EditorState {
  footer: FooterContent;
  linksJson: string;
  dirty: boolean;
}

function makeEditorState(footer: FooterContent): EditorState {
  return {
    footer,
    linksJson: JSON.stringify(footer.links, null, 2),
    dirty: false,
  };
}

export default function AdminFooterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('fa');
  const [states, setStates] = useState<Record<Locale, EditorState>>({
    fa: makeEditorState(FOOTER_DEFAULTS_BY_LOCALE.fa),
    en: makeEditorState(FOOTER_DEFAULTS_BY_LOCALE.en),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/fa/lobby');
    }
  }, [authLoading, router, user]);

  const load = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    setError(null);
    try {
      const [fa, en] = await Promise.all([fetchSiteSettings('fa'), fetchSiteSettings('en')]);
      setStates({
        fa: makeEditorState(fa.footer),
        en: makeEditorState(en.footer),
      });
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت محتوای فوتر');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = states[locale];
  const pageDirection = locale === 'fa' ? 'rtl' : 'ltr';

  const labels = useMemo(() => locale === 'fa'
    ? {
        title: 'مدیریت فوتر',
        subtitle: 'محتوای فارسی و انگلیسی مستقل ذخیره می‌شوند ولی از یک ساختار مشترک استفاده می‌کنند.',
        tagline: 'شعار',
        copyright: 'کپی‌رایت',
        links: 'لینک‌ها (JSON)',
        save: 'ذخیره نسخه فارسی',
        saved: 'نسخه فارسی ذخیره شد.',
        invalidJson: 'فرمت JSON لینک‌ها نامعتبر است.',
        back: 'بازگشت به پنل مدیریت',
      }
    : {
        title: 'Footer content',
        subtitle: 'Persian and English content are stored independently while sharing the same structure.',
        tagline: 'Tagline',
        copyright: 'Copyright',
        links: 'Links (JSON)',
        save: 'Save English version',
        saved: 'English footer saved.',
        invalidJson: 'Links JSON is invalid.',
        back: 'Back to Admin',
      }, [locale]);

  function updateCurrent(patch: Partial<EditorState>) {
    setSaved(false);
    setStates((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch, dirty: true },
    }));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);

    let links: FooterContent['links'];
    try {
      const parsed = JSON.parse(current.linksJson || '[]') as unknown;
      if (!Array.isArray(parsed)) throw new Error('not-array');
      links = parsed
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          label: String(item.label ?? '').trim(),
          href: String(item.href ?? '').trim(),
        }))
        .filter((item) => item.label && item.href);
    } catch {
      setError(labels.invalidJson);
      return;
    }

    setSaving(true);
    try {
      const footer = { ...current.footer, links };
      await saveLocalizedFooterSettings(locale, footer);
      setStates((prev) => ({
        ...prev,
        [locale]: makeEditorState(footer),
      }));
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || (locale === 'fa' ? 'خطا در ذخیره فوتر' : 'Could not save footer content.'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Button component={Link} href="/admin" startIcon={<ArrowLeft size={18} />} sx={{ mb: 3 }}>
          {labels.back}
        </Button>
        <Typography variant="h3" sx={{ fontWeight: 900 }}>{labels.title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{labels.subtitle}</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={locale}
          onChange={(_, next: Locale) => setLocale(next)}
          variant="fullWidth"
          aria-label="Footer locale"
        >
          <Tab value="fa" label={`فارسی${states.fa.dirty ? ' •' : ''}`} />
          <Tab value="en" label={`English${states.en.dirty ? ' •' : ''}`} />
        </Tabs>

        <Box dir={pageDirection} sx={{ p: { xs: 4, sm: 6 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {saved && <Alert severity="success">{labels.saved}</Alert>}

          <TextField
            label={labels.tagline}
            value={current.footer.tagline}
            onChange={(event) => updateCurrent({ footer: { ...current.footer, tagline: event.target.value } })}
            fullWidth
          />
          <TextField
            label={labels.copyright}
            value={current.footer.copyright}
            onChange={(event) => updateCurrent({ footer: { ...current.footer, copyright: event.target.value } })}
            fullWidth
          />
          <TextField
            label={labels.links}
            value={current.linksJson}
            onChange={(event) => updateCurrent({ linksJson: event.target.value })}
            multiline
            minRows={8}
            fullWidth
            inputProps={{ dir: 'ltr' }}
            helperText='[{ "label": "About", "href": "/about" }]'
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
              disabled={saving || !current.dirty}
              onClick={() => void handleSave()}
            >
              {labels.save}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
