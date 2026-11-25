import { useState, useEffect } from "react";
import {
  Sword, Shield, Zap, Flame, Trophy, Target, Plus,
  Check, BookOpen, Dumbbell, Brain, CalendarDays,
  Settings, ChevronRight, Sparkles, Trash2, RotateCcw,
  Coins, X
} from "lucide-react";
import "./App.css";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import { loadCloudSave, saveCloudGame } from "./cloudSave";

const STORAGE_KEY = "questboard-save-v1";

const initialQuests = [
  { id: 1, title: "Morning workout", category: "Fitness", xp: 100, icon: "Dumbbell", done: false },
  { id: 2, title: "Study for 30 minutes", category: "Knowledge", xp: 75, icon: "BookOpen", done: false },
  { id: 3, title: "Read 20 pages", category: "Knowledge", xp: 50, icon: "Brain", done: false },
  { id: 4, title: "Work on a personal project", category: "Creativity", xp: 150, icon: "Sparkles", done: false },
];

const iconMap = { Dumbbell, BookOpen, Brain, Sparkles, Target };

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDifference(dateA, dateB) {
  const a = new Date(`${dateA}T12:00:00`);
  const b = new Date(`${dateB}T12:00:00`);

  return Math.round((b - a) / 86400000);
}

function loadGame() {
  const today = getLocalDateKey();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);

      if (Array.isArray(data.quests) && typeof data.xp === "number") {
        const savedDate = data.lastResetDate || today;

        // New day: reset the daily quests
        if (savedDate !== today) {
          data.quests = data.quests.map((quest) => ({
            ...quest,
            done: false,
          }));
        }

        return {
          coins: 0,
          streak: 0,
          completedDays: [],
          lastActiveDate: null,
          lastResetDate: today,
          ...data,
          quests: savedDate !== today
            ? data.quests.map((quest) => ({ ...quest, done: false }))
            : data.quests,
        };
      }
    }
  } catch (error) {
    console.error("Failed to load save:", error);
  }

  return {
    xp: 1240,
    coins: 0,
    quests: initialQuests,
    streak: 0,
    completedDays: [],
    lastActiveDate: null,
    lastResetDate: today,
  };
}

// Level 1 requires 500 XP; each subsequent level requires 150 more.
function getLevelInfo(totalXP) {
  let level = 1;
  let remainingXP = Math.max(0, totalXP);
  let requirement = 500;

  while (remainingXP >= requirement) {
    remainingXP -= requirement;
    level += 1;
    requirement = 500 + (level - 1) * 150;
  }

  return {
    level,
    currentXP: remainingXP,
    requiredXP: requirement,
    progress: (remainingXP / requirement) * 100,
  };
}

function getRank(level) {
  if (level >= 50) return { name: "Mythic", icon: "👑" };
  if (level >= 30) return { name: "Legend", icon: "🐉" };
  if (level >= 20) return { name: "Elite", icon: "💎" };
  if (level >= 10) return { name: "Warrior", icon: "⚔️" };
  if (level >= 5) return { name: "Adventurer", icon: "🛡️" };
  return { name: "Novice", icon: "🌱" };
}

