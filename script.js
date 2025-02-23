// Добавьте этот код в конец обработчика DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("[Frontend] Страница загружена, инициализация...");
    updateUI();
    verifyClientSide();

    // Проверяем авторизацию каждые 3 секунды
    setInterval(() => {
        verifyClientSide();
    }, 3000);
});

let currentUser = null;
let authCode = null;

// Генерация кода
async function startAuth() {
    console.log("[Frontend] Начало авторизации...");

    const twitchNickInput = document.getElementById('twitchNick');
    const authCodeDisplay = document.getElementById('authCodeDisplay');

    if (!twitchNickInput) {
        console.error("Ошибка: элемент #twitchNick не найден! Проверь HTML.");
        return;
    }

    if (!authCodeDisplay) {
        console.error("Ошибка: элемент #authCodeDisplay не найден! Проверь HTML.");
        return;
    }

    const twitchNick = twitchNickInput.value.trim().toLowerCase();
    if (!twitchNick) return alert('Введите ник!');

    authCode = Math.floor(100000 + Math.random() * 900000);
    authCodeDisplay.textContent = `Введите в чат Twitch: !подтвердить ${authCode}`;

    try {
        const response = await fetch("https://GribDiUsOK69.pythonanywhere.com/generate_code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nick: twitchNick, code: authCode })
        });

        const data = await response.json();
        if (data.status === 'ok') {
            localStorage.setItem('pendingAuth', JSON.stringify({ nick: twitchNick, code: authCode }));
            console.log("[Frontend] Код успешно отправлен!");
        } else {
            alert("Ошибка при генерации кода!");
        }
    } catch (error) {
        console.error("Ошибка:", error);
    }
}

// Открыть/закрыть меню
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// Обновление интерфейса
function updateUI() {
    const authSection = document.getElementById('authSection');
    const passwordSection = document.getElementById('passwordSection');
    const userInfo = document.getElementById('userInfo');

    if (currentUser) {
        authSection.style.display = 'none';
        passwordSection.style.display = 'none';
        userInfo.style.display = 'block';
        loadBalance();
    } else {
        authSection.style.display = 'block';
        passwordSection.style.display = 'none';
        userInfo.style.display = 'none';
    }
}

// Проверка авторизации
// Обновите функцию verifyClientSide
async function verifyClientSide() {
    try {
        const pendingAuth = JSON.parse(localStorage.getItem('pendingAuth'));
        if (!pendingAuth) return;

        const response = await fetch(`https://GribDiUsOK69.pythonanywhere.com/check_auth?user=${pendingAuth.nick}`);
        const data = await response.json();

        if (data.status === 'success') {
            const hasPassword = await checkIfHasPassword(pendingAuth.nick);
            
            // Скрываем все элементы
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('passwordSection').style.display = 'none';
            document.getElementById('setPasswordSection').style.display = 'none';

            // Показываем только нужное
            if (hasPassword) {
                document.getElementById('passwordInput').value = ''; // Очищаем поле
                document.getElementById('passwordSection').style.display = 'block';
            } else {
                document.getElementById('newPassword').value = ''; // Очищаем поле
                document.getElementById('passwordSection').style.display = 'block';
                document.getElementById('setPasswordSection').style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
    }
}

async function checkIfHasPassword(nick) {
    try {
        const response = await fetch(`https://GribDiUsOK69.pythonanywhere.com/check_auth?user=${nick}`);
        const data = await response.json();
        return data.user && data.user.password_hash; // Проверяем наличие хэша
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
    document.getElementById('passwordInput').value = ''; // Очищаем при каждом показе
    document.getElementById('passwordSection').style.display = 'block';
}

async function setPassword(event) { // Добавлен параметр event
    event.preventDefault(); // Теперь работает корректно
    
    const newPassword = document.getElementById('newPassword').value;
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
    let currentUser = localStorage.getItem('currentUser'); // <-- Исправлено
    
    if (!currentUser) {
        alert('Сначала выполните вход!');
        return;
    }

    try {
        const response = await fetch('https://GribDiUsOK69.pythonanywhere.com/check_password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nick: currentUser,
                password: password
            })
        });
        
        if (response.status === 200) {
            currentUser = pendingAuth.nick; // Теперь ошибки не будет
            updateUI();
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
    currentUser = null;
    updateUI();
}
