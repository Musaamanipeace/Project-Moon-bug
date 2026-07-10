import React, { useState, useEffect } from "react";
import { User, Tag, Briefcase, MapPin, Image, Star, Trophy, Wallet, Plus, Trash2, CheckCircle, ShieldAlert } from "lucide-react";
import { UserProfile } from "../types";

interface ProfileDashboardProps {
  nickname: string;
  onChangeNickname: (name: string) => void;
  xp: number;
  onAddXp: (amount: number) => void;
}

export default function ProfileDashboard({ nickname, onChangeNickname, xp, onAddXp }: ProfileDashboardProps) {
  const [profileId, setProfileId] = useState("");
  const [anonMode, setAnonMode] = useState(false);
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("Student");

  // Hobbies list
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState("");
  const [hobbyCategory, setHobbyCategory] = useState("Astrophysics");

  // Favorites Matrix
  const [favoritePlanets, setFavoritePlanets] = useState<string[]>([]);
  const [favoriteConstellations, setFavoriteConstellations] = useState<string[]>([]);
  const [favoriteStars, setFavoriteStars] = useState<string[]>([]);
  const [customStar, setCustomStar] = useState("");

  // Projects list
  const [projects, setProjects] = useState<string[]>(["Atmospheric sky clarity map", "Retrograde tracker sheet"]);
  const [newProject, setNewProject] = useState("");

  // Gallery tabs & uploads
  const [galleryTab, setGalleryTab] = useState<"personal" | "official">("personal");
  const [personalGallery, setPersonalGallery] = useState<string[]>([]);

  // Local backups
  useEffect(() => {
    // Generate a unique Moonbug ID for safety
    let id = localStorage.getItem("mb_profile_id");
    if (!id) {
      id = `Stargazer-${Math.floor(Math.random() * 9000 + 1000)}`;
      localStorage.setItem("mb_profile_id", id);
    }
    setProfileId(id);

    const savedAnon = localStorage.getItem("mb_anon_mode");
    if (savedAnon) setAnonMode(JSON.parse(savedAnon));

    const savedCity = localStorage.getItem("mb_city");
    if (savedCity) setCity(savedCity);

    const savedOcc = localStorage.getItem("mb_occupation");
    if (savedOcc) setOccupation(savedOcc);

    const savedHobbies = localStorage.getItem("mb_hobbies");
    if (savedHobbies) setHobbies(JSON.parse(savedHobbies));

    const savedPlanets = localStorage.getItem("mb_fav_planets");
    if (savedPlanets) setFavoritePlanets(JSON.parse(savedPlanets));

    const savedConstellations = localStorage.getItem("mb_fav_const");
    if (savedConstellations) setFavoriteConstellations(JSON.parse(savedConstellations));

    const savedStars = localStorage.getItem("mb_fav_stars");
    if (savedStars) setFavoriteStars(JSON.parse(savedStars));

    const savedCustomStar = localStorage.getItem("mb_custom_star");
    if (savedCustomStar) setCustomStar(savedCustomStar);

    const savedProjects = localStorage.getItem("mb_projects");
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedGallery = localStorage.getItem("mb_gallery");
    if (savedGallery) setPersonalGallery(JSON.parse(savedGallery));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, typeof data === "string" ? data : JSON.stringify(data));
  };

  // Add hobby with strict 3-word validation constraint
  const handleAddHobby = () => {
    const trimmed = newHobby.trim();
    if (!trimmed) return;

    // Word count constraint check
    const words = trimmed.split(/\s+/);
    if (words.length > 3) {
      alert("Hobby is strictly constrained to a maximum of 3 words for privacy sanitization.");
      return;
    }

    const formattedHobby = `[${hobbyCategory}] ${trimmed}`;
    if (hobbies.includes(formattedHobby)) return;

    const updated = [...hobbies, formattedHobby];
    setHobbies(updated);
    saveToStorage("mb_hobbies", updated);
    setNewHobby("");
    onAddXp(10);
  };

  const handleDeleteHobby = (index: number) => {
    const updated = hobbies.filter((_, i) => i !== index);
    setHobbies(updated);
    saveToStorage("mb_hobbies", updated);
  };

  // Gallery file handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = [base64, ...personalGallery];
      setPersonalGallery(updated);
      saveToStorage("mb_gallery", updated);
      onAddXp(30); // Great reward for sharing!
    };
    reader.readAsDataURL(file);
  };

  // Projects checklist
  const handleAddProject = () => {
    if (!newProject.trim()) return;
    const updated = [...projects, newProject.trim()];
    setProjects(updated);
    saveToStorage("mb_projects", updated);
    setNewProject("");
    onAddXp(15);
  };

  const handleDeleteProject = (index: number) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    saveToStorage("mb_projects", updated);
  };

  // Favorites logic
  const togglePlanet = (planet: string) => {
    const updated = favoritePlanets.includes(planet)
      ? favoritePlanets.filter(p => p !== planet)
      : [...favoritePlanets, planet];
    setFavoritePlanets(updated);
    saveToStorage("mb_fav_planets", updated);
  };

  const toggleConstellation = (constell: string) => {
    const updated = favoriteConstellations.includes(constell)
      ? favoriteConstellations.filter(c => c !== constell)
      : [...favoriteConstellations, constell];
    setFavoriteConstellations(updated);
    saveToStorage("mb_fav_const", updated);
  };

  const toggleStar = (star: string) => {
    const updated = favoriteStars.includes(star)
      ? favoriteStars.filter(s => s !== star)
      : [...favoriteStars, star];
    setFavoriteStars(updated);
    saveToStorage("mb_fav_stars", updated);
  };

  // XP level mapping (Cheese Rank)
  const getCheeseRank = (xpValue: number) => {
    if (xpValue < 100) return { title: "Moon Muncher", next: 100, progress: (xpValue / 100) * 100, trophies: ["🧀 Yellow Cheddar"] };
    if (xpValue < 300) return { title: "Crescent Nibbler", next: 300, progress: ((xpValue - 100) / 200) * 100, trophies: ["🧀 Yellow Cheddar", "🥈 Cosmic Swiss"] };
    if (xpValue < 600) return { title: "Lunar Explorer", next: 600, progress: ((xpValue - 300) / 300) * 100, trophies: ["🧀 Yellow Cheddar", "🥈 Cosmic Swiss", "🥇 Golden Gouda"] };
    return { title: "Cosmic Oracle", next: 1200, progress: Math.min(((xpValue - 600) / 600) * 100, 100), trophies: ["🧀 Yellow Cheddar", "🥈 Cosmic Swiss", "🥇 Golden Gouda", "👑 Galactic Parmesan"] };
  };

  const currentRank = getCheeseRank(xp);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 text-slate-100 max-w-6xl mx-auto">
      
      {/* Column 1: Identity & Profile Details */}
      <div className="space-y-5 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <h3 className="text-sm font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
          <User className="w-4 h-4 text-yellow-500" />
          <span>Profile Identity</span>
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Moonbug Protected ID</span>
            <input
              type="text"
              value={profileId}
              readOnly
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs font-mono text-yellow-500 select-all cursor-copy"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Cosmic Nickname</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                onChangeNickname(e.target.value);
                saveToStorage("mb_nickname", e.target.value);
              }}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500/60"
              placeholder="e.g., Starseeker-99"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/70 bg-slate-950/40">
            <div>
              <span className="text-xs font-bold font-mono text-slate-300 block">Anonymous Mode</span>
              <span className="text-[10px] font-mono text-slate-500 block">Hides public nickname</span>
            </div>
            <input
              type="checkbox"
              checked={anonMode}
              onChange={(e) => {
                setAnonMode(e.target.checked);
                saveToStorage("mb_anon_mode", e.target.checked);
              }}
              className="w-4 h-4 rounded border-slate-800 text-yellow-500 focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">City / Hometown</span>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                saveToStorage("mb_city", e.target.value);
              }}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500/60"
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Broad Occupation</span>
            <select
              value={occupation}
              onChange={(e) => {
                setOccupation(e.target.value);
                saveToStorage("mb_occupation", e.target.value);
              }}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-100 focus:outline-none"
            >
              <option value="Student">📁 Student</option>
              <option value="Paid Employed">💼 Employed (Paid)</option>
              <option value="Voluntary Service">🧘 Voluntary Service</option>
              <option value="Housewife/Homemaker">🏡 Housewife / Homemaker</option>
              <option value="Retired">👴 Retired</option>
              <option value="Other">🌐 Other</option>
            </select>
          </div>
        </div>

        {/* Interests & sanitized tag systems */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase">
            🎯 Interests & Hobbies
          </h4>

          <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-xl bg-slate-950/40 border border-slate-800/50">
            {hobbies.length === 0 ? (
              <span className="text-[10px] text-slate-500 font-mono italic">No interests added. Max 3 words per label.</span>
            ) : (
              hobbies.map((h, index) => (
                <div key={index} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-[10px] text-yellow-300 font-mono">
                  <span>{h}</span>
                  <button onClick={() => handleDeleteHobby(index)} className="hover:text-red-400 text-slate-500 font-bold focus:outline-none">
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={hobbyCategory}
              onChange={(e) => setHobbyCategory(e.target.value)}
              className="col-span-1 p-2 rounded-xl border border-slate-800 bg-[#0c0d16] text-[10px] text-slate-200"
            >
              <option value="Astrophys">Physics</option>
              <option value="Stargaze">Sky</option>
              <option value="Nature">Nature</option>
              <option value="Culture">Art</option>
              <option value="Reading">Book</option>
            </select>

            <input
              type="text"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              placeholder="Hobby (max 3 words)"
              className="col-span-2 p-2 rounded-xl border border-slate-800 bg-[#0c0d16] text-[10px] text-slate-100 placeholder-slate-500"
            />
          </div>

          <button
            onClick={handleAddHobby}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Tagged Hobby</span>
          </button>
        </div>
      </div>

      {/* Column 2: Gallery & Active Projects */}
      <div className="space-y-5 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        
        {/* Moon Gallery tab */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
            <Image className="w-4 h-4 text-yellow-500" />
            <span>Moon Gallery</span>
          </h3>

          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setGalleryTab("personal")}
              className={`flex-1 pb-2 text-xs font-mono font-bold ${
                galleryTab === "personal" ? "text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Personal Art
            </button>
            <button
              onClick={() => setGalleryTab("official")}
              className={`flex-1 pb-2 text-xs font-mono font-bold ${
                galleryTab === "official" ? "text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Official Moon
            </button>
          </div>

          {galleryTab === "personal" ? (
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-700/80 hover:border-yellow-500/60 bg-slate-950/50 p-3 rounded-xl cursor-pointer transition-colors">
                <Plus className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-mono text-slate-300">Upload Astrophotography</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {personalGallery.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-mono text-center py-6">
                  No uploaded art. Local uploads are stored locally inside the browser.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                  {personalGallery.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 group">
                      <img src={img} alt="Astral upload" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const updated = personalGallery.filter((_, idx) => idx !== i);
                          setPersonalGallery(updated);
                          saveToStorage("mb_gallery", updated);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { title: "Total Eclipse", icon: "🌌" },
                { title: "Waning Moon", icon: "🌒" },
                { title: "Buck Moon", icon: "🌕" },
              ].map((m, idx) => (
                <div key={idx} className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-800/80 bg-slate-950/60">
                  <span className="text-xl mb-1">{m.icon}</span>
                  <span className="text-[9px] font-mono text-slate-400 text-center px-1">{m.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <h3 className="text-sm font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-500" />
            <span>Active Sky Projects</span>
          </h3>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {projects.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950/40">
                <span className="text-[11px] text-slate-300 font-mono">
                  🚀 {p}
                </span>
                <button
                  onClick={() => handleDeleteProject(idx)}
                  className="text-slate-500 hover:text-red-400 focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="New active project name..."
              className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-[10px] text-slate-100 placeholder-slate-500 flex-1"
            />
            <button
              onClick={handleAddProject}
              className="p-2 rounded-xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Column 3: Cheese Rank, Support, Premium Coming Soon, Wallet Mockups */}
      <div className="space-y-5 bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        
        {/* Cheese Rank level meter */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Cheese Rank XP</span>
          </h3>

          <div className="p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold font-mono text-yellow-300 uppercase">{currentRank.title}</span>
              <span className="font-mono text-slate-400 font-bold">{xp} / {currentRank.next} XP</span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentRank.progress}%` }}
              />
            </div>

            <div className="mt-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Trophies Unlocked:</span>
              <div className="flex flex-wrap gap-1">
                {currentRank.trophies.map((t, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bitcoin Wallet Panels mockup */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <h3 className="text-sm font-bold font-mono text-yellow-400 tracking-wider uppercase flex items-center gap-2">
            <Wallet className="w-4 h-4 text-yellow-500" />
            <span>Support & BTC Wallet</span>
          </h3>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Interactive Ledger Mockup</span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-yellow-400 animate-pulse">
                Testnet
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-slate-500 block">SUPPORT ADDR:</span>
              <code className="text-[10px] font-mono text-yellow-400 break-all bg-slate-900 p-1 rounded border border-slate-800 block">
                bc1qxy2kgdygjrsqtzq2n0yrf2493p80kk9h5r0x5z
              </code>
            </div>

            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
              <span className="text-[10px] font-mono text-slate-300">Balance:</span>
              <span className="text-xs font-mono font-bold text-yellow-500">0.00000000 BTC</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button disabled className="py-1 rounded bg-yellow-500/25 border border-yellow-500/30 text-[10px] font-mono text-yellow-400/80 cursor-not-allowed">
                Deposit (Mock)
              </button>
              <button disabled className="py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 cursor-not-allowed">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Customization & Premium tab */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase">
              🚀 Customization & Premium
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[8px] font-bold uppercase animate-pulse">
              Coming Soon
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono leading-relaxed mt-1.5">
            Unlock premium features like rich video space feeds, multi-modal voice AI, custom cosmic skins, and monetizable astronomic content inside the marketplace.
          </p>
        </div>

      </div>

    </div>
  );
}
