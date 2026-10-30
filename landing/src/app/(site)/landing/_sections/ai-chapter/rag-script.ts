// The knowledge-workspace (RAG) demo's words, [ar, en]. No em dashes, and never
// the word banned by no-legacy-location.spec. The figures agree everywhere:
// 27 loans = 19 active + 5 closed + 3 overdue; the 3 overdue loans total
// AED 412,000 (186,000 + 132,000 + 94,000); 312 passages = 214 + 61 + 37.
import type { Rule } from "./intents"
import type { Bi } from "./chat-script"

export type { Bi }

// A streamed paragraph: plain text, bold figures and citation markers.
export type Part = { t: Bi; b?: true } | { cite: 1 | 2 }

export const UI = {
  url: "ai.yourcompany.ae",
  brand: ["رمّانة RAG", "Rummanah RAG"],
  newChat: ["محادثة جديدة", "New chat"],
  spaces: ["مساحات المعرفة", "Knowledge spaces"],
  space1: ["التمويل والقروض", "Finance & lending"],
  space2: ["سياسات الشركة", "Company policies"],
  space3: ["الموارد البشرية", "HR & people"],
  files: ["الملفات", "Files"],
  privateT: ["مساحة عمل خاصة", "Private workspace"],
  privateS: ["على خوادمك · صلاحيات لكل فريق", "Hosted on your servers · access by team"],
  headSub: ["كل إجابة مع مصدرها", "Answers cite their sources"],
  stReady: ["جاهز", "Ready"],
  stIndexing: ["فهرسة 3 ملفات…", "Indexing 3 files…"],
  stIndexed: ["جاهز · 312 مقطعاً", "Ready · 312 passages"],
  stSearching: ["يبحث…", "Searching…"],
  stAnswered: ["أُجيب خلال 1.2 ث", "Answered in 1.2 s"],
  drop: ["أفلِت الملفات هنا لبناء قاعدة المعرفة", "Drop files to build your knowledge base"],
  dropSub: ["PDF وWord وExcel · حتى 50 ميغابايت", "PDF, Word, Excel · up to 50 MB"],
  dropReady: ["3 ملفات جاهزة. اسأل ما تشاء.", "3 files ready. Ask anything."],
  uploading: ["جارٍ الرفع", "Uploading"],
  question: [
    "كم عدد القروض في المحفظة، وكم منها متأخر؟",
    "How many loans are in the portfolio, and how many are overdue?",
  ],
  trace1: ["بحثتُ في 312 مقطعاً", "Searched 312 passages"],
  trace2: ["وجدتُ 6 مقاطع ذات صلة في ملفين", "Found 6 relevant passages in 2 files"],
  trace3: ["قرأتُ الصفحة 18 وورقة «المتأخرات»", "Read page 18 and the Overdue sheet"],
  active: ["نشطة", "Active"],
  closed: ["مُغلقة", "Closed"],
  overdue: ["متأخرة", "Overdue"],
  copy: ["نسخ", "Copy"],
  copied: ["تم النسخ", "Copied"],
  export: ["تصدير الملخّص", "Export summary"],
  exported: ["تم تصدير الملخّص", "Summary exported"],
  helpful: ["مفيدة", "Helpful"],
  sources: ["المصادر", "Sources"],
  sourcesEmpty: ["تظهر هنا مصادر كل إجابة، مع المقطع نفسه.", "Each answer's sources appear here, with the exact passage."],
  src1Where: ["الصفحة 18 · الجدول 4.2", "Page 18 · Table 4.2"],
  src2Where: ["ورقة «المتأخرات» · الصفوف 2 إلى 4", "Overdue sheet · rows 2 to 4"],
  paperTitle: ["ملخّص محفظة القروض · الربع الثاني 2026", "Loan portfolio summary · Q2 2026"],
  placeholder: ["اسأل عن ملفاتك…", "Ask about your files…"],
  tryIt: ["جرّب بنفسك: اسأل عن الملفات", "Try it yourself: ask about the files"],
  close: ["إغلاق المصدر", "Close the source"],
  inputLabel: ["سؤالك عن الملفات", "Your question about the files"],
  send: ["إرسال", "Send"],
  attach: ["أضف ملفاً من جهازك", "Add a file from your device"],
  region: ["مساعد معرفة تجريبي يعمل داخل متصفحك", "Simulated knowledge assistant, running in your browser"],
  localIndexing: ["فهرسة داخل متصفحك", "Indexing in your browser"],
  localReady: ["جاهز (عرض تجريبي)", "Ready (demo)"],
} as const satisfies Record<string, Bi | string>

