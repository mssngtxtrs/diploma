# Задачи для cron


## Проверка на истечение срока действия

### Описание

Проверка запросов на истечение срока действия. Если срок действия запроса истек, статус сменяется на "Завершена".

### Команда

```sh
php /path/to/server/custom/cron/check_for_expiration.php > ./logs/check_for_expiration-$(date +%Y-%m-%d_%H:%M:%S).log 2>&1
```

Исполнение команды и вывод в лог из stdout и stderr. Лог сохраняется с временной меткой.

### Задача для cron

```cron
0 0,12 * * * php /path/to/server/custom/cron/check_for_expiration.php > ./logs/check_for_expiration-$(date +%Y-%m-%d_%H:%M:%S).log 2>&1
```

Запускает задачу каждый день каждые 12 часов.
