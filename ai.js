// 1. ПАМ'ЯТЬ ТА БАЗОВІ ДАНІ
let chatContext = [];

// Повний список товарів для системного промпту
const catalog = [
    "пластівці chokipik", "нарізаний хліб ron's", "борошно kraftung", "масло lespieds", 
    "макарони panzati", "цукрова пудра susu", "вода aotte", "сир comte", 
    "кава narvalo", "чай lipton", "молоко галичина", "яйця домашні",
    "фарба біла", "фарба синя", "фарба червона", "ламінат дуб", "плитка сіра",
    "картина modern", "ваза керамічна", "настільна лампа", "квітка в горщику", "настінний годинник", "свічник",
    "стелаж металевий", "дерев'яний стіл", "офісний стілець", "холодильна вітрина", "касовий стіл", "полиця для хліба",
    "скейтборд", "електро велосипед", "електросамокат", "мотоцикл", "автомобіль", "вантажівка"
];

function getMarketData(itemName) {
    const prices = {
        // Продукти
        "пластівці chokipik": 3.28, "нарізаний хліб ron's": 0.95, "борошно kraftung": 0.86, 
        "масло lespieds": 1.53, "макарони panzati": 1.3, "цукрова пудра susu": 1.44, 
        "вода aotte": 0.66, "сир comte": 1.24, "кава narvalo": 5.66, 
        "чай lipton": 2.1, "молоко галичина": 2.1, "яйця домашні": 2.1,
        // Ремонт та декор
        "фарба біла": 15.00, "фарба синя": 18.50, "фарба червона": 18.50, 
        "ламінат дуб": 20.00, "плитка сіра": 28.00, "картина modern": 25.00, 
        "ваза керамічна": 15.50, "настільна лампа": 40.00, "квітка в горщику": 12.00, 
        "настінний годинник": 22.00, "свічник": 8.50,
        // Обладнання та меблі
        "стелаж металевий": 45.00, "дерев'яний стіл": 120.50, "офісний стілець": 85.00, 
        "холодильна вітрина": 450.00, "касовий стіл": 210.00, "полиця для хліба": 35.20,
        // Транспорт
        "скейтборд": 50.00, "електро велосипед": 250.00, "електросамокат": 400.00, 
        "мотоцикл": 1500.00, "автомобіль": 12000.00, "вантажівка": 25000.00
    };
    
    const name = itemName.toLowerCase().trim();
    // Пошук по частковому співпадінню (якщо користувач написав просто "вода" замість "вода aotte")
    for (let key in prices) {
        if (key.includes(name) || name.includes(key)) {
            return prices[key];
        }
    }
    return prices[name] ? prices[name] : null;
}

// 2. ГОЛОВНА ФУНКЦІЯ
async function sendMessage() {
    const input = document.getElementById('ai-input');
    const history = document.getElementById('ai-messages');
    const text = input.value.trim();

    if (!text) return;

    history.innerHTML += `<div class="user-msg"><b>Ви:</b> ${text}</div>`;
    input.value = "";
    chatContext.push({ role: "user", parts: [{ text: text }] });

    // СИСТЕМНИЙ ПРОМПТ
    const systemPrompt = `Ти — експерт-менеджер магазину Market OS. 
    Твій асортимент: ${catalog.join(", ")}. 
    ПРАВИЛА:
    1. Спілкуйся вільно, будь привітним.
    2. Якщо питають ціну або наявність — ОБОВ'ЯЗКОВО викликай функцію getMarketData.
    3. Використовуй дані про ціни ТІЛЬКИ з функції.
    4. Якщо товару немає в списку — ввічливо скажи, що ми можемо замовити його пізніше.
    5. Твоя назва: AI-менеджер Market OS.`;
    
    const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]; 
    const apiKey = "AIzaSyBRwo5vXj6jPV8bFrzJAVflfGuH0u04eDE"; 

    let success = false;
    let aiPart = null;

    for (let modelName of models) {
        if (success) break;
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: chatContext,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    tools: [{
                        function_declarations: [{
                            name: "getMarketData",
                            description: "Отримує ціну товару з бази даних магазину",
                            parameters: {
                                type: "object",
                                properties: { itemName: { type: "string", description: "Назва товару, наприклад 'вода' або 'автомобіль'" } },
                                required: ["itemName"]
                            }
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (response.status !== 200) continue;

            aiPart = data.candidates[0].content.parts[0];

            // ЛОГІКА ВИКЛИКУ ФУНКЦІЙ
            if (aiPart.functionCall || (data.candidates[0].content.parts.some(p => p.functionCall))) {
                chatContext.push(data.candidates[0].content);
                
                const functionResponses = [];
                for (const part of data.candidates[0].content.parts) {
                    if (part.functionCall) {
                        const price = getMarketData(part.functionCall.args.itemName);
                        functionResponses.push({
                            functionResponse: {
                                name: "getMarketData",
                                response: { content: price ? `Ціна: $${price}` : "товар не знайдено в базі" }
                            }
                        });
                    }
                }

                chatContext.push({ role: "function", parts: functionResponses });

                const finalRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: chatContext,
                        systemInstruction: { parts: [{ text: systemPrompt }] }
                    })
                });
                const finalData = await finalRes.json();
                aiPart = finalData.candidates[0].content.parts[0];
            }
            success = true;
        } catch (e) { console.error(e); }
    }

    if (success && aiPart && aiPart.text) {
        chatContext.push({ role: "model", parts: [{ text: aiPart.text }] });
        history.innerHTML += `<div class="bot-msg"><b>Менеджер:</b> ${aiPart.text}</div>`;
    }
    
    if(chatContext.length > 12) chatContext = chatContext.slice(-12);
    history.scrollTop = history.scrollHeight;
}

// 3. ОБРОБКА ENTER
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('ai-input');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});