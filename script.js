// Обробка форми замовлення
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        description: document.getElementById('description').value,
        deadline: document.getElementById('deadline').value,
        budget: document.getElementById('budget').value
    };
    
    // Валідація даних
    if (!validateForm(formData)) {
        return;
    }
    
    // Показати статус завантаження
    const statusDiv = document.getElementById('orderStatus');
    statusDiv.className = '';
    statusDiv.textContent = 'Надсилання замовлення...';
    statusDiv.style.display = 'block';
    
    try {
        // Спроба надіслати дані на сервер
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusDiv.className = 'success';
            statusDiv.textContent = '✅ Замовлення успішно надіслано! Ми зв\'яжемося з вами найближчим часом.';
            document.getElementById('orderForm').reset();
        } else {
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ Помилка: ' + (result.message || 'Не вдалося надіслати замовлення');
        }
    } catch (error) {
        console.error('Error:', error);
        // Якщо сервер не доступний - демо-режим
        statusDiv.className = 'success';
        statusDiv.textContent = '✅ Демо-режим: Замовлення прийнято! (Для повноцінної роботи запустіть Flask сервер: python app.py)';
        document.getElementById('orderForm').reset();
        
        // Зберегти в localStorage для демо
        const orders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
        orders.push({
            ...formData,
            id: orders.length + 1,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('demoOrders', JSON.stringify(orders));
        console.log('Демо-замовлення збережено в localStorage:', formData);
    }
});

// Валідація форми
function validateForm(data) {
    if (!data.name || data.name.length < 2) {
        showStatus('error', '❌ Введіть коректне ім\'я (мінімум 2 символи)');
        return false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showStatus('error', '❌ Введіть коректний email');
        return false;
    }
    
    if (!data.service) {
        showStatus('error', '❌ Оберіть тип послуги');
        return false;
    }
    
    if (!data.description || data.description.length < 10) {
        showStatus('error', '❌ Опишіть завдання детальніше (мінімум 10 символів)');
        return false;
    }
    
    return true;
}

// Перевірка email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Показати статус
function showStatus(type, message) {
    const statusDiv = document.getElementById('orderStatus');
    statusDiv.className = type;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
}

// Плавна прокрутка до секцій
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Анімація при скролі
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Динамічне оновлення цін на основі вибраної послуги
document.getElementById('service').addEventListener('change', function() {
    const servicePrices = {
        'website': 2000,
        'notes': 100,
        'programming': 150,
        'coursework': 500,
        'other': 200
    };
    
    const selectedService = this.value;
    const budgetInput = document.getElementById('budget');
    
    if (servicePrices[selectedService]) {
        budgetInput.placeholder = `Рекомендована ціна: від ${servicePrices[selectedService]} грн`;
        budgetInput.min = servicePrices[selectedService];
    }
});

// ========== СИСТЕМА АВТОРИЗАЦІЇ ==========

// Змінні для зберігання стану авторизації
let currentUser = null;
let authToken = null;

// Перевірка авторизації при завантаженні сторінки
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    
    if (user && token) {
        currentUser = JSON.parse(user);
        authToken = token;
        updateAuthUI();
        return true;
    }
    return false;
}

// Оновлення інтерфейсу залежно від статусу авторизації
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const authRequired = document.getElementById('authRequired');
    const orderForm = document.getElementById('orderForm');
    
    if (currentUser) {
        // Користувач авторизований
        authBtn.textContent = `👤 ${currentUser.email}`;
        authBtn.onclick = logout;
        
        // Приховати блок авторизації
        if (authRequired) {
            authRequired.style.display = 'none';
        }
        
        // Показати форму замовлення
        if (orderForm) {
            orderForm.style.display = 'block';
        }
        
        // Автоматично заповнити email у формі замовлення
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = currentUser.email;
            emailInput.readOnly = true;
        }
    } else {
        // Користувач не авторизований
        authBtn.textContent = 'Увійти / Зареєструватися';
        authBtn.onclick = showAuthModal;
        
        // Показати блок авторизації та приховати форму
        if (authRequired) {
            authRequired.style.display = 'block';
        }
        if (orderForm) {
            orderForm.style.display = 'none';
        }
        
        // Зняти readonly з email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.readOnly = false;
        }
    }
}