function Dashboard({ user, initialGame, cloudReady, onSignOut }) {  const [game, setGame] = useState(
  () => initialGame || loadGame()
);;
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [xpPopup, setXpPopup] = useState(null);

  const { quests, xp, streak, coins } = game;
  const levelInfo = getLevelInfo(xp);
  const rank = getRank(levelInfo.level);
  const completed = quests.filter((q) => q.done).length;

useEffect(() => {
  if (!cloudReady || !user?.id) return;

  const timeout = setTimeout(() => {
    saveCloudGame(user.id, game).catch((err) => {
      console.error("Cloud save failed:", err);
    });
  }, 800);

  return () => clearTimeout(timeout);
}, [game, cloudReady, user]);

  function completeQuest(id) {
  const quest = quests.find((q) => q.id === id);
  if (!quest || quest.done) return;

  
  const today = getLocalDateKey();
  const oldLevel = getLevelInfo(xp).level;
  const newTotalXP = xp + quest.xp;
  const newLevel = getLevelInfo(newTotalXP).level;
  const levelsGained = newLevel - oldLevel;
  const coinReward = 5 + levelsGained * 50;

  const updatedQuests = quests.map((q) =>
    q.id === id ? { ...q, done: true } : q
  );

  
  const allCompleted =
    updatedQuests.length > 0 && updatedQuests.every((q) => q.done);

  let newStreak = game.streak || 0;

  // Count the day when the player completes their first quest today
  if (game.lastActiveDate !== today) {
    if (game.lastActiveDate) {
      const gap = dayDifference(game.lastActiveDate, today);

      if (gap === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
  }

  const completedDays = [...(game.completedDays || [])];

  // Record a perfect quest day only once
  if (allCompleted && !completedDays.includes(today)) {
    completedDays.push(today);
  }

  setGame((prev) => ({
    ...prev,
    xp: newTotalXP,
    coins: prev.coins + coinReward,
    quests: updatedQuests,
    streak: newStreak,
    lastActiveDate: today,
    lastResetDate: today,
    completedDays,
  }));

  setXpPopup(`+${quest.xp} XP • +${coinReward} coins`);
  setTimeout(() => setXpPopup(null), 2200);

  if (levelsGained > 0) {
    setLevelUp({
      level: newLevel,
      rank: getRank(newLevel).name,
      coins: levelsGained * 50,
    });
  }
}

  function addQuest(title) {
    if (!title.trim()) return;

    setGame((prev) => ({
      ...prev,
      quests: [
        ...prev.quests,
        {
          id: Date.now(),
          title: title.trim(),
          category: "Custom",
          xp: 50,
          icon: "Target",
          done: false,
        },
      ],
    }));

    setShowAdd(false);
  }

  function deleteQuest(id) {
    setGame((prev) => ({
      ...prev,
      quests: prev.quests.filter((q) => q.id !== id),
    }));
  }

  function resetProgress() {
    if (!window.confirm("Reset all XP, coins, quests, and progress?")) return;
    setGame({ xp: 0, coins: 0, quests: [], streak: 0 });
    setLevelUp(null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Sword size={23}/></div>
          <span>QUEST<span className="purple">BOARD</span></span>
        </div>

        <div className="menu-label">MENU</div>
        <nav>
          <a className="nav-item active"><Shield size={18}/> Dashboard</a>
          <a className="nav-item"><Target size={18}/> My Quests</a>
          <a className="nav-item"><Trophy size={18}/> Achievements</a>
          <a className="nav-item"><Zap size={18}/> Skill Tree</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-card">
            <Flame color="#ff9e43" size={20}/>
            <div><strong>{streak} Day Streak</strong><small>Keep it going!</small></div>
          </div>

          <button className="nav-item settings-nav" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18}/> Settings
          </button>

          {showSettings && (
            <div className="settings-panel">
              <strong>Game Settings</strong>
              <p>Progress is saved on this device.</p>
              <button className="reset-btn" onClick={resetProgress}>
                <RotateCcw size={14}/> Reset progress
              </button>
            </div>
          )}

          <div className="profile">
            <div className="avatar">🧙</div>
            <div><strong>Adventurer</strong><small>Level {levelInfo.level} · {rank.name}</small></div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR ADVENTURE LOG</p>
            <h1>Dashboard</h1>
          </div>
          <div className="top-actions">
            <div className="date-chip"><CalendarDays size={16}/> Progress Saved</div>
            <div className="avatar top-avatar">🧙</div>
          </div>
        </header>

        <section className="welcome">
          <div className="welcome-text">
            <span className="welcome-tag"><Sparkles size={14}/> YOUR ADVENTURE CONTINUES</span>
            <h2>Ready for your next<br/><span>adventure?</span></h2>
            <p>Every quest you complete makes you stronger.<br/>Keep going, adventurer.</p>
          </div>
          <div className="hero-art">
            <div className="hero-orb">⚔️</div>
            <div className="orb-ring"/>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card level-card">
            <div className="stat-heading"><Shield size={18}/> LEVEL</div>
            <div className="stat-number">{levelInfo.level}</div>
            <div className="level-label">{rank.icon} {rank.name}</div>
            <div className="xp-row">
              <span>{levelInfo.currentXP} / {levelInfo.requiredXP} XP</span>
              <span>{Math.round(levelInfo.progress)}%</span>
            </div>
            <div className="progress">
              <div style={{ width: `${levelInfo.progress}%` }}/>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Zap size={18}/> TOTAL XP</div>
            <div className="stat-number">{xp.toLocaleString()}</div>
            <div className="stat-caption">Lifetime experience</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Flame size={18}/> STREAK</div>
            <div className="stat-number">{streak}<span className="stat-unit"> days</span></div>
            <div className="stat-caption">Personal best: 12 days</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Coins size={18}/> COINS</div>
            <div className="stat-number">{coins.toLocaleString()}</div>
            <div className="stat-caption">Spend on rewards soon!</div>
          </div>
        </section>

        <div className="content-grid">
          <section className="quest-section">
            <div className="section-header">
              <div><h3>Daily Quests</h3><p>Complete quests to earn XP and coins.</p></div>
              <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
                <Plus size={17}/> Add Quest
              </button>
            </div>

            {showAdd && <AddQuest onAdd={addQuest}/>}

            <div className="quest-list">
              {quests.map((quest) => {
                const Icon = iconMap[quest.icon] || Target;

                return (
                  <div className={`quest ${quest.done ? "completed" : ""}`} key={quest.id}>
                    <div className="quest-icon"><Icon size={20}/></div>
                    <div className="quest-info">
                      <strong>{quest.title}</strong>
                      <small>{quest.category}</small>
                    </div>
                    <div className="quest-reward"><Zap size={14}/> +{quest.xp} XP</div>
                    <button
                      className={`complete-btn ${quest.done ? "done" : ""}`}
                      disabled={quest.done}
                      onClick={() => completeQuest(quest.id)}
                    >
                      {quest.done ? <Check size={18}/> : "Complete"}
                    </button>
                    <button className="delete-quest-btn" title="Delete quest" onClick={() => deleteQuest(quest.id)}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                );
              })}

              {quests.length === 0 && (
                <div className="empty-quests">
                  <Target size={30}/>
                  <strong>No quests yet</strong>
                  <p>Add a quest to begin your adventure!</p>
                </div>
              )}
            </div>
          </section>

          <section className="right-section">
            <div className="section-header">
              <div><h3>Daily Goal</h3><p>Your progress today</p></div>
            </div>

            <div className="goal-card">
              <div className="goal-circle" style={{ "--goal": `${quests.length ? completed / quests.length * 100 : 0}%` }}>
                <div><strong>{completed}/{quests.length}</strong><small>quests</small></div>
              </div>
              <h4>{completed === quests.length ? "All quests complete!" : "Keep pushing!"}</h4>
              <p>{completed} of {quests.length} quests completed</p>
            </div>

            <div className="achievement-card">
              <div className="achievement-header"><Trophy size={18}/><strong>Rank Progress</strong></div>
              <div className="achievement-body">
                <div className="achievement-icon">{rank.icon}</div>
                <div><strong>{rank.name}</strong><small>Current adventurer rank</small></div>
              </div>
              <div className="achievement-footer">
                <span>{levelInfo.level} total levels reached</span><ChevronRight size={16}/>
              </div>
            </div>
          </section>
        </div>

        <footer>QUESTBOARD <span>•</span> LEVEL UP YOUR LIFE</footer>
      </main>

      {xpPopup && <div className="xp-toast"><Zap size={17}/>{xpPopup}</div>}

      {levelUp && (
        <div className="level-overlay">
          <div className="level-modal">
            <button className="modal-close" onClick={() => setLevelUp(null)}><X size={18}/></button>
            <div className="level-celebration">✨🎉✨</div>
            <div className="level-badge">LEVEL {levelUp.level}</div>
            <h2>LEVEL UP!</h2>
            <p>You have become stronger, adventurer!</p>
            <div className="new-rank">New rank: <strong>{levelUp.rank}</strong></div>
            <div className="level-reward"><Coins size={20}/> +{levelUp.coins} bonus coins</div>
            <button className="claim-btn" onClick={() => setLevelUp(null)}>Continue Adventure</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddQuest({ onAdd }) {
  const [title, setTitle] = useState("");

  return (
    <form className="add-quest-form" onSubmit={(e) => { e.preventDefault(); onAdd(title); setTitle(""); }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What quest do you want to add?" autoFocus/>
      <button type="submit">Create</button>
    </form>
  );
}