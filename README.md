# EarForge 🎧

Тренажер музичного слуху прямо в браузері. Без встановлення, без реєстрації — просто відкрий і тренуйся.

## Режими

| Режим | Опис |
|-------|------|
| 🎵 Note ID | Вгадай ноту за звуком |
| 🎼 Intervals | Визнач інтервал між двома нотами |
| 🥁 BPM Tap | Вгадай темп метронома |
| 🎹 Key Detect | Визнач тональність за акордовою прогресією |

Кожен режим має 3 рівні складності. Прогрес зберігається в браузері.

## Розробка

```bash
npm install
npm run dev
```

## Збірка

```bash
npm run build
```

Готові файли з'являться в папці `dist/`.

## Хостинг

Живе на `https://mandrock-tools.duckdns.org/earforge/` — статика через nginx на Hetzner VPS,
API (лідерборд) — окремий Node-процес під pm2 (`earforge-api`, порт 4173, JSON-файл
замість Vercel/Upstash), проксі `/earforge/api/` -> `127.0.0.1:4173`.

Деплой:
```bash
npm run build
cp -r dist/* /var/www/html/earforge/
# зміни в server/leaderboard.js:
cp server/leaderboard.js /root/earforge-api/ && pm2 restart earforge-api
```

Дивись `PROMPT.md` для контексту архітектури та списку відомих gaps.
