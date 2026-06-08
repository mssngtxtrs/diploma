# Инструкция по развёртыванию информационной системы LunaHost

## 1. Описание проекта

LunaHost — веб-приложение для управления хостинг-услугами. Система предоставляет пользователям личный кабинет для управления заявками, администраторам — панель управления тарифами, серверами и пользователями. Поддерживается авторизация, восстановление пароля и фоновая обработка заявок.

В проекте используются файлы из игры Touhou 8 ~ Imperishable Night

Также использованы изображения с сайта Transhumans и значки Adwaita

---

## 2. Технологии

| Компонент | Технология |
|---|---|
| Операционная система | Linux (Ubuntu/Debian) |
| Веб-сервер | Apache 2.4 |
| Серверный язык | PHP 8.x |
| Клиентский язык | TypeScript → JavaScript (через `tsc`) |
| СУБД | PostgreSQL 14+ |
| Планировщик задач | Cron |

---

## 3. Структура проекта

```
/var/www/lunahost
├── compile/                    # Исходники для компиляции (не деплоятся напрямую)
│   ├── css/                    # Исходные CSS-файлы (с @import)
│   │   └── style.css           # Точка входа, импортирует все стили
│   └── ts/                     # Исходные TypeScript-файлы
│       ├── modules/            # Общие модули (api, ui, utils)
│       ├── types/              # Типы TypeScript
│       ├── tsconfig.json       # Конфигурация компилятора
│       └── *.ts                # Скрипты страниц
├── media/                      # Статические файлы (шрифты, иконки, изображения)
│   ├── fonts/
│   └── icons/
├── private/
│   └── ssh_keys/               # SSH-ключи из заявок (вне web root недоступны клиенту)
├── server/
│   ├── basic/                  # Базовые классы: БД, авторизация, шаблонизатор
│   ├── cron/                   # Фоновые скрипты + README с командами запуска
│   ├── custom/                 # Бизнес-логика (работа с заявками)
│   └── router.php              # Маршрутизатор запросов
├── templates/                  # HTML-шаблоны страниц
├── .env                        # Переменные окружения (создаётся вручную по env.example)
├── env.example                 # Пример .env файла
├── index.php                   # Точка входа приложения
└── .htaccess                   # Правила Apache: роутинг, заголовки безопасности
```

---

## 4. Установка и настройка проекта

### 4.1. Подготовка сервера и установка зависимостей

Обновите пакеты и установите необходимое ПО:

```bash
sudo apt update && sudo apt upgrade -y

# Apache и PHP
sudo apt install -y apache2 php php-pgsql php-mbstring php-curl

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Node.js и TypeScript (для компиляции)
sudo apt install -y nodejs npm
sudo npm install -g typescript

# Утилита минификации CSS (опционально)
sudo npm install -g clean-css-cli
```

Включите нужные модули Apache:

