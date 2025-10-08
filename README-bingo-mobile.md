# Bingo Mobile — One-Off Org Game (Nuxt 3 + PocketBase) — Build Story

> **ภาษา:** TH (เทคนิคผสม EN) • **Target:** มือถือเท่านั้น • **Single Room** • **Play once**  
> **FE:** Nuxt 3 (SPA) + Pinia + Tailwind • **BE/DB:** PocketBase (SQLite) • **Realtime:** PB Realtime (+ Polling fallback 2–3s)

---

## 0) Goal & Non-Goals
**Goal:** เกม Bingo web app สำหรับมือถือ แบ่ง role: admin / player เล่นครั้งเดียว ห้องเดียว ใช้งานภายในองค์กร  
**Non-Goals:** ไม่ทำ multi-room, ไม่เน้น security/permission ขั้นสูง, ไม่ทำ SSO/LDAP

---

## 1) Game Rules (Short)
- การ์ดบิงโก 5×5 (เลข 1–99), ช่องกลาง index 12 = **FREE**
- มีการ์ดทั้งหมด **120 ใบ** → ผู้เล่นเลือกได้คนละ 1 ใบ, ใครมาก่อนได้ก่อน, **ห้ามซ้ำ**
- Admin: `Start Game` → `Random Number` (สุ่ม 1–99 **ไม่ซ้ำ**) เป็นรอบๆ (เรียกว่า drawIndex = 1..99)
- Player: เห็นเลขใหม่แบบสด กดบนการ์ดตนเอง
  - ถ้ากดเลข **ที่ยังไม่ถูกสุ่ม** → popup `ไม่โกงนะจ๊ะ`
  - ถ้ากดถูก → ช่องนั้นเป็นสีแดง
- ทุกๆ **10** หมายเลขที่สุ่ม (10, 20, …): โชว์ **คำถาม 4 ตัวเลือก** บังจอผู้เล่นทุกคน
  - ตอบผิด: *ไม่เกิดอะไร*
  - ตอบถูก: สุ่มให้ **FREE** เพิ่ม 1 ช่องบนการ์ดผู้ตอบ (เลือกจากช่องที่ยังไม่ FREE/ไม่ถูก)
- ชนะเมื่อมีบิงโก (12 เส้น = 5 แถว, 5 คอลัมน์, 2 ทแยง) — **ประกาศชื่อผู้ชนะ** (หลายคนพร้อมกันได้) และเกมเล่นต่อเพื่อหาผู้ชนะคนถัดไป

---

## 2) User Stories
### Player
1. ในฐานะผู้เล่น ฉันสามารถเข้าหน้า `/join` ใส่ชื่อ และสร้าง player record ได้
2. ฉันสามารถเลือกการ์ดจาก 120 ใบ (เฉพาะใบว่าง) ได้เพียง 1 ใบและล็อกใบไว้กับฉัน
3. ในหน้า `/play` ฉันเห็นเลขที่ admin สุ่มขึ้นสดๆ และสามารถกดติ๊กเลขที่ถูกได้
4. เมื่อกดเลขที่ยังไม่ถูกรันดอม ระบบเตือน `ไม่โกงนะจ๊ะ`
5. ทุกๆ 10 ตา จะมีคำถาม 4 ตัวเลือกบังจอ ตอบถูกจะได้ FREE 1 ช่องแบบสุ่ม
6. เมื่อฉันบิงโก จะขึ้นชื่อฉันในจอผู้ชนะทันที

### Admin
1. ในฐานะแอดมิน ฉันเข้าหน้า `/admin` เพื่อ `Start`, `Random`, `Reset` ได้
2. ฉันมองเห็น **Card Preview ทุกใบ** (120 ใบ) พร้อมชื่อผู้ถือ/สถานะช่อง/ความคืบหน้าบิงโก
3. ฉันดู **สถิติ**: จำนวนผู้เล่น, ใบที่ถูก claim, จำนวนเลขที่ออก, จำนวนผู้ชนะ, อัตราตอบถูก/ผิดล่าสุด
4. ฉันสามารถกด **Reset เกม** ล้างข้อมูลรอบก่อนทั้งหมดและเริ่มใหม่ได้

---

