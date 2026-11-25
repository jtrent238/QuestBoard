import { useState } from "react";
import {
  Sword, Shield, Zap, Flame, Trophy, Target, Plus,
  Check, Star, BookOpen, Dumbbell, Brain, Coins,
  CalendarDays, Settings, ChevronRight, Sparkles
} from "lucide-react";
import "./App.css";

const initialQuests = [
  { id: 1, title: "Morning workout", category: "Fitness", xp: 100, icon: Dumbbell, done: false },
  { id: 2, title: "Study for 30 minutes", category: "Knowledge", xp: 75, icon: BookOpen, done: false },
  { id: 3, title: "Read 20 pages", category: "Knowledge", xp: 50, icon: Brain, done: false },
  { id: 4, title: "Work on a personal project", category: "Creativity", xp: 150, icon: Sparkles, done: false },
];

export default function App() {
  const [quests, setQuests] = useState(initialQuests);
  const [xp, setXp] = useState(1240);
  const [showAdd, setShowAdd] = useState(false);

  const level = Math.floor(xp / 500) + 1;
  const currentXP = xp % 500;
  const progress = (currentXP / 500) * 100;
  const completed = quests.filter((q) => q.done).length;

  function completeQuest(id) {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id && !q.done) {
          setXp((old) => old + q.xp);
          return { ...q, done: true };
        }
        return q;
      })
    );
  }

  function addQuest(title) {
    if (!title.trim()) return;
    setQuests((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        category: "Custom",
        xp: 50,
        icon: Target,
        done: false,
      },
    ]);
    setShowAdd(false);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Sword size={23} /></div>
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
            <div><strong>7 Day Streak</strong><small>Keep it going!</small></div>
          </div>
          <a className="nav-item"><Settings size={18}/> Settings</a>
          <div className="profile">
            <div className="avatar">🧙</div>
            <div><strong>Adventurer</strong><small>Level {level}</small></div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">TUESDAY, NOVEMBER 25</p>
            <h1>Dashboard</h1>
          </div>
          <div className="top-actions">
            <div className="date-chip"><CalendarDays size={16}/> Daily Reset</div>
            <div className="avatar top-avatar">🧙</div>
          </div>
        </header>

        <section className="welcome">
          <div className="welcome-text">
            <span className="welcome-tag"><Sparkles size={14}/> YOUR ADVENTURE CONTINUES</span>
            <h2>Ready for your next<br/> <span>adventure?</span></h2>
            <p>Every quest you complete makes you stronger.<br/>Keep going, adventurer.</p>
          </div>
          <div className="hero-art">
            <div className="hero-orb">⚔️</div>
            <div className="orb-ring"></div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card level-card">
            <div className="stat-heading"><Shield size={18}/> LEVEL</div>
            <div className="stat-number">{level}</div>
            <div className="level-label">Adventurer</div>
            <div className="xp-row"><span>{currentXP} / 500 XP</span><span>{Math.round(progress)}%</span></div>
            <div className="progress"><div style={{width: `${progress}%`}}/></div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Zap size={18}/> TOTAL XP</div>
            <div className="stat-number">{xp.toLocaleString()}</div>
            <div className="stat-caption">Lifetime experience</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Flame size={18}/> STREAK</div>
            <div className="stat-number">7 <span className="stat-unit">days</span></div>
            <div className="stat-caption">Personal best: 12 days</div>
          </div>

          <div className="stat-card">
            <div className="stat-heading"><Trophy size={18}/> QUESTS DONE</div>
            <div className="stat-number">{completed}<span className="stat-unit">/{quests.length}</span></div>
            <div className="stat-caption">Today's quests</div>
          </div>
        </section>

        <div className="content-grid">
          <section className="quest-section">
            <div className="section-header">
              <div>
                <h3>Daily Quests</h3>
                <p>Complete quests to earn XP and level up.</p>
              </div>
              <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
                <Plus size={17}/> Add Quest
              </button>
            </div>

            {showAdd && <AddQuest onAdd={addQuest}/>}

            <div className="quest-list">
              {quests.map((quest) => {
                const Icon = quest.icon;
                return (
                  <div className={`quest ${quest.done ? "completed" : ""}`} key={quest.id}>
                    <div className="quest-icon"><Icon size={20}/></div>
                    <div className="quest-info">
                      <strong>{quest.title}</strong>
                      <small>{quest.category}</small>
                    </div>
                    <div className="quest-reward"><Zap size={14}/> +{quest.xp} XP</div>
                    <button className={`complete-btn ${quest.done ? "done" : ""}`} onClick={() => completeQuest(quest.id)}>
                      {quest.done ? <Check size={18}/> : "Complete"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="right-section">
            <div className="section-header">
              <div><h3>Daily Goal</h3><p>Your progress today</p></div>
            </div>
            <div className="goal-card">
              <div className="goal-circle" style={{"--goal": `${quests.length ? completed/quests.length*100 : 0}%`}}>
                <div><strong>{completed}/{quests.length}</strong><small>quests</small></div>
              </div>
              <h4>{completed === quests.length ? "All quests complete!" : "Keep pushing!"}</h4>
              <p>{completed} of {quests.length} quests completed</p>
            </div>

            <div className="achievement-card">
              <div className="achievement-header"><Trophy size={18}/><strong>Recent Achievement</strong></div>
              <div className="achievement-body">
                <div className="achievement-icon">🏆</div>
                <div><strong>First Steps</strong><small>Complete your first quest</small></div>
              </div>
              <div className="achievement-footer"><span>Achievement unlocked</span><ChevronRight size={16}/></div>
            </div>
          </section>
        </div>

        <footer>QUESTBOARD <span>•</span> LEVEL UP YOUR LIFE</footer>
      </main>
    </div>
  );
}

function AddQuest({ onAdd }) {
  const [title, setTitle] = useState("");

  return (
    <form className="add-quest-form" onSubmit={(e) => { e.preventDefault(); onAdd(title); }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What quest do you want to add?"
        autoFocus
      />
      <button type="submit">Create</button>
    </form>
  );
}