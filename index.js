// import library yang dibutuhkan
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
 
//Tambahkan setup untuk import style
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

//memasukkan express ke variabel app
const app = express();

//mengakses GoogleGenAI dengan API key dari file env, lalu dialiaskan ke variabel ai
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//memasukkan gemini 2.5 Flash ke variabel GEMINI_MODEL
const GEMINI_MODEL = "gemini-2.5-flash";

//menggunakan library cors, karena kita akan akses express api dr frontend
app.use(cors());

//menggunakan express.json(), karena akan kita menakses input dan output json
app.use(express.json());

//3000 sebagai nomor PORT
const PORT = 3000;

//server all files in public_solution at root path
app.use(express.static(path.join(_dirname, 'public')));

//ketika dijalankan, dia akan menulis di server ready on
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));


//Fungsi pengecekan isi response dari gemini
function extractText(resp) {
    try {
        const text =
            resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
            resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
            resp?.response?.candidates?.[0]?.content?.text;

        return text ?? JSON.stringify(resp, null, 2);
     } catch (err) {
        console.error("Error extracting text:", err);
        return JSON.stringify(resp, null, 2);
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages)) throw new Error("messages must be an array");
        const contents = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content}]
        }))
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents
        });
        res.json({ result: extractText(resp) });
    } catch (err) {
        res.status (500).json({ error: err.message });
    }
})