export const FILES = [
  { kind: "pdf", name: "loan-portfolio-2026.pdf", meta: ["48 صفحة", "48 pages"], read: ["قراءة 48 صفحة", "Reading 48 pages"], done: ["214 مقطعاً", "214 passages"] },
  { kind: "xlsx", name: "q2-collections.xlsx", meta: ["3 أوراق", "3 sheets"], read: ["قراءة 3 أوراق", "Reading 3 sheets"], done: ["61 مقطعاً", "61 passages"] },
  { kind: "docx", name: "credit-policy.docx", meta: ["12 صفحة", "12 pages"], read: ["قراءة 12 صفحة", "Reading 12 pages"], done: ["37 مقطعاً", "37 passages"] },
] as const

// The scene's answer: two paragraphs around a chart.
export const ANSWER: { p1: Part[]; p2: Part[] } = {
  p1: [
    { t: ["تضم المحفظة", "The portfolio holds"] },
    { t: ["27 قرضاً", "27 loans"], b: true },
    { t: [": منها 19 نشطة و5 مُغلقة و3 متأخرة.", ": 19 active, 5 closed and 3 overdue."] },
    { cite: 1 },
  ],
  p2: [
    { t: ["تبلغ قيمة القروض المتأخرة الثلاثة", "The 3 overdue loans total"] },
    { t: ["412,000 درهم", "AED 412,000"], b: true },
    { t: ["، وجميعها متأخرة بين 30 و60 يوماً.", ", all 30 to 60 days late."] },
    { cite: 2 },
  ],
}

export const SOURCES = {
  1: {
    file: FILES[0].name, kind: "pdf" as const, where: UI.src1Where,
    // the passage, with the cited figures marked
    quote: [
      { t: ["إجمالي عدد القروض المسجّلة في المحفظة هو", "The total number of loans recorded in the portfolio is"] },
      { t: ["27 قرضاً", "27"], b: true },
      { t: ["، موزّعة إلى", ", split into"] },
      { t: ["19 قرضاً نشطاً", "19 active"], b: true },
      { t: ["و5 مُغلقة و3 متأخرة.", "loans, 5 closed and 3 overdue."] },
    ] as Part[],
  },
  2: {
    file: FILES[1].name, kind: "xlsx" as const, where: UI.src2Where,
    quote: [
      { t: ["3 قروض متأخرة · الإجمالي", "3 overdue loans · total"] },
      { t: ["412,000 درهم", "AED 412,000"], b: true },
      { t: ["· من 33 إلى 58 يوماً", "· 33 to 58 days late"] },
    ] as Part[],
  },
}

export type FollowKey = "overdue" | "email" | "compare"

export const FOLLOW: Record<FollowKey, { ask: Bi; trace: Bi; lead: Part[] }> = {
  overdue: {
    ask: ["اعرض القروض المتأخرة", "List the overdue loans"],
    trace: ["قرأتُ ورقة «المتأخرات»", "Read the Overdue sheet"],
    lead: [{ t: ["هذه القروض المتأخرة الثلاثة:", "Here are the 3 overdue loans:"] }, { cite: 2 }],
  },
  email: {
    ask: ["اكتب رسالة تذكير", "Draft a reminder email"],
    trace: ["راجعتُ القرض L-1043 وسياسة التحصيل", "Checked loan L-1043 and the collections policy"],
    lead: [{ t: ["هذه مسودة لشركة النور للتجارة:", "Here's a draft for Al Noor Trading:"] }],
  },
  compare: {
    ask: ["قارن مع الربع الأول", "Compare with Q1"],
    trace: ["قارنتُ ملخّصَي الربعين الأول والثاني", "Compared the Q1 and Q2 summaries"],
    lead: [
      { t: ["مقارنةً بالربع الأول، ارتفع عدد القروض من 24 إلى", "Compared with Q1, the portfolio grew from 24 to"] },
      { t: ["27 قرضاً", "27 loans"], b: true },
      { t: ["وانخفضت المتأخرة من 5 إلى 3.", "and overdue loans fell from 5 to 3."] },
      { cite: 1 },
      { cite: 2 },
    ],
  },
}

export const OVERDUE_ROWS = [
  { id: "L-1043", client: ["النور للتجارة", "Al Noor Trading"], amount: "186,000", days: 58 },
  { id: "L-1067", client: ["خط الصحراء للنقل", "Desert Line Logistics"], amount: "132,000", days: 41 },
  { id: "L-1088", client: ["حِرف النخيل", "Palm Crafts"], amount: "94,000", days: 33 },
] as const

