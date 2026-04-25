import os
import json
import uuid
import asyncio
from typing import List, Dict, Any

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

async def estimate_resources_with_ai(description: str) -> List[Dict[str, Any]]:
    """
    1. Анализирует описание проекта через LLM для получения списка ресурсов.
    2. Ищет цены на эти ресурсы в интернете через DuckDuckGo.
    3. Формирует итоговую смету (название, цена, количество, поставщик) с помощью LLM.
    """
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not AsyncOpenAI or not DDGS:
        print("ВНИМАНИЕ: Нет OPENAI_API_KEY или не установлены openai / duckduckgo_search. Возвращаем моковые данные.")
        # Если ключа или библиотек нет, возвращаем заглушку (fallback)
        return [
            {"id": str(uuid.uuid4()), "name": "Игровое оборудование", "quantity": 5, "unit": "шт.", "estimatedCost": 30000, "supplier": "СпортОбъект"},
            {"id": str(uuid.uuid4()), "name": "Резиновое покрытие", "quantity": 100, "unit": "м²", "estimatedCost": 2500, "supplier": "Леруа Мерлен"},
        ]
    
    client = AsyncOpenAI(api_key=api_key)
    
    # Шаг 1: Извлекаем список ресурсов
    extract_prompt = f"""
    Проект: "{description}".
    Какие материальные ресурсы или услуги нужны для реализации этого проекта? 
    Выведи список (не более 4-5 ключевых позиций) в виде простого JSON-массива строк. 
    Пример: ["скамейка уличная", "качели детские", "песок строительный"]
    Верни только JSON объект с полем "items", содержащим массив.
    """
    
    try:
        response1 = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": extract_prompt}],
            response_format={"type": "json_object"}
        )
        
        items_data = json.loads(response1.choices[0].message.content)
        items = items_data.get("items", ["строительные материалы", "услуги монтажа"])
            
    except Exception as e:
        print("Ошибка извлечения ресурсов:", e)
        items = ["строительные материалы", "услуги монтажа"]

    # Шаг 2: Поиск цен в интернете
    def search_sync(item):
        try:
            ddgs = DDGS()
            results = ddgs.text(f"купить {item} цена интернет магазин", region='ru-ru', max_results=3)
            snippets = [r.get('body', '') for r in results]
            return f"Товар: {item}. Найденные данные в сети: " + " | ".join(snippets)
        except Exception:
            return f"Товар: {item}. Информации о ценах не найдено."

    # Выполняем поиск параллельно
    loop = asyncio.get_event_loop()
    tasks = [loop.run_in_executor(None, search_sync, item) for item in items[:5]]
    search_results = await asyncio.gather(*tasks)
    
    context_str = "\n".join(search_results)
    
    # Шаг 3: Составляем итоговую смету
    estimate_prompt = f"""
    Ты составляешь предварительную смету для проекта: "{description}".
    
    Вот результаты поиска по ценам в интернете (актуальные данные):
    {context_str}
    
    На основе этих данных сформируй список ресурсов с примерными ценами.
    Твоя задача вернуть JSON-объект с ключом "resources", который содержит массив объектов:
    {{
        "name": "Название ресурса",
        "quantity": <число, примерное количество для данного проекта>,
        "unit": "Единица измерения (шт., м² и т.д.)",
        "estimatedCost": <число, цена за единицу в рублях>,
        "supplier": "Название возможного поставщика из поиска (если есть, иначе 'Локальный поставщик')"
    }}
    
    Обязательно верни валидный JSON.
    """
    
    try:
        response2 = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты - опытный сметчик. Выводишь только JSON."},
                {"role": "user", "content": estimate_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        final_data = json.loads(response2.choices[0].message.content)
        resources = final_data.get("resources", [])
        
        # Добавляем уникальные ID для фронтенда
        for r in resources:
            r["id"] = f"ai-res-{uuid.uuid4().hex[:6]}"
            r["estimatedCost"] = float(r.get("estimatedCost", 0))
            r["quantity"] = float(r.get("quantity", 1))
            r["supplier"] = r.get("supplier", "Неизвестно")
            
        return resources
    except Exception as e:
        print("Ошибка составления сметы:", e)
        # Fallback
        return [
            {"id": str(uuid.uuid4()), "name": "Не удалось сгенерировать точную смету", "quantity": 1, "unit": "шт.", "estimatedCost": 0, "supplier": "-"}
        ]
