import os
import urllib.request
import urllib.error
import uuid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ASSETS = {
    "аватары": [],
    "нко": [],
    "проект": []
}

def download_image(url, category):
    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(UPLOAD_DIR, filename)
    try:
        # User-Agent needed for some APIs
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        local_url = f"/static/uploads/{filename}"
        ASSETS[category].append(local_url)
        print(f"Downloaded: {category} -> {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    print("Начинаем загрузку моковых изображений...")
    
    print("\n1. Загрузка аватаров пользователей...")
    for i in range(1, 16):
        download_image(f"https://api.dicebear.com/7.x/avataaars/png?seed=user{i}&size=128", "аватары")

    print("\n2. Загрузка логотипов НКО...")
    for i in range(1, 11):
        download_image(f"https://api.dicebear.com/7.x/identicon/png?seed=npo{i}&size=128", "нко")

    print("\n3. Загрузка фотографий проектов...")
    # Используем picsum.photos для случайных фото
    for i in range(1, 21):
        download_image(f"https://picsum.photos/seed/project{i}/800/600", "проект")

    manifest_path = os.path.join(BASE_DIR, "assets_manifest.py")
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write("ASSETS = " + repr(ASSETS) + "\n")

    print(f"\nГотово! Скачано изображений: {sum(len(v) for v in ASSETS.values())}")
    print(f"Манифест создан в файле: {manifest_path}")
    print("Теперь можно запустить скрипт генерации БД: python seed.py")