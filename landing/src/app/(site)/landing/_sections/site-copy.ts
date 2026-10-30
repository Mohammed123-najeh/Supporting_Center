// Company copy that is NOT in the CMS, shared by the pages that show it and by the
// site assistant's knowledge pack (src/server/assistant/knowledge.ts), so the assistant
// always says what the site says. A plain module (no "use client"), because a server
// module cannot read values out of a client component. Pairs are [ar, en]; **…** marks
// bold spans on the landing (boldSegs) and is stripped for the assistant.

export const COMPANY_COPY = {
  heroSub: [
    "نبني أنظمة تجارة إلكترونية متكاملة — متجر عربي أولًا، لوحة تحكم ذكية، دفع وشحن جاهز — بتقنية حديثة وهوية تشبهك.",
    "We build complete e-commerce systems — Arabic-first storefront, a smart dashboard, payments and shipping ready — with modern tech and an identity that's yours.",
  ],
  heroLoc: ["مقرّنا دبي، الإمارات العربية المتحدة", "Based in Dubai, United Arab Emirates"],
  aboutTitle: ["حلول تقنية وتسويقية متكاملة تُمكِّن مشروعك", "Integrated tech & marketing solutions that empower your business"],
  // The operator-provided company story: four flowing paragraphs.
  aboutP1: [
    "نحن شركة ناشئة أسسها **هبة أبو صنبر** و**محمد ناجح عبد الرزاق**، انطلقت برؤية تهدف إلى تمكين الشركات ورواد الأعمال من خلال حلول تقنية وتسويقية متكاملة تساعدهم على النمو ومواكبة التحول الرقمي.",
    "We are a startup company founded by **Hiba Abu Snuber** and **Mohammed Najeh Abdelrazek**, driven by a vision to empower businesses and entrepreneurs through integrated digital solutions that support growth and digital transformation.",
  ],
  aboutP2: [
    "نجمع بين **تطوير البرمجيات** و**حلول الذكاء الاصطناعي (AI Solutions)** و**إدارة التسويق الرقمي ووسائل التواصل الاجتماعي** لنقدم خدمات متكاملة من مكان واحد. نطوّر أنظمة وبرمجيات مخصصة، ومتاجر إلكترونية متقدمة تدعم الدفع الإلكتروني والتكامل مع خدمات الشحن، بالإضافة إلى روبوتات المحادثة، وأتمتة العمليات، وإدارة المحتوى والإعلانات باستخدام أدوات وتقنيات حديثة.",
    "We combine **software development**, **Artificial Intelligence (AI) solutions**, and **digital marketing services** to deliver complete solutions from one place. We build customized software systems, advanced e-commerce platforms integrated with online payment gateways and delivery services, as well as chatbots, business automation solutions, social media management, content creation, and digital advertising strategies powered by modern technologies.",
  ],
  aboutP3: [
    "رسالتنا هي **تبسيط العمليات التجارية، وتحسين تجربة العملاء، ومساعدة الشركات على تحقيق نمو مستدام** من خلال حلول ذكية وعملية تناسب احتياجاتها.",
    "Our mission is to **simplify business operations, enhance customer experiences, and help companies achieve sustainable growth** through smart, practical, and scalable solutions tailored to their needs.",
  ],
  aboutP4: [
    "مؤسسو الشركة من خريجي **جامعة النجاح الوطنية** (دفعة 2021)، ويعملون على بناء شركة تجمع بين الابتكار، والجودة، والتطوير المستمر لتقديم قيمة حقيقية لعملائها.",
    "Our founders are graduates of **An-Najah National University (Class of 2021)**, with a passion for innovation, technology, and continuous development to create meaningful solutions that deliver real value to our clients.",
  ],
  // [title ar, title en, detail ar, detail en]
  fact1: ["خرّيجو جامعة النجاح الوطنية", "An-Najah National University", "دفعة 2021", "Class of 2021"],
  fact2: ["تطوير البرمجيات", "Software development", "أنظمة ومتاجر إلكترونية مخصصة", "Custom systems & e-commerce platforms"],
  fact3: ["حلول الذكاء الاصطناعي", "AI solutions", "روبوتات محادثة وأتمتة العمليات", "Chatbots & business automation"],
  fact4: ["التسويق الرقمي", "Digital marketing", "إدارة وسائل التواصل والمحتوى والإعلانات", "Social media, content & advertising"],
  ctaTitle: ["جاهزون لغرز الغرزة الأولى؟", "Ready to make the first stitch?"],
  ctaLead: ["احجز جلسة استشارية مجانية لمدة 30 دقيقة، ونرسم معًا خريطة متجرك من الفكرة إلى الإطلاق.", "Book a free 30-minute consultation, and let's map your store from idea to launch together."],
  ctaBtn: ["احجز استشارتي المجانية", "Book my free consultation"],
  // Fallback when the CMS contact address is blank (the seed leaves it empty).
  address: ["دبي، الإمارات العربية المتحدة", "Dubai, United Arab Emirates"],
} as const

// The /contact page's quick answers: [question ar, question en, answer ar, answer en].
export const CONTACT_FAQ = [
  ["متى أحصل على ردّ؟", "How soon will I hear back?", "نردّ عادةً خلال يوم عمل واحد، وغالبًا أسرع عبر واتساب.", "Usually within one business day — often faster on WhatsApp."],
  ["ماذا أكتب في الرسالة؟", "What should I include?", "نبذة عن مشروعك أو مشكلتك، وأي رابط أو تفاصيل تساعدنا على فهم طلبك بسرعة.", "A short note about your project or issue, plus any link or detail that helps us understand it quickly."],
  ["هل يمكنني الاتصال مباشرة؟", "Can I reach you directly?", "نعم — استخدم بريد الدعم أو الاستفسارات، أو راسلنا على واتساب من البطاقات المجاورة.", "Yes — use the support or info email, or message us on WhatsApp from the cards alongside."],
] as const

// The packages section heading, used verbatim when the matching CMS field
// (site_settings.packages) is empty. The lead says the prices are samples.
export const PACKAGES_COPY = {
  eyebrow: ["باقاتنا", "Our packages"],
  title: ["ازرع بذرة، اقطف رمّانة", "Plant a seed, harvest a pomegranate"],
  lead: ["ثلاث باقات تنمو مع مشروعك — أسعار تجريبية لغرض العرض.", "Three packages that grow with your business — sample prices for illustration."],
  note: ["جميع الباقات تشمل استضافة آمنة، شهادة SSL، ونسخًا احتياطية يومية.", "All packages include secure hosting, an SSL certificate, and daily backups."],
} as const