// Відкрити модальне вікно авторизації
function showAuthModal() {
    document.getElementById('authModal').style.display = 'block';
}

// Закрити модальне вікно авторизації
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Перемикання між табами
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Оновити активний таб
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Показати відповідну форму
        const tab = this.getAttribute('data-tab');
        document.querySelectorAll('.auth-form').forEach(form => {
            form.style.display = 'none';
        });
        
        if (tab === 'login') {
            document.getElementById('loginForm').style.display = 'block';
        } else {
            document.getElementById('registerForm').style.display = 'block';
        }
    });
});

// Обробка форми входу
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const statusDiv = document.getElementById('loginStatus');
    
    statusDiv.textContent = 'Вхід...';
    statusDiv.className = '';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            authToken = result.token;
            
            // Зберегти в localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            
            statusDiv.className = 'success';
            statusDiv.textContent = '✅ Вхід успішний!';
            
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI();
                document.getElementById('loginForm').reset();
                statusDiv.className = '';
                statusDiv.textContent = '';
            }, 1000);
        } else {
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ ' + (result.message || 'Невірний email або пароль');
        }
    } catch (error) {
        console.error('Error:', error);
        // Демо-режим
        if (password.length >= 6) {
            currentUser = { email: email, id: Date.now() };
            authToken = 'demo-token-' + Date.now();
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            
            statusDiv.className = 'success';
            statusDiv.textContent = '✅ Демо-режим: Вхід успішний!';
            
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI();
                document.getElementById('loginForm').reset();
                statusDiv.className = '';
                statusDiv.textContent = '';
            }, 1000);
        } else {
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ Пароль має бути не менше 6 символів';
        }
    }
});

// Обробка форми реєстрації
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const statusDiv = document.getElementById('registerStatus');
    
    // Валідація паролів
    if (password !== passwordConfirm) {
        statusDiv.className = 'error';
        statusDiv.textContent = '❌ Паролі не співпадають';
        return;
    }
    
    if (password.length < 6) {
        statusDiv.className = 'error';
        statusDiv.textContent = '❌ Пароль має бути не менше 6 символів';
        return;
    }
    
    statusDiv.textContent = 'Реєстрація...';
    statusDiv.className = '';
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            authToken = result.token;
            
            // Зберегти в localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            
            statusDiv.className = 'success';
            statusDiv.textContent = '✅ Реєстрація успішна!';
            
            setTimeout(() => {
                closeAuthModal();
                updateAuthUI();
                document.getElementById('registerForm').reset();
                statusDiv.className = '';
                statusDiv.textContent = '';
            }, 1000);
        } else {
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ ' + (result.message || 'Не вдалося зареєструватися');
        }
    } catch (error) {
        console.error('Error:', error);
        // Демо-режим
        currentUser = { email: email, id: Date.now() };
        authToken = 'demo-token-' + Date.now();
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);
        
        statusDiv.className = 'success';
        statusDiv.textContent = '✅ Демо-режим: Реєстрація успішна!';
        
        setTimeout(() => {
            closeAuthModal();
            updateAuthUI();
            document.getElementById('registerForm').reset();
            statusDiv.className = '';
            statusDiv.textContent = '';
        }, 1000);
    }
});

// Вихід з акаунту
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    currentUser = null;
    authToken = null;
    updateAuthUI();
}

// Закриття модального вікна при кліку поза ним
window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target == modal) {
        closeAuthModal();
    }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Додати обробник для кнопки авторизації в навігації
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.onclick = showAuthModal;
    }
});
