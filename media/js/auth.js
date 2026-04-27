function checkPasswords() {
    const pass = document.querySelector('#reg #password');
    const pass_confirm = document.getElementById('password-confirm');

    if (pass.value !== pass_confirm.value) {
        pass_confirm.setCustomValidity('Пароли не совпадают');
    } else {
        pass_confirm.setCustomValidity('');
    }
}



const buttons = document.querySelectorAll('.auth-switcher button');
const forms = document.querySelectorAll('.forms form');
const inputs = document.querySelectorAll('form input');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.dataset.target;

        forms.forEach(f => f.style.display = 'none');
        document.getElementById(id).style.display = 'flex';

        buttons.forEach(b => b.classList.remove('opened'));
        btn.classList.add('opened');
    });
});

inputs.forEach(input => {
    input.addEventListener('input', () => {
        const error_span = input.nextElementSibling;
        if (!input.validity.valid) {
            error_span.innerHTML = input.getAttribute('title');
        } else {
            error_span.innerHTML = '';
        }
    });
});

forms[0].style.display = 'flex';
buttons[0].classList.add('opened');