## 3) Routes & Screens (Mobile-first)
- `/` : เลือก role → Player | Admin
- `/join` : ใส่ชื่อ → create player + save playerId ใน localStorage
- `/card` : เลือกการ์ดจาก list ใบว่าง (แสดง C001..C120) → claim สำเร็จแล้วไป `/play`
- `/play` : กระดาน 5×5 ของฉัน + draw ticker + ผู้ชนะเรียลไทม์ + modal คำถามทุกๆ 10 ตา
- `/admin` : แผงควบคุม (Start/Random/Reset), Live draws, Winners, **Card Preview ทุกใบ**, Stats

**Components (ตัวอย่าง):**
- `PlayerCard.vue` (render 5×5), `DrawTicker.vue`, `QuestionModal.vue`, `WinnersMarquee.vue`
- `AdminPanel.vue`, `AdminStats.vue`, `AdminCardsPreview.vue`

---

## 4) Data Model — PocketBase Collections
> **หมายเหตุ:** ห้องเดียว/เกมเดียว → มี `game` แค่ 1 record

### 4.1 `game` (1 record)
```
status: enum("idle","running","ended") [required]
startedAt: date
endedAt: date
currentDrawIndex: number (0–99) [required, default 0]
questionEvery: number [required, default 10]
activeQuestionEventId: relation(questionEvents) (nullable)
Rules: list/view:any, create/update/delete: admin only
```

### 4.2 `players`
```
name: text [required, index]
joinedAt: date [required]
card: relation(cards) [unique, nullable]  // 1:1
answersCorrect: number [default 0]
bingoAtDraw: number (nullable)
Rules: list/view:any, create:any, update:self (by id), delete:admin
```

### 4.3 `cards` (Master 120 ใบ)
```
code: text [required, unique]        // "C001".."C120"
grid: json [required]                // array length 25, index 12 = "FREE"
assignedTo: relation(players)        // null = ว่าง
assignedAt: date
inUse: bool [required, default false]
marksServer: json [required]         // array bool length 25 (index 12=true)
cellsMarked: number [required, default 1..25]
linesComplete: number [required, default 0..12]
progress: json                       // {row:[5], col:[5], diag:[2], linesOneAway, maxLineProgress}
lastMarkedAt: date
Indexes: unique(code), index(assignedTo)
Rules: list/view:any, create:admin, update: admin OR owner(assignedTo==@request.auth.id)
```

### 4.4 `draws` (เลขที่สุ่มตามลำดับ)
```
drawIndex: number [required, unique]  // 1..99
number: number [required]             // 1..99
createdAt: date [required]
Rules: list/view:any, create/update/delete: admin only
```

### 4.5 `questions` (เพลย์ลิสต์คำถาม)
```
text: text [required]
choices: json [required]              // array length 4
correctIndex: number [required]       // 0..3
weight: number [default 1]
isActive: bool [default true]
Rules: list/view:any, create/update/delete: admin
```

### 4.6 `questionEvents` (ทริกเกอร์ทุกๆ 10 ตา)
```
drawIndex: number [required, unique]  // 10,20,30,...
question: relation(questions) [required]
createdAt: date [required]
Rules: list/view:any, create/update/delete: admin
```

### 4.7 `questionAnswers`
```
player: relation(players) [required, index]
questionEvent: relation(questionEvents) [required, index]
choiceIndex: number [required]        // 0..3
isCorrect: bool [required]
awardedFreeAtCell: number (0..24, nullable)
answeredAt: date [required]
Unique: (player, questionEvent)
Rules: list/view:any, create:any, update/delete: admin
```

### 4.8 `winners`
```
player: relation(players) [required, index]
drawIndex: number [required]
lines: json [required]                // เช่น ["row2","diag1"]
createdAt: date [required]
Rules: list/view:any, create: admin or server hook, update/delete: admin
```

### 4.9 (optional) `events` (audit/log)
```
type: text                            // join|claimCard|mark|bingo
player: relation(players)
payload: json
createdAt: date
Rules: list/view:any, create:any, update/delete: admin
```

---

