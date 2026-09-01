import { Box, List, ListItem, Paper, Typography } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import PageStack from '@/components/layout/PageStack';
import type { LegalDocumentContent } from '@/i18n/legal';

export default function LegalDocument({ content }: { content: LegalDocumentContent }) {
  return (
    <PageContainer width="content">
      <PageStack>
        <PageHeader
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {content.updatedLabel}
        </Typography>
        <Paper
          component="article"
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 4,
            bgcolor: 'background.paper',
          }}
        >
          {content.sections.map((section) => (
            <Box
              component="section"
              key={section.title}
              sx={{
                '& + &': { mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' },
              }}
            >
              <Typography component="h2" variant="h6" sx={{ mb: 1.5, color: 'text.primary', fontWeight: 800 }}>
                {section.title}
              </Typography>
              {section.paragraphs.map((paragraph) => (
                <Typography key={paragraph} variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.95, '& + &': { mt: 1.5 } }}>
                  {paragraph}
                </Typography>
              ))}
              {section.items && (
                <List sx={{ mt: section.paragraphs.length ? 1 : 0, py: 0, color: 'text.secondary' }}>
                  {section.items.map((item) => (
                    <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start', py: 0.5, gap: 1.25 }}>
                      <Box aria-hidden="true" sx={{ width: 6, height: 6, mt: 1.25, flexShrink: 0, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      <Typography variant="body1" sx={{ lineHeight: 1.9 }}>{item}</Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ))}
        </Paper>
      </PageStack>
    </PageContainer>
  );
}
