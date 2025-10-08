import PocketBase from 'pocketbase'
import { generate120Cards } from '../utils/bingo'

const pb = new PocketBase('http://127.0.0.1:8090')

async function seed() {
  console.log('🌱 Starting seed...')
  
  try {
    // 1. Seed game (single record)
    console.log('Creating game record...')
    const existingGames = await pb.collection('game').getFullList()
    
    if (existingGames.length === 0) {
      await pb.collection('game').create({
        status: 'idle',
        currentDrawIndex: 0,
        questionEvery: 10
      })
      console.log('✓ Game record created')
    } else {
      console.log('✓ Game record already exists')
    }
    
    // 2. Seed cards (120 cards)
    console.log('Creating 120 cards...')
    const existingCards = await pb.collection('cards').getFullList()
    
    if (existingCards.length === 0) {
      const cards = generate120Cards()
      
      for (const card of cards) {
        await pb.collection('cards').create(card)
      }
      console.log('✓ 120 cards created')
    } else {
      console.log(`✓ ${existingCards.length} cards already exist`)
    }
    
    // 3. Seed questions (20 sample questions)
    console.log('Creating sample questions...')
    const existingQuestions = await pb.collection('questions').getFullList()
    
    if (existingQuestions.length === 0) {
      const questions = [
        {
          text: 'ประเทศไทยมีกี่จังหวัด?',
          choices: ['75', '76', '77', '78'],
          correctIndex: 2,
          weight: 1,
          isActive: true
        },
        {
          text: 'เมืองหลวงของประเทศญี่ปุ่นคือ?',
          choices: ['โตเกียว', 'โอซาก้า', 'เกียวโต', 'ฮิโรชิม่า'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: '1 + 1 = ?',
          choices: ['1', '2', '3', '4'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'สีของธงชาติไทยมีกี่สี?',
          choices: ['2', '3', '4', '5'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'ภูเขาที่สูงที่สุดในโลกคือ?',
          choices: ['เอเวอเรสต์', 'ฟูจิ', 'คิลิมันจาโร', 'แมทเทอร์ฮอร์น'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'มหาสมุทรที่ใหญ่ที่สุดในโลกคือ?',
          choices: ['แอตแลนติก', 'อินเดีย', 'แปซิฟิก', 'อาร์กติก'],
          correctIndex: 2,
          weight: 1,
          isActive: true
        },
        {
          text: 'ดาวเคราะห์ที่ใกล้ดวงอาทิตย์ที่สุดคือ?',
          choices: ['ดาวพุธ', 'ดาวศุกร์', 'โลก', 'ดาวอังคาร'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'ประเทศที่มีประชากรมากที่สุดในโลกคือ?',
          choices: ['จีน', 'อินเดีย', 'สหรัฐอเมริกา', 'อินโดนีเซีย'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'สัตว์ที่วิ่งเร็วที่สุดในโลกคือ?',
          choices: ['เสือชีตาห์', 'สิงโต', 'ม้า', 'กวาง'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'แม่น้ำที่ยาวที่สุดในโลกคือ?',
          choices: ['ไนล์', 'แอมะซอน', 'แยงซี', 'มิสซิสซิปปี'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'ทวีปที่ใหญ่ที่สุดในโลกคือ?',
          choices: ['แอฟริกา', 'เอเชีย', 'อเมริกาเหนือ', 'อเมริกาใต้'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'ประเทศที่มีพื้นที่มากที่สุดในโลกคือ?',
          choices: ['รัสเซีย', 'แคนาดา', 'จีน', 'สหรัฐอเมริกา'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'โลกมีกี่ทวีป?',
          choices: ['5', '6', '7', '8'],
          correctIndex: 2,
          weight: 1,
          isActive: true
        },
        {
          text: 'สัตว์ที่ใหญ่ที่สุดในโลกคือ?',
          choices: ['ช้าง', 'วาฬสีน้ำเงิน', 'ยีราฟ', 'ฮิปโป'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'ประเทศที่มีเกาะมากที่สุดในโลกคือ?',
          choices: ['อินโดนีเซีย', 'ฟิลิปปินส์', 'ญี่ปุ่น', 'สวีเดน'],
          correctIndex: 3,
          weight: 1,
          isActive: true
        },
        {
          text: 'ภาษาที่มีผู้พูดมากที่สุดในโลกคือ?',
          choices: ['อังกฤษ', 'จีนกลาง', 'สเปน', 'ฮินดี'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'โลกหมุนรอบตัวเองใช้เวลากี่ชั่วโมง?',
          choices: ['12', '24', '36', '48'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'น้ำแข็งลอยน้ำได้เพราะ?',
          choices: ['เบากว่าน้ำ', 'หนักกว่าน้ำ', 'เท่ากับน้ำ', 'ไม่แน่ใจ'],
          correctIndex: 0,
          weight: 1,
          isActive: true
        },
        {
          text: 'ดวงอาทิตย์เป็นดาวประเภทใด?',
          choices: ['ดาวเคราะห์', 'ดาวฤกษ์', 'ดาวบริวาร', 'ดาวหาง'],
          correctIndex: 1,
          weight: 1,
          isActive: true
        },
        {
          text: 'สีรุ้งมีกี่สี?',
          choices: ['5', '6', '7', '8'],
          correctIndex: 2,
          weight: 1,
          isActive: true
        }
      ]
      
      for (const question of questions) {
        await pb.collection('questions').create(question)
      }
      console.log('✓ 20 questions created')
    } else {
      console.log(`✓ ${existingQuestions.length} questions already exist`)
    }
    
    console.log('✅ Seed completed successfully!')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run seed
seed()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

