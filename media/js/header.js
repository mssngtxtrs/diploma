import { AuthAPI } from "./modules/auth_api.js";

const header = document.querySelector('header');
const account_nav = header.querySelector('.account-nav');
// const header_burger = document.querySelector('.header-burger');

// Смена стиля при прокрутке
globalThis.addEventListener('scroll', () => {
        const triggerPoint = globalThis.innerHeight - (globalThis.innerHeight * 0.9);

    function getPageOffset(element) {
        let topOffset = element.getBoundingClientRect().top;

        while (element != document.documentElement) {
            element = element.parentElement;
            topOffset += element.scrollTop;
        }

        return topOffset;
    };

    const pos = getPageOffset(header);

    if (pos > triggerPoint) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Сборка шапки
function buildHeader() {
    AuthAPI.getName()
    .then(json => {
        if (json.output == false) {
            account_nav.innerHTML += `<a class="button urgent account auth" href="/auth">Войти</a>`;
            // header_burger.innerHTML += `<a class="button urgent account" href="auth">Войти</a>`
        } else {
            account_nav.innerHTML += `
                <a class="button urgent account" href="/requests">${json.output}</a>
            `;
            // header_burger.innerHTML += `
            //     <a class="button urgent account" href="/requests">${json.output}</a>
            //     <a class="header-nav-link" href="/requests/new">Новая заявка</a>
            //     <a class="header-nav-link" href="/api/auth/log-out">Выйти</a>
            // `;
        }
    });
}





buildHeader();