## 5) Admin Console — Requirements
- **Controls:** `Start`, `Random Number`, `Reset` (confirm 2 ชั้น)
- **Live Draws:** แสดงเลขล่าสุด + History (1–99 ไม่ซ้ำ), ตัวนับเหลืออีกกี่เลขถึงรอบคำถาม
- **Winners:** รายชื่อผู้ชนะล่าสุด (เรียลไทม์)
- **Cards Preview (ทุกใบ):**
  - ชื่อผู้ถือ, เวลา claim
  - กระดาน 5×5 (แดง=ถูก, เทา=FREE)
  - KPIs: `linesComplete`, `linesOneAway`, `maxLineProgress`
  - กรอง/ค้นหา: เฉพาะใบที่ถูก claim, by player name, sort ใกล้ชนะมากสุด
- **Stats ที่ต้องมี:**
  - playersCount, claimedCardsCount, drawsCount, winnersCount
  - questionLatestAccuracy: (ถูก/ผิด) ของ `activeQuestionEvent` ล่าสุด

---

## 6) Core Logic (Pseudo)
### 6.1 Random Number (Admin)
```ts
// when admin clicks random:
assert(game.status === "running");
assert(game.currentDrawIndex < 99);

const used = await pb.collection('draws').getFullList({ fields:'number' });
const all = Array.from({length:99}, (_,i)=>i+1);
const remaining = all.filter(n => !used.some(u => u.number === n));
const number = sample(remaining);

await pb.collection('draws').create({
  drawIndex: game.currentDrawIndex + 1,
  number, createdAt: new Date().toISOString()
});

// update game
const next = game.currentDrawIndex + 1;
const patch:any = { currentDrawIndex: next };
if (next % game.questionEvery === 0) {
  const q = await pickWeightedActiveQuestion();
  const event = await pb.collection('questionEvents').create({
    drawIndex: next, question: q.id, createdAt: new Date().toISOString()
  });
  patch.activeQuestionEventId = event.id;
}
await pb.collection('game').update(game.id, patch);
```

### 6.2 Mark Cell (Player)
```ts
// client validates first; server hook double-checks:
const latestDraws = await pb.collection('draws').getFullList({ fields:'number' });
if (!latestDraws.includes(cellNumber)) {
  return alert('ไม่โกงนะจ๊ะ');
}
// then update marksServer[i] = true, recompute progress/linesComplete
```

### 6.3 Question Answer
```ts
// on submit
const isCorrect = (choiceIndex === question.correctIndex);
const rec = await pb.collection('questionAnswers').create({
  player: playerId, questionEvent: eventId, choiceIndex, isCorrect, answeredAt: now()
});
if (isCorrect) {
  // pick a non-marked & non-FREE cell
  const cell = pickFreeableCell(playerCard);
  await grantFreeCell(playerCard.id, cell); // mark index as FREE in marksServer
}
```

### 6.4 Win Check
- ทำบน FE เมื่อ mark/ได้รับ FREE → ถ้าชนะให้เรียกบันทึก `winners`
- ฝั่ง BE (hook) ตรวจซ้ำจาก `marksServer` + `draws` เพื่อความถูกต้อง

---

## 7) Hooks/Actions (PocketBase)
### 7.1 `draws.beforeCreate`
- Validate: `number` ไม่ซ้ำ, `drawIndex = game.currentDrawIndex + 1`
- Update: `game.currentDrawIndex`
- If multiple of `questionEvery`: สุ่ม `questions.isActive` → สร้าง `questionEvents` + เซ็ต `game.activeQuestionEventId`

### 7.2 `cards.beforeUpdate` (mark cell & progress)
- ตรวจว่าเลขที่ mark อยู่ในรายการ `draws`
- Recompute:
  - `cellsMarked`, `linesComplete`
  - `progress.row[5], col[5], diag[2]`
  - `progress.linesOneAway = count(line==4)`
  - `progress.maxLineProgress = max(line)`
- ถ้าชนะเพิ่มจากเดิม → สร้าง `winners` (ถ้ายังไม่เคยชนะ)

### 7.3 `questionAnswers.afterCreate`
- ถ้า `isCorrect` → เลือก `awardedFreeAtCell` จากช่องที่ยังไม่ FREE/ไม่ถูก แล้วอัปเดตการ์ด

### 7.4 `actions.resetGame` (admin only)
- ลบ: `draws`, `winners`, `questionEvents`, `questionAnswers`
- รีเซ็ต `game`: `{status:"idle", currentDrawIndex:0, activeQuestionEventId:null}`
- รีเซ็ต `cards`: unassign & clear marks (index 12 = FREE)

---

