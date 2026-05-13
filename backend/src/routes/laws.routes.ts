import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { scrapeRatchakitja, scrapeDepartmentLabor } from '../services/scraper.service';
import { analyzeLawWithOpenAI } from '../services/openai.service';

const router = Router();

const mockLaws = [
  {
    id: 'rk-001',
    title: 'พระราชกฤษฎีกาว่าด้วยความปลอดภัย อาชีวนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. 2564',
    source: 'ราชกิจจานุเบกษา',
    category: 'Safety',
    description: 'กฎหมายเกี่ยวกับความปลอดภัยในการทำงาน',
    url: 'https://www.ratchakitja.go.th/documents/1',
    publishedDate: '2021-05-15',
    effectiveDate: '2021-06-15',
    status: 'active'
  },
  {
    id: 'rk-002',
    title: 'พระราชกฤษฎีกาว่าด้วยเงินสวัสดิการสุขภาพ พ.ศ. 2555',
    source: 'ราชกิจจานุเบกษา',
    category: 'Welfare',
    description: 'กฎหมายเกี่ยวกับเงินสวัสดิการสุขภาพของพนักงาน',
    url: 'https://www.ratchakitja.go.th/documents/2',
    publishedDate: '2012-08-20',
    effectiveDate: '2012-09-01',
    status: 'active'
  },
  {
    id: 'dl-001',
    title: 'ประกาศกรมสวัสดิการแรงงาน เรื่อง มาตรฐานความปลอดภัยในการทำงาน',
    source: 'กรมสวัสดิการแรงงาน',
    category: 'Safety',
    description: 'มาตรฐานความปลอดภัยในการทำงาน',
    url: 'https://www.dep.go.th/documents/1',
    publishedDate: '2020-03-10',
    effectiveDate: '2020-04-01',
    status: 'active'
  }
];

router.get('/all', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(mockLaws);
});

router.get('/search', authMiddleware, (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string)?.toLowerCase() || '';
  const results = mockLaws.filter(law =>
    law.title.toLowerCase().includes(q) ||
    law.description.toLowerCase().includes(q)
  );
  res.json(results);
});

router.get('/category/:category', authMiddleware, (req: AuthRequest, res: Response) => {
  const { category } = req.params;
  const results = mockLaws.filter(law => law.category === category);
  res.json(results);
});

router.post('/analyze/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const law = mockLaws.find(l => l.id === id);

    if (!law) {
      return res.status(404).json({ error: 'Law not found' });
    }

    const analysis = await analyzeLawWithOpenAI(law);
    res.json({ law, analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/ratchakitja', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const laws = await scrapeRatchakitja();
    res.json({ success: true, count: laws.length, laws });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scrape/department-labor', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const laws = await scrapeDepartmentLabor();
    res.json({ success: true, count: laws.length, laws });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;