export interface MotivationalQuote {
  id: string;
  category: "mindset" | "water" | "steps" | "weight" | "breakfast";
  title: string;
  body: string;
  badge: string;
  emoji: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  // Mindset & General Boost
  {
    id: "m-1",
    category: "mindset",
    title: "🌟 การเดินทางเริ่มต้นที่ก้าวแรกเสมอ",
    body: "การลดน้ำหนักไม่ใช่เรื่องของความสมบูรณ์แบบ แต่คือความสม่ำเสมอ วันนี้คุณเก่งมากแล้วที่เริ่มดูแลตัวเอง!",
    badge: "พลังบวกยามเช้า",
    emoji: "🌟",
  },
  {
    id: "m-2",
    category: "mindset",
    title: "💪 คุณแข็งแกร่งกว่าข้ออ้างของคุณ!",
    body: "อย่าให้วันที่เหนื่อยล้ามาหยุดยั้งเป้าหมายของคุณ ทุกการเลือกสิ่งดีๆ ในวันนี้ คือของขวัญให้ตัวคุณในอนาคต",
    badge: "เติมพลังใจ",
    emoji: "🔥",
  },
  {
    id: "m-3",
    category: "mindset",
    title: "🌱 ชัยชนะเล็กๆ รวมกันเป็นผลลัพธ์ที่ยิ่งใหญ่",
    body: "ดื่มน้ำเพิ่มอีกแก้ว เดินเพิ่มอีก 500 ก้าว ลดของหวานมื้อเดียว ทั้งหมดนี้คือก้าวสำคัญสู่สุขภาพในฝันครับ!",
    badge: "ความสม่ำเสมอ",
    emoji: "🌱",
  },
  {
    id: "m-4",
    category: "mindset",
    title: "✨ เชื่อมั่นในกระบวนการ",
    body: "ร่างกายไม่ได้เปลี่ยนแปลงในชั่วข้ามคืน แต่ทุกวินาทีที่คุณขยับและคุมอาหาร ร่างกายกำลังตอบแทนคุณอย่างคุ้มค่าแน่นอน",
    badge: "สร้างความมั่นใจ",
    emoji: "✨",
  },

  // Water Encouragement
  {
    id: "w-1",
    category: "water",
    title: "💧 เติมความสดชื่นกันหน่อยครับ!",
    body: "ดื่มน้ำสักแก้วตอนนี้นะครับ น้ำเปล่าช่วยเร่งอัตราการเผาผลาญไขมันและทำให้สมองแล่นปลอดโปร่งทันที!",
    badge: "เตือนดื่มน้ำ",
    emoji: "💧",
  },
  {
    id: "w-2",
    category: "water",
    title: "🌊 อีกนิดเดียวจะครบเป้าหมายน้ำดื่มแล้ว!",
    body: "เซลล์ในร่างกายกำลังขอบคุณที่คุณดูแลเขาอย่างดี จิบน้ำเพิ่มอีก 250 มล. เพื่อผิวพรรณที่สดใสและระบบขับถ่ายที่ดีเยี่ยม",
    badge: "ชาร์จพลังน้ำ",
    emoji: "🥤",
  },

  // Steps & Walking
  {
    id: "s-1",
    category: "steps",
    title: "🚶‍♂️ ลุกขึ้นมาขยับตัว 5 นาทีกันเถอะ!",
    body: "การนั่งติดโต๊ะนานเกินไปทำให้การเผาผลาญชะลอตัว ลุกเดินแกว่งแขนสักนิด เพิ่มก้าวเดินและเติมความกระปรี้กระเปร่า!",
    badge: "กระตุ้นก้าวเดิน",
    emoji: "👟",
  },
  {
    id: "s-2",
    category: "steps",
    title: "🎯 ใกล้แตะ 10,000 ก้าวแล้ว!",
    body: "หัวใจของคุณแข็งแรงขึ้นในทุกๆ ก้าวที่ก้าวออกไป เดินอีกไม่กี่ร้อยก้าวก็พิชิตเป้าหมายประจำวันแล้วครับ ลุยเลย!",
    badge: "สู้เพื่อก้าวเดิน",
    emoji: "🏃‍♂️",
  },

  // Weight Journey Encouragement
  {
    id: "wt-1",
    category: "weight",
    title: "⚖️ ตัวเลขบนตาชั่งไม่ได้บอกทั้งหมดของคุณ",
    body: "อย่ากังวลถ้าวันนี้น้ำหนักจะขึ้นลงเล็กน้อย กล้ามเนื้อและสัดส่วนที่กระชับขึ้นคือเครื่องยืนยันว่าคุณมาถูกทางแล้ว!",
    badge: "กำลังใจคุมน้ำหนัก",
    emoji: "💖",
  },
  {
    id: "wt-2",
    category: "weight",
    title: "🏆 เป้าหมายอยู่แค่เอื้อม!",
    body: "ลองมองย้อนกลับไปดูว่าคุณมาไกลแค่ไหนแล้ว รักษาจังหวะนี้ไว้ ร่างกายที่ดีขึ้นรอคุณอยู่ที่ปลายทางเสมอ!",
    badge: "มุ่งมั่นสู่เป้าหมาย",
    emoji: "🎉",
  },

  // Breakfast Nutrition
  {
    id: "b-1",
    category: "breakfast",
    title: "🥗 อาหารเช้าคือจุดเริ่มต้นของพลังงานทั้งวัน",
    body: "เลือกอาหารเช้าโปรตีนสูงเพื่อคงระดับน้ำตาลในเลือดให้คงที่ ช่วยให้คุณไม่หิวจุกจิกระหว่างวันและคุมน้ำหนักได้ง่ายขึ้นครับ",
    badge: "โภชนาการเช้า",
    emoji: "🍳",
  },
];

export function getRandomQuote(category?: MotivationalQuote["category"]): MotivationalQuote {
  const pool = category
    ? MOTIVATIONAL_QUOTES.filter((q) => q.category === category)
    : MOTIVATIONAL_QUOTES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || MOTIVATIONAL_QUOTES[0];
}
