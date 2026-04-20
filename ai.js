// Пам'ять бота (зберігає останні 6 повідомлень)
let chatContext = [];

async function sendMessage() {
    const input = document.getElementById('ai-input');
    const history = document.getElementById('ai-messages'); 
    const text = input.value.trim();
    
    if(!text) return;

    // Відображаємо повідомлення користувача
    history.innerHTML += `<div class="user-msg">${text}</div>`;
    input.value = "";
    history.scrollTop = history.scrollHeight;
    
    // Додаємо в контекст
    chatContext.push({ role: "user", parts: [{ text: text }] });
    if(chatContext.length > 6) chatContext.shift();

    const systemPrompt = "Ти — інтелектуальний менеджер Market OS. Твій асортимент та ціни: " +
    "ТРАНСПОРТ: Скейтборд $50, Велосипед $250, Електросамокат $400, Мотоцикл $1500, Автомобіль $12000. " +
    "ДЕКОР: Фарба $15, Ламінат $20, Шпалери $25, Картина $100. " +
    "ПРОДУКТИ: Макарони $2, Батон $1.5, Молоко $1.2, Яблука $3. " +
    "МЕБЛІ: Стілець $45, Стіл $120, Шафа $350. " +
    "Допомагай користувачу з вибором. Відповідай коротко та ввічливо українською мовою.";

    try {
        // ВИПРАВЛЕНО: v1beta та модель 1.5-flash
        const apiKey = "AIzaSyBQJdPPiwCKJ0-in-gH5w_KnxolL92od7I";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    ...chatContext
                ]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            chatContext.push({ role: "model", parts: [{ text: aiResponse }] });
            
            // Відображаємо відповідь бота
            history.innerHTML += `<div class="bot-msg">${aiResponse}</div>`;
        } else {
            history.innerHTML += `<div class="bot-msg" style="color: orange;">ШІ думає... Спробуйте ще раз за мить.</div>`;
        }
        
    } catch (e) {
        history.innerHTML += `<div class="bot-msg" style="color: red;">Помилка підключення до мозку OS. Перевірте консоль.</div>`;
        console.error("Помилка ШІ:", e);
    }
    
    history.scrollTop = history.scrollHeight;
}