# ⚔️ Witcher Signs Trainer

A mini reflex & memory game inspired by **The Witcher**, built with [Next.js](https://nextjs.org) + React.  
Your mission is to invoke the **glyphs** correctly, keep your **energy** alive, and reach the highest streak to awaken the Guardians and face the beasts.

![Gameplay Screenshot](./public/assets/screenshots/gameplay.png)

---

## ✨ Features

- 🔮 **Elemental glyphs** with custom sounds and visuals.  
- 🧠 **Reflex mode**: press the lit glyph before it fades.  
- ⚡ **Energy system**: hits restore energy, misses drain it.  
- 📈 **Local highscores** saved automatically.  
- 🎶 **Epic background music** balanced with punchy SFX.  
- 📊 **Dynamic results screen** with narrative outcomes:  
  - Level ≤ 2 → *Energy Insufficient*  
  - Level 3 → *The Guardians Awaken*  
  - Level ≥ 4 → *Master of Signs*  

---

## 🚀 Getting Started

Clone the repo and enter the folder:

```bash
git clone https://github.com/your-username/witcher-signs-trainer.git
cd witcher-signs-trainer
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.  

---

## 🕹️ Controls

- **Click / Tap** → activate the glowing glyph.  
- **Spacebar** → surrender instantly.  
- **Pause button** → freeze the flow without losing progress.  

---

## 📸 Results

Depending on your level, you’ll get a **narrative outcome**:  

| Level | Outcome | Example |
|-------|---------|---------|
| ≤ 2   | *Energy Insufficient* – Not enough energy to help the Guardians. | ![Fail](./public/assets/screenshots/result_fail.png) |
| 3     | *The Guardians Awaken* – With your energy, we can face the beasts. | ![Hero](./public/assets/screenshots/result_hero.png) |
| ≥ 4   | *Master of Signs* – Epic master, the shadows recoil before you. | ![Master](./public/assets/screenshots/result_master.png) |

---

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org)  
- [React](https://react.dev)  
- [TypeScript](https://www.typescriptlang.org/)  
- [TailwindCSS](https://tailwindcss.com/)  
- [Material UI](https://mui.com/)  
- **HTML5 Audio API** for background music & SFX  

---

## 🌐 Deploy

Optimized for deployment on [Vercel](https://vercel.com).  
Fork this repo, connect it to your Vercel account, and get the game live in seconds.  

---

## 🤝 Contributing

Suggestions, UI/UX improvements, new glyphs or modes are welcome.  
Open an issue or PR to collaborate.  

---

## 📜 License

This project is distributed under the **MIT License**.  
Inspired by the universe of *The Witcher* (© CD PROJEKT RED).  
This is a fan-made, non-commercial educational project.
