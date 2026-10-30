// The support-chat demo's words, [ar, en]. The customer writes like a customer
// (light everyday Arabic), the assistant answers in clear Modern Standard Arabic.
// No em dashes, and never the word banned by no-legacy-location.spec.
import type { Rule } from "./intents"

export type Bi = readonly [ar: string, en: string]

// The store app around the chat (the order page, the header, the composer).
export const APP = {
  store: ["متجر رمّانة", "Rummanah Store"],
  myOrders: ["طلباتي", "My orders"],
  product: ["طقم الاستخدام اليومي", "Everyday set"],
  productSub: ["حقيبة ومحفظة وحافظة بطاقات من الجلد", "Leather tote, wallet and card holder"],
  order: ["طلب", "Order"],
  ordered: ["تم الطلب", "Ordered"],
  orderedAt: ["الإثنين", "Monday"],
  shipped: ["تم الشحن", "Shipped"],
  shippedAt: ["الثلاثاء", "Tuesday"],
  out: ["خرج للتوصيل", "Out for delivery"],
  outAt: ["اليوم، 8:12 ص", "Today, 8:12 AM"],
  delivered: ["تم التوصيل", "Delivered"],
  etaToday: ["اليوم، 4 إلى 6 م", "Today, 4 to 6 PM"],
  etaTomorrow: ["غداً، 10 ص إلى 1 م", "Tomorrow, 10 AM to 1 PM"],
  delivery: ["التوصيل", "Delivery"],
  updated: ["عدّله المساعد", "Updated by assistant"],
  address: ["العنوان", "Address"],
  addressVal: ["دبي مارينا، برج 3", "Dubai Marina, Tower 3"],
  returns: ["الإرجاع", "Returns"],
  returnsVal: ["مجاني خلال 14 يوماً", "Free for 14 days"],
  agent: ["مساعد رمّانة", "Rummanah Assistant"],
  agentSub: ["ذكاء اصطناعي · يرد فوراً", "AI · replies instantly"],
  notice: [
    "ذكاء اصطناعي خاص: هذا المساعد يعمل على خوادم المتجر نفسه، ورسائلك تبقى خاصة.",
    "Private AI: this assistant runs on the store's own servers. Your messages stay private.",
  ],
  today: ["اليوم", "Today"],
  placeholder: ["اكتب رسالتك…", "Message the assistant…"],
  tryIt: ["جرّب بنفسك: اكتب أي رسالة", "Try it yourself: type any message"],
  inputLabel: ["رسالتك إلى مساعد المتجر", "Your message to the store assistant"],
  send: ["إرسال", "Send"],
  region: ["محادثة دعم تجريبية تعمل داخل متصفحك", "Simulated support chat, running in your browser"],
} as const satisfies Record<string, Bi>

// The scripted scene: three exchanges.
export const SCENE = {
  c1: ["هلا، وين صار طلبي؟", "Hi! Where's my order?"],
  s1: ["أتحقق من الطلب RM-2048…", "Checking order RM-2048…"],
  a1: [
    "أهلاً ليلى 👋 طلبك «طقم الاستخدام اليومي» خرج للتوصيل، ويصلك اليوم بين 4 و6 مساءً.",
    "Hi Layla 👋 Your Everyday set is out for delivery and arrives today between 4 and 6 PM.",
  ],
  c2: ["ممكن توصلوه بكرة الصبح بدل اليوم؟", "Can you deliver it tomorrow morning instead?"],
  s2: ["أعدّل موعد التوصيل…", "Rescheduling the delivery…"],
  a2: [
    "تم. أصبح موعد التوصيل غداً من 10 صباحاً حتى 1 ظهراً، وسيتصل بك المندوب قبل وصوله.",
    "Done. It's now booked for tomorrow, 10 AM to 1 PM, and the courier will call before arriving.",
  ],
  act2: ["تم تغيير موعد التوصيل", "Delivery rescheduled"],
  c3: ["وإذا ما ضبط المقاس؟", "And if it doesn't fit?"],
  s3: ["أراجع سياسة الإرجاع…", "Reading the returns policy…"],
  a3: [
    "لا مشكلة: الإرجاع أو الاستبدال مجاني خلال 14 يوماً. هل أحجز لك موعد استلام؟",
    "No problem: returns and exchanges are free for 14 days. Shall I book a pickup?",
  ],
  src3: ["من سياسة الإرجاع", "From the returns policy"],
  quickPickup: ["احجز موعد استلام", "Book a pickup"],
  quickHuman: ["أريد التحدث مع موظف", "Talk to a person"],
} as const satisfies Record<string, Bi>