export const TABLE = {
  loan: ["القرض", "Loan"],
  client: ["العميل", "Client"],
  amount: ["المبلغ (درهم)", "Amount (AED)"],
  days: ["أيام التأخير", "Days late"],
} as const satisfies Record<string, Bi>

export const EMAIL = {
  subject: ["تذكير بالدفع: القرض L-1043", "Payment reminder: loan L-1043"],
  body: [
    "فريق النور للتجارة الكرام، تُظهر سجلاتنا أن القرض L-1043 متأخر 58 يوماً بمبلغ مستحق قدره 186,000 درهم. يُرجى التواصل معنا هذا الأسبوع للاتفاق على خطة سداد.",
    "Dear Al Noor Trading team, our records show loan L-1043 is 58 days past due, with AED 186,000 outstanding. Please contact us this week to agree a payment plan.",
  ],
  subjectLabel: ["الموضوع", "Subject"],
} as const

export const COMPARE = {
  q1: ["الربع الأول", "Q1"],
  q2: ["الربع الثاني", "Q2"],
  loans: ["القروض", "Loans"],
  late: ["المتأخرة", "Overdue"],
  values: { q1: { loans: 24, late: 5 }, q2: { loans: 27, late: 3 } },
} as const

// Free typing: a question about the sample files plays its answer; anything else
// gets an honest reply about the demo.
export type RagKey = FollowKey | "export" | "fallback"

export const RAG_RULES: Rule<RagKey>[] = [
  { key: "email", words: ["email", "mail", "remind", "letter", "draft", "رساله", "بريد", "ايميل", "تذكير", "مسوده"] },
  { key: "compare", words: ["compare", "q1", "quarter", "last", "before", "trend", "قارن", "مقارنه", "الربع", "السابق", "الماضي"] },
  { key: "overdue", words: ["overdue", "late", "=list", "متاخر", "اعرض", "قائمه"] },
  { key: "export", words: ["export", "summary", "download", "excel", "تصدير", "ملخص", "تنزيل", "تحميل"] },
]

export const REPLY = {
  export: [
    "جاهز: صدّرتُ ملخّص الإجابة إلى ملف، وستجده في التنزيلات.",
    "Done: I've exported the answer's summary to a file in your downloads.",
  ],
  fallback: [
    "في هذا العرض أجيب من الملفات التجريبية الثلاثة فقط. جرّب أحد الأسئلة المقترحة، أو أضف ملفاً من جهازك. وللسؤال عن مستنداتك الحقيقية، احجز عرضاً تجريبياً.",
    "In this demo I answer from the 3 sample files only. Try a suggested question, or add a file from your device. To ask your real documents, book a demo.",
  ],
  userFile: [
    "{name} جاهز في هذا العرض. بقي داخل متصفحك ولم يُرفع أي شيء. في النسخة الحقيقية أجيب من صفحاته مع مصادرها. هل تريد تجربتها على مستنداتك؟",
    "{name} is ready in this demo. It stayed in your browser; nothing was uploaded. In the live product I'd answer from its pages, with sources. Want to try it on your documents?",
  ],
  attached: [
    "{name} جاهز. بقي داخل متصفحك ولم يُرفع أي شيء.",
    "{name} is ready. It stayed in your browser; nothing was uploaded.",
  ],
  demo: ["احجز عرضاً تجريبياً", "Book a demo"],
  demoWa: ["مرحباً، أريد عرضاً تجريبياً لمساعد المعرفة على مستندات شركتي", "Hi, I'd like a demo of the knowledge assistant on my company's documents"],
} as const

export const SUMMARY = {
  file: "rummanah-loan-summary.md",
  ar: "# ملخّص محفظة القروض\n\nالمصدر: loan-portfolio-2026.pdf، الصفحة 18 · q2-collections.xlsx، ورقة المتأخرات\n\n- إجمالي القروض: 27\n- النشطة: 19\n- المُغلقة: 5\n- المتأخرة: 3 (412,000 درهم، من 30 إلى 60 يوماً)\n\nأنشأه رمّانة RAG (عرض تجريبي).\n",
  en: "# Loan portfolio summary\n\nSources: loan-portfolio-2026.pdf, page 18 · q2-collections.xlsx, Overdue sheet\n\n- Total loans: 27\n- Active: 19\n- Closed: 5\n- Overdue: 3 (AED 412,000, 30 to 60 days late)\n\nGenerated by Rummanah RAG (demo).\n",
}
