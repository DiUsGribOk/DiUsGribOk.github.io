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
    const twitchNickInput = document.getElementById('twitchNick');
    const twitchNick = twitchNickInput.value.trim().toLowerCase();
    
    if (!twitchNick) return alert('Введите ник!');

    // Проверяем наличие пароля
    const hasPassword = await checkIfHasPassword(twitchNick);
    
    if (hasPassword) {
        // Если пароль есть - сразу запрашиваем ввод
        showPasswordLogin();
        localStorage.setItem('pendingAuth', JSON.stringify({ nick: twitchNick }));
    } else {
        // Стандартный процесс с кодом подтверждения
        authCode = Math.floor(100000 + Math.random() * 900000);
        document.getElementById('authCodeDisplay').textContent = `Введите в чат Twitch: !подтвердить ${authCode}`;
        
        try {
            await fetch("https://GribDiUsOK69.pythonanywhere.com/generate_code", {
                method: "POST",
                body: JSON.stringify({ nick: twitchNick, code: authCode })
            });
            
            localStorage.setItem('pendingAuth', JSON.stringify({ nick: twitchNick, code: authCode }));
        } catch (error) {
            console.error("Ошибка:", error);
        }
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
// Обновленная функция verifyClientSide
async function verifyClientSide() {
    try {
        const pendingAuth = JSON.parse(localStorage.getItem('pendingAuth'));
        if (!pendingAuth) return;

        const response = await fetch(`https://GribDiUsOK69.pythonanywhere.com/check_auth?user=${pendingAuth.nick}`);
        const data = await response.json();

        if (data.status === 'success') {
            // Сохраняем пользователя
            currentUser = pendingAuth.nick;
            localStorage.setItem('currentUser', currentUser);
            
            // Проверяем наличие пароля
            const hasPassword = await checkIfHasPassword(currentUser);
            
            // Управление видимостью элементов
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('passwordSection').style.display = 'block';
            document.getElementById('setPasswordSection').style.display = hasPassword ? 'none' : 'block';
        }
    } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
    }
}

async function checkIfHasPassword(nick) {
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
