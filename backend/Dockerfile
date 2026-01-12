FROM python:3.12-slim

# Установка переменных окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода
COPY . .

# Создание папок для статики и загрузок
RUN mkdir -p static/uploads

# Открываем порт (тот же, что в main.py)
EXPOSE 4000

# Запуск приложения
# Используем 0.0.0.0, чтобы сервер был доступен снаружи контейнера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]

