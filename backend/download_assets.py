import os
import requests
import uuid
import time
import random

# Конфигурация
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CATEGORIES = {
    "проект": ["Project", "Building", "Park", "City"],
    "аватары": ["User", "Avatar", "Profile"],
    "нко": ["NPO", "NGO", "Office"]
}

def download_image(category_name, text):
    # Используем placehold.co - это текстовые заглушки, они работают везде
    # Текст кодируем для URL
    safe_text = text.replace(" ", "+")
    url = f"https://placehold.co/800x600/2563eb/white.jpg?text={safe_text}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            unique_filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            print(f"  [+] {category_name} ({text}): {unique_filename}")
            return f"/static/uploads/{unique_filename}"
    except Exception as e:
        print(f"  [!] Ошибка: {e}")
    return None

def main():
    print(f"Загрузка надежных заглушек (placehold.co)...")
    results = {}
    total = 0
    
    for category, texts in CATEGORIES.items():
        print(f"\nКатегория: {category}")
        results[category] = []
        for text in texts:
            # По 2 фото на каждый текст
            for i in range(2):
                img_url = download_image(category, f"{text}+{i+1}")
                if img_url:
                    results[category].append(img_url)
                    total += 1
                time.sleep(0.1)

    manifest_path = os.path.join(BASE_DIR, "assets_manifest.py")
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(f"ASSETS = {results}\n")
    
    print(f"\nЗавершено. Загружено: {total}")

if __name__ == "__main__":
    main()