## 8) Seeding
### 8.1 Seed `game` (1 record)
```
{ status:"idle", currentDrawIndex:0, questionEvery:10 }
```

### 8.2 Seed `cards` (120 ใบ)
- Generate 5×5 จากเลข 1–99 (ไม่ต้องถูกกฎ bingo พิเศษ), เซ็ต index 12 = `FREE`
- ใส่ `marksServer[12]=true`, `cellsMarked=1` (นับ FREE กลาง), `linesComplete=0`

### 8.3 Seed `questions` (อย่างน้อย 10–20 ข้อ)
```
text, choices[4], correctIndex, weight=1, isActive=true
```

---

## 9) API Contracts (ผ่าน PocketBase SDK/REST)
- `POST /players` → join
- `GET /cards?filter=assignedTo=null` → list การ์ดว่าง
- `PATCH /cards/:id` `{assignedTo, assignedAt, inUse}` → claim
- `GET /draws?sort=drawIndex` → ล่าสุด/ประวัติ
- `POST /draws` (admin) → random number (server validates)
- `PATCH /game` → sync index/activeQuestionEventId
- `POST /questionEvents` (admin/hook) → ทุกรอบ 10 ตา
- `POST /questionAnswers` → ส่งคำตอบ, (hook) FREE cell ถ้าถูก
- `PATCH /cards/:id` → mark ช่อง (อัปเดต marksServer + progress)
- `POST /winners` → เมื่อชนะ
- `POST /actions/resetGame` (custom action) → ล้างข้อมูลทั้งหมด

---

## 10) Acceptance Criteria (สำคัญ)
- [ ] ผู้เล่นเลือกการ์ดไม่ได้ซ้ำ (ถ้ามีชน ให้แจ้งและให้เลือกใหม่)
- [ ] Admin สุ่มเลข 1–99 **ไม่ซ้ำ**, ทุก 10 ตาขึ้นคำถาม
- [ ] Player กดเลขที่ยังไม่ออก → popup `ไม่โกงนะจ๊ะ`
- [ ] ตอบถูก → FREE ช่องแบบสุ่ม 1 ช่อง (ไม่ทับ FREE/ช่องที่ถูกแล้ว)
- [ ] ตรวจบิงโกได้ถูกต้อง (12 เส้น), ประกาศผู้ชนะ และเกมเล่นต่อไปได้
- [ ] Admin Console เห็น **ทุกการ์ด** + สถิติ + สั่ง Reset ได้
- [ ] Polling fallback 2–3s เมื่อ realtime หลุด

---

## 11) Minimal UI Specs
- Mobile-first (min width ~360px)
- สี: ช่อง **แดง** = กดถูก, **เทา** = FREE, อื่นๆ = ปกติ
- Draw Ticker: เลขล่าสุดเด่น + เลื่อนดูย้อนหลัง
- Modal คำถาม: 4 ปุ่มตัวเลือก, submit ครั้งเดียวต่อ event, แสดงผลถูก/ผิด

---

