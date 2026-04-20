// Універсальна функція додавання в кошик
function addToCart(elementOrName, price = null) {
    let name;
    let finalPrice;

    // Якщо передали кнопку (об'єкт)
    if (typeof elementOrName === 'object' && elementOrName.closest) {
        const card = elementOrName.closest('.card') || elementOrName.closest('.product-card');
        if (!card) return;
        name = card.querySelector('.product-name').innerText;
        const priceText = card.querySelector('.product-price').innerText;
        finalPrice = parseFloat(priceText.replace('$', '').trim());
    } 
    // Якщо передали назву та ціну текстом (наприклад, з консолі або бота)
    else {
        name = elementOrName;
        finalPrice = parseFloat(price);
    }

    if (isNaN(finalPrice)) return;

    // Логіка збереження
    let cart = JSON.parse(localStorage.getItem('marketCart')) || [];
    cart.push({ name: name, price: finalPrice });
    localStorage.setItem('marketCart', JSON.stringify(cart));
    
    // Оновлення суми на плашці вгорі (якщо вона є на сторінці)
    updateTopNavCart();

    alert(`✅ ${name} додано до кошика!`);
}

// Оновлення суми в навігації на всіх сторінках
function updateTopNavCart() {
    const cart = JSON.parse(localStorage.getItem('marketCart')) || [];
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const totalElement = document.getElementById('cart-total-nav');
    const countElement = document.getElementById('cart-count-nav');
    
    if (totalElement) totalElement.innerText = `$${total.toFixed(2)}`;
    if (countElement) countElement.innerText = cart.length;
}

// Запускаємо оновлення при завантаженні будь-якої сторінки
document.addEventListener('DOMContentLoaded', updateTopNavCart);