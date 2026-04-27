import { AuthAPI } from "./modules/auth_api.js";

// Сборка шапки
function buildHeader() {
    AuthAPI.getName()
    .then(json => {
        if (json.output != false) {
            account_nav.innerHTML += `
                <p>${json.output}</p>
                <a class="footer-nav-link" href="/requests">Личный кабинет</a>
                <a class="footer-nav-link" href="/requests/new">Новая заявка</a>
                <a class="footer-nav-link" href="/api/auth/log-out">Выйти</a>
            `;
        } else {
            account_nav.innerHTML += `
                <p>Аккаунт</p>
                <a class="footer-nav-link" href="/auth">Войти</a>
            `
        }
    });
}





const footer = document.querySelector('footer');
const account_nav = footer.querySelector('.account-nav');


buildHeader();
