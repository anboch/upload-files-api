
# REST API для загрузки и выгрузки файлов, c авторизацией с помощью JWT.

## Установка, сборка и запуск

    npm install
    npm run build
    npm start

Для запуска API необходимо создать и заполнить .env файл в корне проекта, взяв за образец .env.example.

# REST API
По умолчанию сервер запускается по адресу 

    localhost:5000

## Регистрация

    /signup [POST]

Тело запроса должно содержать:

  -id: string;  
  -password: string;

## Вход

    /signin [POST]

Тело запроса должно содержать:

  -id: string;  
  -password: string;

В теле ответа будет находиться пара JWT: { accessToken, refreshToken }

  >При необходимости авторизации по JWT необходимо в заголовок
  запроса 'Authorization' добавить значение 'Bearer ' + token

## Обновление access токена по refresh токену 
(необходим refreshToken)

    /signin/new_token [POST]

В теле ответа будет находиться новая пара JWT

## Получение id авторизованного пользователя 
(необходим accessToken)

    /info [GET]

В теле ответа будет находиться id пользователя

## Выход из системы 
(необходим accessToken)

    /logout [GET]

## Добавление нового файла в систему и запись параметров файла в базу данных 
(необходим accessToken)

    /file/upload [POST]

>В форме для отправки файла, в поле "name" необходимо указать значение "file"

##  Вывод списка файлов и их параметров из базы 
(необходим accessToken)

    /file/list [GET]

Для пагинации к адресу могут быть добавлены query-параметры : list_size (размер списка) и page (номер страницы). По умолчанию list_size = 10 page = 1.

## - Удаление файла и информации о нём из базы данных 
(необходим accessToken)

    /file/delete/:id [DELETE]

## - Вывод информации о файле 
(необходим accessToken)

    /file/:id [GET]

## - Скачивание файла 
(необходим accessToken)

    /file/download/:id [GET]

## - Обновление файла и информации о нём в базе данных 
(необходим accessToken)

    /file/update/:id [PUT]

>В форме для отправки файла, в поле "name" необходимо указать значение "file"


# Запуск unit тестов

    npm run test
