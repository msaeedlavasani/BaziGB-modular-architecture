import { Alert, Box, List, ListItem, Paper, Typography } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import PageStack from '@/components/layout/PageStack';
import { getContactContent, SUPPORT_EMAIL } from '@/i18n/legal';
import { getRequestLocale } from '@/lib/request-locale';

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const content = getContactContent(locale);

  return (
    <PageContainer width="content">
      <PageStack>
        <PageHeader eyebrow={content.eyebrow} title={content.title} description={content.description} />
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 4 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            <Box>
              <Typography variant="overline" color="text.secondary">{content.onlineLabel}</Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 700 }}>{content.onlineValue}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">{content.emailLabel}</Typography>
              <Typography
                component="a"
                href={`mailto:${SUPPORT_EMAIL}`}
                dir="ltr"
                variant="body1"
                sx={{ display: 'block', mt: 0.5, color: 'primary.main', fontWeight: 800, textDecoration: 'none' }}
              >
                {SUPPORT_EMAIL}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 2.5, color: 'text.secondary' }}>{content.noPhone}</Typography>
        </Paper>
        {[{ title: content.helpTitle, items: content.helpItems }, { title: content.messageTitle, items: content.messageItems }].map((section) => (
          <Box component="section" key={section.title}>
            <Typography component="h2" variant="h6" sx={{ mb: 1, fontWeight: 800 }}>{section.title}</Typography>
            <List sx={{ py: 0 }}>
              {section.items.map((item) => (
                <ListItem key={item} disableGutters sx={{ py: 0.5, gap: 1.25, alignItems: 'flex-start' }}>
                  <Box aria-hidden="true" sx={{ width: 6, height: 6, mt: 1.2, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                  <Typography variant="body1" color="text.secondary">{item}</Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
        <Alert severity="warning" variant="outlined">{content.notice}</Alert>
      </PageStack>
    </PageContainer>
  );
}