// The visitor's own messages: one reply per intent.
export type ReplyKey = "greet" | "order" | "pickup" | "returns" | "price" | "human" | "thanks" | "fallback"
export type ReplyLink = "packages" | "whatsapp" | "demo"

export const REPLIES: Record<ReplyKey, { text: Bi; status?: Bi; link?: ReplyLink }> = {
  greet: { text: [
    "أهلاً بك 👋 أنا المساعد الذكي للمتجر. اسألني عن طلبك أو موعد التوصيل أو الإرجاع.",
    "Hi there 👋 I'm the store's AI assistant. Ask me about your order, delivery or returns.",
  ] },
  order: { status: SCENE.s1, text: [
    "طلبك RM-2048 موعد توصيله غداً من 10 صباحاً حتى 1 ظهراً. هل تحتاج شيئاً آخر؟",
    "Your order RM-2048 is booked for tomorrow, 10 AM to 1 PM. Anything else?",
  ] },
  pickup: { status: ["أحجز موعد الاستلام…", "Booking a pickup…"], text: [
    "تم الحجز ✓ سيستلم المندوب الطلب غداً بين 10 صباحاً و1 ظهراً، فقط أبقِ المنتج في علبته.",
    "Booked ✓ A courier will collect it tomorrow between 10 AM and 1 PM. Just keep it in its box.",
  ] },
  returns: { status: SCENE.s3, text: [
    "الإرجاع أو الاستبدال مجاني خلال 14 يوماً، ويمكنني حجز موعد استلام متى كنت جاهزاً.",
    "Returns and exchanges are free for 14 days, and I can book a pickup whenever you're ready.",
  ] },
  price: { link: "packages", text: [
    "هذا عرض تجريبي للمساعد الذي نبنيه للمتاجر. باقاتنا في الأسفل، أو احجز استشارة مجانية.",
    "This is a demo of the assistant we build for stores. Our packages are just below, or book a free consultation.",
  ] },
  human: { link: "whatsapp", text: [
    "بكل سرور. في متجرك أحوّل المحادثة إلى فريقك مع كامل تفاصيلها. هل تريد التحدث مع فريقنا الآن؟",
    "Of course. In your store I'd hand this chat to your team with its full history. Want to talk to ours now?",
  ] },
  thanks: { text: ["العفو! هل هناك شيء آخر أساعدك فيه؟", "You're welcome! Anything else I can help with?"] },
  fallback: { link: "demo", text: [
    "شكراً لرسالتك! في متجرك أجيب عن هذا من منتجاتك وطلباتك وسياساتك، في أي وقت. هل تريد أن تراه على بياناتك؟",
    "Thanks for your message! In your store I'd answer this from your own products, orders and policies, any time. Want to see it on your data?",
  ] },
}

export const LINKS: Record<ReplyLink, Bi> = {
  packages: ["شاهد الباقات", "See packages"],
  whatsapp: ["تحدث مع فريقنا على واتساب", "Chat with our team on WhatsApp"],
  demo: ["احجز عرضاً تجريبياً", "Book a demo"],
}

// First match wins, so the specific intents come before the broad ones.
export const RULES: Rule<ReplyKey>[] = [
  { key: "human", words: ["human", "person", "agent", "someone", "staff", "موظف", "شخص", "انسان", "بشري", "=حدا"] },
  { key: "pickup", words: ["pickup", "pick up", "collect", "استلام", "مندوب"] },
  { key: "returns", words: [
    "return", "refund", "exchange", "size", "=fit", "ارجاع", "استرجاع", "استبدال", "مقاس",
    "=رجع", "=ارجع", "=ارجعه", "=ارجعها", "=رجعت", "=يرجع", "=نرجع", "=برجع",
  ] },
  { key: "order", words: ["order", "track", "deliver", "shipping", "=ship", "where", "when", "طلب", "=وين", "=اين", "=متي", "توصيل", "شحن", "موعد"] },
  { key: "price", words: ["price", "pricing", "cost", "how much", "package", "=plan", "سعر", "اسعار", "=كم", "بكم", "تكلفه", "باقه", "باقات"] },
  { key: "thanks", words: ["thank", "thx", "شكرا", "مشكور", "يعطيك", "تسلم"] },
  { key: "greet", words: ["hello", "hey", "=hi", "salam", "مرحب", "اهلا", "=هلا", "السلام", "صباح الخير", "مساء الخير"] },
]
