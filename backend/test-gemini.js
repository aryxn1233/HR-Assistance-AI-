const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyAAO-D6nb4YzuVZmk9KSJFZP4ak1LEaJd8');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const context = {
    history: [
        { role: 'ai', content: 'Tell me about yourself and your professional background.' },
        { role: 'user', content: 'I am a software engineer with 3 years of experience.' }
    ]
};

const prompt = `You are a professional technical recruiter. Ask one interview question. Return ONLY valid JSON: {"question":"string","skillFocus":"string","difficulty":"Easy|Medium|Hard","isComplete":false}`;

model.generateContent(prompt).then(r => {
    const text = r.response.text();
    console.log('Gemini response:', text.slice(0, 200));
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        console.log('isComplete:', parsed.isComplete);
        console.log('question:', parsed.question?.slice(0, 80));
    } catch (e) { console.log('parse error:', e.message); }
}).catch(e => console.log('Gemini error status:', e.status, e.message?.slice(0, 80)));
