// Добавьте этот код в конец обработчика DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("[Frontend] Страница загружена, инициализация...");
    currentUser = localStorage.getItem('currentUser');
    updateUI();
    verifyClientSide();

    setInterval(() => {
        verifyClientSide();
    }, 3000);
});

let currentUser = null;
let authCode = null;


// Генерация кода
async function startAuth() {
    const nick = document.getElementById('twitchNick').value.trim();
    if (!nick) return alert('Введите ник!');

    authCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        const response = await fetch('https://GribDiUsOK69.pythonanywhere.com/generate_code', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nick, code: authCode })
        });
        
        if (response.ok) {
            // Сохраняем данные для верификации
            localStorage.setItem('pendingAuth', JSON.stringify({
                nick: nick,
                code: authCode
            }));
            
            document.getElementById('authCodeDisplay').textContent = `Код: ${authCode}`;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    } else {
        console.error("Элемент #sidebar не найден!");
    }
}

// Обновление интерфейса
function updateUI() {
    const authSection = document.getElementById('authSection');
    const passwordLoginSection = document.getElementById('passwordLoginSection');
    const passwordSetupSection = document.getElementById('passwordSetupSection');
    const userInfo = document.getElementById('userInfo');

    // Всегда сбрасываем стили
    [authSection, passwordLoginSection, passwordSetupSection, userInfo].forEach(el => {
        if (el) el.style.display = 'none';
    });

    if (currentUser) {
        userInfo.style.display = 'block';
        loadBalance();
    } else {
        authSection.style.display = 'block';
    }
}

// Проверка авторизации
// Обновите функцию verifyClientSide
// Обновленная функция verifyClientSide
// Обновите функцию verifyClientSide в script.js
// Модифицированная функция verifyClientSide
sync function verifyClientSide() {
    try {
        const pendingAuth = JSON.parse(localStorage.getItem('pendingAuth'));
        if (!pendingAuth) return;

        const response = await fetch(
            `https://GribDiUsOK69.pythonanywhere.com/verify_code?nick=${encodeURIComponent(pendingAuth.nick)}&code=${encodeURIComponent(pendingAuth.code)}`
        );
        
        const data = await response.json();
        console.log("Ответ сервера:", data);

        if (data.status === 'success') {
            // Явно сохраняем пользователя
            localStorage.setItem('currentUser', pendingAuth.nick);
            localStorage.removeItem('pendingAuth');
            
            // Принудительное обновление
            window.location.href = window.location.href + '?forceReload=' + Date.now();
        }
    } catch (error) {
        console.error("Ошибка:", error);
    }
}



async function checkIfHasPassword(nick) {
    const password = document.getElementById('passwordLoginInput').value;
    try {
        const response = await fetch(`https://GribDiUsOK69.pythonanywhere.com/has_password?nick=${nick}`);
        const data = await response.json();
        return data.has_password;
    } catch (error) {
        return false;
    }
}

function showPasswordSetup() {
    document.getElementById('newPassword').value = ''; // Очищаем при каждом показе
    document.getElementById('passwordSection').style.display = 'block';
    document.getElementById('setPasswordSection').style.display = 'block';
}

function showPasswordLogin() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('passwordLoginSection').style.display = 'block';
    document.getElementById('authCodeDisplay').style.display = 'none';
}

async function setPassword(event) { 
    event.preventDefault(); 
    const newPassword = document.getElementById('passwordSetupInput').value;
    const pendingAuth = JSON.parse(localStorage.getItem('pendingAuth'));
    
    if (!pendingAuth) {
        alert('Ошибка: сессия авторизации не найдена');
        return;
    }

    if (newPassword.length < 6) {
        return alert('Пароль должен быть не менее 6 символов!');
    }

    try {
        const response = await fetch('https://GribDiUsOK69.pythonanywhere.com/set_password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nick: pendingAuth.nick,
                password: newPassword
            })
        });
        
        if (response.ok) {
            currentUser = pendingAuth.nick;
            localStorage.setItem('currentUser', currentUser);
            localStorage.removeItem('pendingAuth');
            updateUI();
        }
    } catch (error) {
        console.error('Ошибка установки пароля:', error);
    }
}


async function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    const currentUser = localStorage.getItem('currentUser'); // Получаем из localStorage
    
    if (!currentUser) {
        // Если пользователь не найден, перенаправляем на начальный экран
        localStorage.removeItem('pendingAuth');
        window.location.reload();
        return;
    }

    try {
        const response = await fetch('https://GribDiUsOK69.pythonanywhere.com/check_password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nick: currentUser, // Используем сохраненного пользователя
                password: password
            })
        });
        
        if (response.status === 200) {
            updateUI(); // Обновляем интерфейс
        } else {
            alert('Неверный пароль!');
        }
    } catch (error) {
        console.error('Ошибка проверки пароля:', error);
    }
}

// Запрос баланса
async function loadBalance() {
    try {
        const response = await fetch(`https://GribDiUsOK69.pythonanywhere.com/get_balance?user=${currentUser}`);
        const data = await response.json();
        
        const balanceDisplay = document.getElementById('userBalance');
        if (balanceDisplay) {
            balanceDisplay.textContent = data.balance;
        }
    } catch (error) {
        console.error("Ошибка загрузки баланса:", error);
    }
}

// Выход
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('pendingAuth');
    currentUser = null;
    updateUI();
    window.location.reload(); // Обновляем страницу
}
