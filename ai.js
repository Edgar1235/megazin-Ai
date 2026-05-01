// 1. ПАМ'ЯТЬ ТА БАЗОВІ ДАНІ
let chatContext = [];
const catalog = ["скейтборд", "велосипед", "електросамокат", "мотоцикл", "автомобіль", "фарба", "ламінат", "шпалери", "картина", "макарони", "батон", "молоко", "яблука", "стілець", "стіл", "шафа"];

function getMarketData(itemName) {
    const prices = {
        "скейтборд": 50, "велосипед": 250, "електросамокат": 400, "мотоцикл": 1500, "автомобіль": 12000,
        "фарба": 15, "ламінат": 20, "шпалери": 25, "картина": 100,
        "макарони": 2, "батон": 1.5, "молоко": 1.2, "яблука": 3,
        "стілець": 45, "стіл": 120, "шафа": 350
    };
    const name = itemName.toLowerCase().trim();
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

    // СИСТЕМНИЙ ПРОМПТ (Твій "мозок")
    const systemPrompt = `Ти — експерт Market OS. 
    Твій асортимент: ${catalog.join(", ")}. 
    ПРАВИЛА:
    1. Спілкуйся вільно на будь-які теми.
    2. Якщо питають ціну — ВИКЛИКАЙ getMarketData.
    3. Якщо в одному питанні декілька товарів — викликай getMarketData для КОЖНОГО окремо.
    4. Якщо товару немає в списку — скажи, що ми можемо його замовити пізніше.`;
    
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"]; 
    const apiKey = "AIzaSyCTSrz4cNMjcdHqT0FBaFWhv6-uKZvwvvE"; 

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
                            description: "Отримує ціну товару",
                            parameters: {
                                type: "object",
                                properties: { itemName: { type: "string" } },
                                required: ["itemName"]
                            }
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (response.status !== 200) continue;

            aiPart = data.candidates[0].content.parts[0];

            // ЛОГІКА ВИКЛИКУ ФУНКЦІЙ (підтримка декількох викликів)
            if (aiPart.functionCall || (data.candidates[0].content.parts.some(p => p.functionCall))) {
                chatContext.push(data.candidates[0].content);
                
                const functionResponses = [];
                for (const part of data.candidates[0].content.parts) {
                    if (part.functionCall) {
                        const price = getMarketData(part.functionCall.args.itemName);
                        functionResponses.push({
                            functionResponse: {
                                name: "getMarketData",
                                response: { content: price ? `Ціна: $${price}` : "немає в базі" }
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