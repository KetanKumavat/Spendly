const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function extractExpenseData(text) {
    const prompt = `
You are an intelligent expense extractor for a WhatsApp-based expense tracking bot. 

Your task is to read either raw text extracted from an image (like a receipt or bill) OR casual messages like "Paid 50rs to Rahul" or "Bought shoes ₹1200 from Nike" and return clean structured data in this JSON format:

{
  "total": "<total amount spent in rupees (number, no currency symbol)>",
  "vendor": "<person, shop, brand, or recipient of payment>",
  "date": "<date of transaction in YYYY-MM-DD format or leave empty if not found>",
  "items": ["<optional list of items or description of what was purchased>"]
}

Guidelines:
- The "total" should be the most relevant amount that represents what the user spent.
- The "vendor" can be a person (e.g. Rahul), a shop (e.g. Dmart), or a brand (e.g. Amazon).
- If the date is not given explicitly, leave it empty.
- If multiple items are listed, include them in the "items" array.
- Always return a valid JSON object only, no extra text.
- If something is missing (like vendor or items), keep it blank or an empty array.

Examples:

1. "Paid 45rs to Evangeline" → 
{
  "total": "45",
  "vendor": "Evangeline",
  "date": "",
  "items": []
}

2. "Lunch ₹230 at CCD" →
{
  "total": "230",
  "vendor": "CCD",
  "date": "",
  "items": ["Lunch"]
}

3. "Bought 3 mangoes and 2 bananas ₹120 from Fruit Mart" →
{
  "total": "120",
  "vendor": "Fruit Mart",
  "date": "",
  "items": ["3 mangoes", "2 bananas"]
}

4. OCR Extracted Text from image:
"Big Bazaar
INVOICE #1234
5x Bread - ₹250
2x Butter - ₹300
Total: ₹550
Date: 12/07/2025"

→
{
  "total": "550",
  "vendor": "Big Bazaar",
  "date": "2025-07-12",
  "items": ["5x Bread", "2x Butter"]
}

Now extract structured data for:
"""${text}"""
Return only JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();

    if (textResponse.startsWith("```")) {
        textResponse = textResponse
            .replace(/```(?:json)?\n?/g, "")
            .replace(/```$/, "");
    }

    try {
        const json = JSON.parse(textResponse);
        return json;
    } catch (e) {
        console.error("❌ Gemini returned invalid JSON:", textResponse);
        throw new Error("Invalid response from Gemini");
    }
}

module.exports = { extractExpenseData };
