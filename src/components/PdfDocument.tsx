import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Submission } from '../types';

const s = StyleSheet.create({
  page: {
    paddingVertical: 56,
    paddingHorizontal: 64,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#1e293b',
    lineHeight: 1.5,
  },
  title: { fontSize: 20, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 8 },
  author: { fontSize: 12, textAlign: 'center', color: '#475569' },
  meta: { fontSize: 10, textAlign: 'center', color: '#64748b', marginBottom: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 16 },
  abstractHead: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 4,
  },
  abstract: { fontSize: 10.5, fontStyle: 'italic', textAlign: 'center', color: '#475569' },
  h1: { fontSize: 15, fontFamily: 'Times-Bold', marginTop: 16, marginBottom: 6 },
  h2: { fontSize: 13, fontFamily: 'Times-Bold', marginTop: 14, marginBottom: 5 },
  h3: { fontSize: 11.5, fontFamily: 'Times-Bold', marginTop: 12, marginBottom: 4 },
  para: { marginBottom: 6 },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 8 },
  bulletDot: { width: 12 },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 10,
    color: '#475569',
    fontStyle: 'italic',
    marginVertical: 6,
  },
  sectionHead: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
    marginTop: 18,
    marginBottom: 10,
    color: '#1f2937',
  },
  figure: { marginBottom: 20 },
  figImage: { maxHeight: 320, objectFit: 'contain', marginBottom: 6 },
  figCaption: { fontSize: 10, color: '#475569' },
  figLabel: { fontFamily: 'Times-Bold' },
  promptMark: {
    backgroundColor: '#fef08a',
    color: '#713f12',
    fontFamily: 'Courier',
    fontSize: 9,
  },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  geminiBadge: { fontSize: 9, color: '#1d4ed8' },
  chatgptBadge: { fontSize: 9, color: '#047857' },
  refItem: { fontSize: 9.5, marginBottom: 4 },
  refLink: { color: '#1d4ed8' },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 64,
    right: 64,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
});

/** Render a single line of inline markdown (bold + inline code) into Text spans. */
function inline(text: string, keyBase: string) {
  // split on **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <Text key={`${keyBase}-${i}`} style={{ fontFamily: 'Times-Bold' }}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <Text key={`${keyBase}-${i}`} style={{ fontFamily: 'Courier', fontSize: 9.5 }}>
          {p.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={`${keyBase}-${i}`}>{p}</Text>;
  });
}

/** Very small block-level markdown renderer for the synthesis body. */
function renderMarkdown(md: string) {
  const lines = md.split('\n');
  const blocks: React.ReactNode[] = [];
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) return;
    const key = `md-${i}`;
    if (line.startsWith('### ')) {
      blocks.push(<Text key={key} style={s.h3}>{inline(line.slice(4), key)}</Text>);
    } else if (line.startsWith('## ')) {
      blocks.push(<Text key={key} style={s.h2}>{inline(line.slice(3), key)}</Text>);
    } else if (line.startsWith('# ')) {
      blocks.push(<Text key={key} style={s.h1}>{inline(line.slice(2), key)}</Text>);
    } else if (line.startsWith('> ')) {
      blocks.push(<Text key={key} style={s.quote}>{inline(line.slice(2), key)}</Text>);
    } else if (/^[-*]\s+/.test(line)) {
      blocks.push(
        <View key={key} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text>{inline(line.replace(/^[-*]\s+/, ''), key)}</Text>
        </View>,
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1] ?? '';
      blocks.push(
        <View key={key} style={s.bullet}>
          <Text style={s.bulletDot}>{num}.</Text>
          <Text>{inline(line.replace(/^\d+\.\s+/, ''), key)}</Text>
        </View>,
      );
    } else {
      blocks.push(<Text key={key} style={s.para}>{inline(line, key)}</Text>);
    }
  });
  return blocks;
}

export default function PdfDocument({ submission }: { submission: Submission }) {
  const { title, studentName, course, date, abstract, synthesis, entries } = submission;
  const figured = entries.filter((e) => e.imageUrl || e.prompt);
  const references = entries.flatMap((e, i) => {
    const refs: { label: string; url: string; idx: number }[] = [];
    if (e.geminiLink) refs.push({ label: 'Google Gemini', url: e.geminiLink, idx: i + 1 });
    if (e.chatgptLink) refs.push({ label: 'ChatGPT Image', url: e.chatgptLink, idx: i + 1 });
    return refs;
  });

  return (
    <Document title={title} author={studentName}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{title || 'Untitled White Paper'}</Text>
        <Text style={s.author}>{studentName || 'Anonymous Student'}</Text>
        <Text style={s.meta}>
          {course}
          {date && ` · ${new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </Text>
        <View style={s.rule} />

        {abstract ? (
          <View>
            <Text style={s.abstractHead}>ABSTRACT</Text>
            <Text style={s.abstract}>{abstract}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>{renderMarkdown(synthesis)}</View>

        {figured.length > 0 && (
          <View>
            <Text style={s.sectionHead}>Image Documentation</Text>
            {figured.map((e, i) => (
              <View key={e.id} style={s.figure} wrap={false}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                {e.imageUrl ? <Image src={e.imageUrl} style={s.figImage} /> : null}
                <Text style={s.figCaption}>
                  <Text style={s.figLabel}>Figure {i + 1}. </Text>
                  {e.prompt ? (
                    <>
                      Prompt: <Text style={s.promptMark}>{e.prompt}</Text>
                    </>
                  ) : null}
                </Text>
                <View style={s.badges}>
                  {e.geminiLink ? (
                    <Link src={e.geminiLink} style={s.geminiBadge}>
                      ◆ View in Gemini ↗
                    </Link>
                  ) : null}
                  {e.chatgptLink ? (
                    <Link src={e.chatgptLink} style={s.chatgptBadge}>
                      ✦ View in ChatGPT ↗
                    </Link>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {references.length > 0 && (
          <View>
            <Text style={s.sectionHead}>References</Text>
            {references.map((r, i) => (
              <Text key={i} style={s.refItem}>
                [{i + 1}] {r.label} — conversation for Figure {r.idx}.{' '}
                <Link src={r.url} style={s.refLink}>
                  {r.url}
                </Link>
              </Text>
            ))}
          </View>
        )}

        <Text
          style={s.footer}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