## 12) Nuxt 3 Project Setup (แนะนำ)
```
npx nuxi init bingo-mobile
cd bingo-mobile
npm i pocketbase pinia @pinia/nuxt tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`plugins/pb.client.ts`
```ts
import PocketBase from 'pocketbase';
export default defineNuxtPlugin(() => {
  const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090');
  return { provide: { pb } };
});
```

`stores/game.ts` (ตัวอย่างโครง)
```ts
import { defineStore } from 'pinia';
export const useGameStore = defineStore('game', {
  state: () => ({ game: null as any, draws: [] as number[], winners: [] as any[] }),
  actions: {
    async sync(){ /* subscribe + polling fallback */ },
  }
});
```

---

## 13) Edge Cases
- ผู้เล่นเปลี่ยนเครื่อง/รีเฟรช: ใช้ localStorage เก็บ `playerId`, เมื่อหายให้สร้างใหม่ (ชื่อซ้ำได้)
- Admin เผลอกด Random ซ้ำเร็ว: ป้องกันที่ server (`draws.beforeCreate`)
- ผู้เล่นพร้อมกันกด claim ใบเดียวกัน: ใช้ unique + optimistic update, ถ้า fail แจ้งเลือกใบอื่น
- ตอบคำถามพร้อมกันจำนวนมาก: ให้ hook สุ่ม FREE cell แบบ idempotent per (player,event)

---

## 14) Security (ตามโจทย์ “ไม่เน้น” แต่พอเพียง)
- เปิดอ่านคอลเลกชันส่วนใหญ่เพื่อความง่าย
- เขียนสำคัญจำกัดเฉพาะ admin หรือ owner ของการ์ด
- ไม่มีข้อมูลส่วนบุคคลละเอียด (PII) เก็บเฉพาะชื่อเล่น

---

## 15) What to Build Next (Tasklist สำหรับ AI)
- [ ] สร้าง Collections ตามข้อ 4 (migrations)
- [ ] เขียน Hooks ตามข้อ 7 (draws.beforeCreate, cards.beforeUpdate, questionAnswers.afterCreate, actions.resetGame)
- [ ] หน้า `/join`, `/card`, `/play`, `/admin` + components
- [ ] Seed `game`, `cards(120)`, `questions`
- [ ] Realtime subscribe + Polling fallback
- [ ] Implement Admin Console: preview การ์ด + stats + reset
- [ ] E2E test: เล่นครบ flow, ตรวจ 10 ตามีคำถาม, FREE cell ทำงาน, ประกาศผู้ชนะ

---

## 16) Appendix — Schema as JSON-like (สำหรับ AI แปลงเป็น PB migration)
```json
{
  "game": {
    "fields": {
      "status": "enum[idle,running,ended]",
      "startedAt": "date",
      "endedAt": "date",
      "currentDrawIndex": "number(0-99)",
      "questionEvery": "number",
      "activeQuestionEventId": "relation(questionEvents)"
    },
    "rules": { "list":"any", "view":"any", "create":"admin", "update":"admin", "delete":"admin" }
  },
  "players": {
    "fields": {
      "name":"text",
      "joinedAt":"date",
      "card":"relation(cards) unique?",
      "answersCorrect":"number",
      "bingoAtDraw":"number?"
    },
    "rules": { "list":"any","view":"any","create":"any","update":"self-or-admin","delete":"admin" }
  },
  "cards": {
    "fields": {
      "code":"text unique",
      "grid":"json[25]",
      "assignedTo":"relation(players)? index",
      "assignedAt":"date?",
      "inUse":"bool",
      "marksServer":"json[25]",
      "cellsMarked":"number",
      "linesComplete":"number",
      "progress":"json",
      "lastMarkedAt":"date?"
    },
    "indexes":["unique(code)","index(assignedTo)"],
    "rules": { "list":"any","view":"any","create":"admin","update":"admin-or-owner","delete":"admin" }
  },
  "draws": {
    "fields": {
      "drawIndex":"number unique",
      "number":"number",
      "createdAt":"date"
    },
    "rules": { "list":"any","view":"any","create":"admin","update":"admin","delete":"admin" }
  },
  "questions": {
    "fields": {
      "text":"text",
      "choices":"json[4]",
      "correctIndex":"number(0-3)",
      "weight":"number",
      "isActive":"bool"
    },
    "rules": { "list":"any","view":"any","create":"admin","update":"admin","delete":"admin" }
  },
  "questionEvents": {
    "fields": {
      "drawIndex":"number unique",
      "question":"relation(questions)",
      "createdAt":"date"
    },
    "rules": { "list":"any","view":"any","create":"admin","update":"admin","delete":"admin" }
  },
  "questionAnswers": {
    "fields": {
      "player":"relation(players) index",
      "questionEvent":"relation(questionEvents) index",
      "choiceIndex":"number(0-3)",
      "isCorrect":"bool",
      "awardedFreeAtCell":"number?",
      "answeredAt":"date"
    },
    "unique":["(player,questionEvent)"],
    "rules": { "list":"any","view":"any","create":"any","update":"admin","delete":"admin" }
  },
  "winners": {
    "fields": {
      "player":"relation(players) index",
      "drawIndex":"number",
      "lines":"json",
      "createdAt":"date"
    },
    "rules": { "list":"any","view":"any","create":"admin-or-hook","update":"admin","delete":"admin" }
  },
  "events": {
    "fields": {
      "type":"text",
      "player":"relation(players)?",
      "payload":"json?",
      "createdAt":"date"
    },
    "rules": { "list":"any","view":"any","create":"any","update":"admin","delete":"admin" }
  }
}
```