```bash
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

### 4.2. Копирование файлов проекта

Скачайте исходный код проекта из Git-репозитория с помощью данной команды:

```bash
git clone https://github.com/mssngtxtrs/diploma.git
```

Этот шаг необязателен, можно использовать локальную копию проекта.

Разместите файлы проекта в директорию веб-сервера:

```bash
sudo mkdir -p /var/www/lunahost
sudo cp -r /путь/к/проекту/* /var/www/lunahost/

# Создайте директории для скомпилированных файлов, если их нет
sudo mkdir -p /var/www/lunahost/media/css
sudo mkdir -p /var/www/lunahost/media/js

# Настройте владельца файлов
sudo chown -R www-data:www-data /var/www/lunahost
sudo chmod -R 755 /var/www/lunahost
sudo chmod -R 750 /var/www/lunahost/private
```

Создайте файл `.env` на основе примера и заполните его:

```bash
sudo cp /var/www/lunahost/env.example /var/www/lunahost/.env
sudo nano /var/www/lunahost/.env
```

### 4.3. Настройка базы данных

Создайте пользователя и базу данных PostgreSQL:

```bash
sudo -u postgres psql
```

```sql
CREATE USER lunahost_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE lunahost_db OWNER lunahost_user;
GRANT ALL PRIVILEGES ON DATABASE lunahost_db TO lunahost_user;
\q
```

Примените схему базы данных (если есть файл миграций):

```bash
sudo -u www-data psql -U lunahost_user -d lunahost_db -f /var/www/lunahost/server/db/schema.sql
```

Укажите параметры подключения в `.env`:

```
# Database
HOSTNAME="localhost"
USERNAME="lunahost_user"
PASSWORD="your_secure_password"
DATABASE="lunahost_db"

# Mailing
MAIL_FROM="noreply@lunahost.ru"
```

### 4.4. Компиляция CSS и TypeScript

**Компиляция TypeScript в JavaScript:**

```bash
cd /var/www/lunahost/compile/ts
tsc

# Скопируйте скомпилированные JS-файлы в media/js
cp -r /var/www/lunahost/compile/ts/dist/* /var/www/lunahost/media/js/
# (или настройте outDir в tsconfig.json на /var/www/lunahost/media/js)
```

**Сборка и минификация CSS:**

```bash
# Сборка через cleancss (объединяет @import и минифицирует)
cleancss -o /var/www/lunahost/media/css/style.min.css \
         /var/www/lunahost/compile/css/style.css

# Если минификация не нужна — простое копирование
cp /var/www/lunahost/compile/css/style.css /var/www/lunahost/media/css/style.css
```

> Убедитесь, что пути к CSS и JS в HTML-шаблонах соответствуют `/media/css/` и `/media/js/`.

### 4.5. Настройка веб-сервера Apache

Создайте конфигурационный файл виртуального хоста:

```bash
sudo nano /etc/apache2/sites-available/lunahost.conf
```

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/lunahost

    <Directory /var/www/lunahost>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Запрет доступа к приватным данным
    <Directory /var/www/lunahost/private>
        Require all denied
    </Directory>

    # Запрет доступа к исходникам
    <Directory /var/www/lunahost/compile>
        Require all denied
    </Directory>

    # Запрет доступа к серверным скриптам напрямую
    <Directory /var/www/lunahost/server>
        Require all denied
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/lunahost_error.log
    CustomLog ${APACHE_LOG_DIR}/lunahost_access.log combined
</VirtualHost>
```

Активируйте сайт и перезапустите Apache:

```bash
sudo a2ensite lunahost.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
```

> Для HTTPS настройте SSL-сертификат через Certbot: `sudo certbot --apache -d yourdomain.com`

### 4.6. Настройка Cron

Фоновые скрипты находятся в `/var/www/lunahost/server/cron/`. Подробное описание каждого скрипта и рекомендуемые команды запуска приведены в файле:

```
/var/www/lunahost/server/cron/README.md
```

Ознакомьтесь с ним перед настройкой. Для редактирования crontab выполните:

```bash
sudo crontab -u www-data -e
```

Пример записей (точные команды — в [/server/basic/cron/README.md](/server/basic/cron/README.md)):

```cron
# Проверка истечения срока заявок — каждый час
0 * * * * php /var/www/lunahost/server/cron/check_for_expiration.php >> /var/www/lunahost/server/cron/logs/expiration.log 2>&1

# Очистка старых записей восстановления пароля — каждую ночь в 03:00
0 3 * * * php /var/www/lunahost/server/cron/clean_old_pwd_changes.php >> /var/www/lunahost/server/cron/logs/pwd_cleanup.log 2>&1
```

Убедитесь, что директория логов существует и доступна для записи:

```bash
sudo mkdir -p /var/www/lunahost/server/cron/logs
sudo chown www-data:www-data /var/www/lunahost/server/cron/logs
```

---

## 5. Проверка развёртывания

После выполнения всех шагов проверьте работоспособность системы:

```bash
# Статус Apache
sudo systemctl status apache2

# Статус PostgreSQL
sudo systemctl status postgresql

# Доступность сайта
curl -I http://yourdomain.com

# Проверка cron-задач
sudo crontab -u www-data -l
```

Откройте браузер и перейдите по адресу сервера. При успешном развёртывании должна открыться главная страница приложения.
