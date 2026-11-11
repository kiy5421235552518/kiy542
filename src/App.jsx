// ... existing code ...
import React, { useState, useEffect } from 'react';
import { ChevronRight, Key, Coins, Map, Users, Settings, Download, Search, Image as ImageIcon, Star, Trophy, MessageSquare, LogOut, Lock, Upload, Volume2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';

// === Firebase 雲端資料庫初始化 ===
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {apiKey: "AIzaSyA_hNmHfAwcRxiQ3xfCp9JnH4DOAHXlilg",

authDomain: "wunan-game.firebaseapp.com",

projectId: "wunan-game",

storageBucket: "wunan-game.firebasestorage.app",

messagingSenderId: "560159179476",

appId: "1:560159179476:web:05965090da4182ce523141",

measurementId: "G-99DPM829RP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// === 關卡資料設定 (Level Data) ===
const LEVEL_DATA = [
  {
    id: 'l1',
    title: "第一關：方位之謎",
    backgroundUrl: "",
    storyText: "🐬 海豚弟弟背著小書包：『歡迎來到梧南國小！第一關，我們要找出藏寶圖的關鍵字。早上太陽升起的方向，有一個閃閃發光的____箱！』",
    puzzle: { type: "text_lock", acceptedAnswers: ["寶", "寶箱"], placeholder: "請輸入一個字" },
    hints: [
      { level: 1, cost: 0, text: "提示一：注意看早晨太陽升起的方向。" },
      { level: 2, cost: 10, text: "提示二：海盜最喜歡把金銀財寶放在什麼箱子裡？" }
    ],
    successMsg: "太棒了！成功解開第一個謎題！"
  },
  {
    id: 'l2',
    title: "第二關：拼寫高手",
    backgroundUrl: "",
    storyText: "🎀 海豚妹妹背著粉紅書包：『接下來考考你的英文！梧南國小是一所學校，學校的英文怎麼拼呢？』",
    puzzle: { type: "text_lock", acceptedAnswers: ["school", "School", "SCHOOL"], placeholder: "請輸入英文單字" },
    hints: [
      { level: 1, cost: 0, text: "提示一：字首是 s。" },
      { level: 2, cost: 10, text: "提示二：s-c-h-o-o-l。" }
    ],
    successMsg: "Excellent! 英文也難不倒你！"
  },
  {
    id: 'l3',
    title: "第三關：幾何小勇士",
    backgroundUrl: "",
    storyText: "🐬 海豚弟弟指著地圖：『這裡有好多形狀！請找出隱藏在圖形中的【三角形】，並且點擊它！』",
    puzzle: { 
      type: "hotspot", 
      acceptedAnswers: [], 
      placeholder: "請點擊圖片上的特定區域" 
    },
    hints: [
      { level: 1, cost: 0, text: "提示一：尋找有三個邊、三個角的圖形。" },
      { level: 2, cost: 10, text: "提示二：就在畫面的右下角喔！" }
    ],
    successMsg: "太敏銳了！你找到了三角形！"
  },
  {
    id: 'l4',
    title: "第四關：數學天才",
    backgroundUrl: "",
    storyText: "🎀 海豚妹妹拿著算盤：『尋寶需要盤纏！50 枚金幣加上 30 枚金幣，總共是多少枚金幣？』",
    puzzle: { type: "text_lock", acceptedAnswers: ["80", "八十"], placeholder: "請輸入數字" },
    hints: [
      { level: 1, cost: 0, text: "提示一：5 + 3 = 8。" },
      { level: 2, cost: 10, text: "提示二：答案是 80 喔。" }
    ],
    successMsg: "算得真快！數學天才就是你！"
  },
  {
    id: 'l5',
    title: "第五關：安全小尖兵",
    backgroundUrl: "",
    storyText: "🐬 海豚弟弟指著馬路：『探險也要注意安全！過馬路的時候，看到什麼顏色的燈號才可以走？』",
    puzzle: { type: "text_lock", acceptedAnswers: ["綠", "綠燈", "綠色"], placeholder: "請輸入顏色" },
    hints: [
      { level: 1, cost: 0, text: "提示一：紅燈停，__燈行。" },
      { level: 2, cost: 10, text: "提示二：是綠色喔！" }
    ],
    successMsg: "完全正確！過馬路一定要注意安全！"
  },
  {
    id: 'l6',
    title: "第六關：清潔達人",
    backgroundUrl: "",
    storyText: "🎀 海豚妹妹拿著掃把：『尋寶的最後一關！喝完的寶特瓶不能直接當垃圾丟掉，要進行什麼工作？』",
    puzzle: { type: "text_lock", acceptedAnswers: ["資源回收", "回收"], placeholder: "請輸入四個字" },
    hints: [],
    successMsg: "太棒了！維持校園整潔是探險家必備的美德！"
  }
];

// === 通關結算畫面設定檔 (Ending Screen Config) ===
// 老師可以在這裡自由修改稱號、盲盒獎品與給特定學生的評語
const ENDING_CONFIG = {
  // Module A: 分數分級稱號 (依據最終金幣數量)
  tiers: [
    { minScore: 90, title: "🏆 傳奇海豚小天才", color: "text-yellow-400" },
    { minScore: 70, title: "🌟 機智探險家", color: "text-blue-300" },
    { minScore: 0, title: "🎒 勇敢小水手", color: "text-gray-300" }
  ],
  // Module B: 隨機盲盒獎勵
  blindBoxes: [
    { name: "粉紅海豚妹妹的幸運珍珠", icon: "🔮", desc: "傳說中能帶來好運的璀璨珍珠！" },
    { name: "海豚弟弟的黃金羅盤", icon: "🧭", desc: "永遠不會迷失方向的神奇道具！" },
    { name: "校長的神秘寶藏圖", icon: "🗺️", desc: "裡面似乎藏著下學期的神秘福利？" },
    { name: "梧南深海藍寶石", icon: "💎", desc: "閃耀著無窮知識光芒的珍貴寶石！" }
  ],
  // Module C: 座號/姓名專屬評語 (可無限擴增，對不到名字會顯示 default)
  studentFeedback: {
    "01 沛均": "沛均在幾何小勇士那一關表現得很棒喔！觀察力非常敏銳！",
    "01 林瑞俊": "瑞俊的數學天才關卡算得非常快，完全難不倒你，繼續保持！",
    "04 江心恬": "心恬很有禮貌，過馬路的安全知識也完全正確呢，真是安全小尖兵！",
    "default": "恭喜你完成所有的尋寶挑戰，你真是一個聰明、勇敢又充滿智慧的孩子！"
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('none'); // 'none', 'student', 'teacher'
  
  // === 教師登入鎖狀態 ===
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [teacherPwd, setTeacherPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const TEACHER_PIN = "8888"; // 預設教師解鎖密碼

  // -- 學生狀態 --
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [gameStatus, setGameStatus] = useState('lobby'); // 'lobby', 'playing', 'ended'
  
  // -- 遊戲中狀態 --
  const [inputValue, setInputValue] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [hintIndex, setHintIndex] = useState(-1);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // 自訂確認視窗

  // -- 老師後台狀態 --
  const [teacherTab, setTeacherTab] = useState('dashboard');
  const [realStudents, setRealStudents] = useState([]);
  const [editingLevels, setEditingLevels] = useState(LEVEL_DATA);
  const [publishUrl, setPublishUrl] = useState("https://你的網址.vercel.app"); // 新增自訂網址狀態
  
  // -- 結算畫面專用狀態 --
  const [myBlindBox, setMyBlindBox] = useState(null);

  // === Firebase 認證與狀態防呆回復機制 ===
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && role === 'none') {
         // 嘗試從雲端回復學生狀態 (防止小孩不小心重整網頁而進度歸零)
         const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', u.uid);
         const snap = await getDoc(docRef);
         if (snap.exists()) {
            const data = snap.data();
            if (data.status !== 'lobby') {
               setPlayerName(data.name || '');
               setScore(data.score ?? 100);
               setCurrentLevelIndex(data.progress || 0);
               setGameStatus(data.status);
               if (data.status === 'ended') {
                  setMyBlindBox(generateBlindBox(data.name, data.score));
               }
               setRole('student');
            }
         }
      }
    });
    return () => unsubscribe();
  }, [role]);

  // === 教師端：即時監聽全班闖關進度 ===
  useEffect(() => {
    if (!user || role !== 'teacher') return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const unsub = onSnapshot(colRef, (snap) => {
      const students = [];
      snap.forEach(d => students.push({ id: d.id, ...d.data() }));
      // 在記憶體中依照更新時間排序
      students.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setRealStudents(students);
    }, (err) => console.error(err));
    return () => unsub();
  }, [user, role]);

  // === 工具函數 ===
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // 文字轉語音 (TTS)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 生成盲盒 (用名字長度+分數作為穩定種子)
  const generateBlindBox = (name, finalScore) => {
    const seed = name.length + finalScore;
    const index = seed % ENDING_CONFIG.blindBoxes.length;
    return ENDING_CONFIG.blindBoxes[index];
  };

  // 取得稱號
  const getTitle = (finalScore) => {
    for (let tier of ENDING_CONFIG.tiers) {
      if (finalScore >= tier.minScore) return tier;
    }
    return ENDING_CONFIG.tiers[ENDING_CONFIG.tiers.length - 1];
  };

  // 取得專屬評語
  const getFeedback = (name) => {
    return ENDING_CONFIG.studentFeedback[name] || ENDING_CONFIG.studentFeedback["default"];
  };

  // 圖片壓縮函數 (Canvas)
  const handleImageUpload = (e, levelId, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 壓縮品質 0.8

        setEditingLevels(prev => prev.map(l => 
          l.id === levelId ? { ...l, [field]: dataUrl } : l
        ));
        showToast('圖片上傳並壓縮成功！');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 匯出 CSV 功能
  const exportCSV = () => {
    const headers = "座號姓名,完成關卡數,剩餘金幣,狀態\n";
    const rows = realStudents.map(s => `${s.name},${s.progress},${s.score},${s.status === 'ended' ? '已完成' : '闖關中'}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "梧南尋寶探險隊_成績匯出.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === 學生流程 ===
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (roomCode === '123456' && playerName.trim()) {
      setGameStatus('playing');
      
      // 將新生註冊至雲端資料庫
      if (user) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
        await setDoc(docRef, {
          name: playerName,
          progress: 0,
          score: 100,
          status: 'playing',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      showToast(`探險家 ${playerName} 已登入並同步至雲端`);
    } else {
      showToast("房間代碼錯誤，請輸入 123456");
    }
  };

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    if (teacherPwd === TEACHER_PIN) {
      setRole('teacher');
      setShowTeacherLogin(false);
      setTeacherPwd('');
      setPwdError('');
    } else {
      setPwdError("密碼錯誤，請重新輸入！");
    }
  };

  const currentLevel = LEVEL_DATA[currentLevelIndex];

  const handleAnswerSubmit = async (e) => {
    if (e) e.preventDefault();
    const isCorrect = currentLevel.puzzle.acceptedAnswers.some(
      ans => ans.toLowerCase() === inputValue.trim().toLowerCase()
    );

    if (isCorrect) {
      setFeedbackMsg(currentLevel.successMsg);
      showToast(`第 ${currentLevelIndex + 1} 關已破解，進度同步至雲端`);
      
      const nextIndex = currentLevelIndex + 1;
      const isEnded = nextIndex >= LEVEL_DATA.length;
      
      // 更新雲端進度
      if (user) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
        await setDoc(docRef, {
          progress: isEnded ? currentLevelIndex : nextIndex,
          status: isEnded ? 'ended' : 'playing',
          score: score,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      setTimeout(() => {
        if (!isEnded) {
          setCurrentLevelIndex(nextIndex);
          setInputValue('');
          setFeedbackMsg('');
          setHintIndex(-1);
        } else {
          // 破關
          setGameStatus('ended');
          setMyBlindBox(generateBlindBox(playerName, score));
          showToast(`恭喜通關！成績已上傳！`);
        }
      }, 1500);
    } else {
      setFeedbackMsg("密碼錯誤，請再試一次！");
      setInputValue('');
      setTimeout(() => setFeedbackMsg(''), 2000);
    }
  };

  const handleHotspotClick = async () => {
    setFeedbackMsg(currentLevel.successMsg);
    showToast(`發現隱藏物品，進度同步至雲端`);
    
    const nextIndex = currentLevelIndex + 1;
    const isEnded = nextIndex >= LEVEL_DATA.length;
    
    // 更新雲端進度
    if (user) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
      await setDoc(docRef, {
        progress: isEnded ? currentLevelIndex : nextIndex,
        status: isEnded ? 'ended' : 'playing',
        score: score,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    setTimeout(() => {
      if (!isEnded) {
        setCurrentLevelIndex(nextIndex);
        setInputValue('');
        setFeedbackMsg('');
        setHintIndex(-1);
      } else {
        setGameStatus('ended');
        setMyBlindBox(generateBlindBox(playerName, score));
        showToast(`恭喜通關！成績已上傳！`);
      }
    }, 1500);
  };

  const requestHint = () => {
    if (hintIndex < currentLevel.hints.length - 1) {
      const nextHint = currentLevel.hints[hintIndex + 1];
      if (nextHint.cost > 0) {
        // 使用自訂 UI 視窗取代 window.confirm
        setConfirmDialog({
          message: `開啟此提示將扣除 ${nextHint.cost} 枚金幣，確定嗎？`,
          onConfirm: async () => {
            const newScore = Math.max(0, score - nextHint.cost);
            setScore(newScore);
            
            // 雲端同步扣除金幣
            if (user) {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', user.uid);
              await setDoc(docRef, {
                score: newScore,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }

            showToast(`已扣除 ${nextHint.cost} 枚金幣並同步至雲端`);
            setHintIndex(prev => prev + 1);
          }
        });
      } else {
        setHintIndex(prev => prev + 1);
      }
    }
  };

  // === 畫面渲染 ===

  if (role === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#f4e4bc] p-8 rounded-2xl shadow-2xl border-4 border-yellow-700 relative text-center">
          <div className="absolute top-4 left-4 text-4xl">🐬</div>
          <div className="absolute top-4 right-4 text-4xl">🎀</div>
          <h1 className="text-3xl font-bold text-yellow-900 mb-2 mt-4">梧南闖關平台</h1>
          <p className="text-yellow-800 mb-8 font-medium">請選擇您的身分</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setRole('student')}
              className="py-4 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-yellow-900 font-bold text-xl rounded-xl border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Users size={28} />
              我是學生 / 探險家
            </button>
            <button 
              onClick={() => setShowTeacherLogin(true)}
              className="py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={28} />
              我是老師
            </button>
          </div>
        </div>

        {/* 老師登入鎖 Modal */}
        {showTeacherLogin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
             <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
                <Lock className="mx-auto text-gray-800 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800 mb-4">請輸入教師密碼</h2>
                <form onSubmit={handleTeacherLogin}>
                  <input 
                    type="password"
                    value={teacherPwd}
                    onChange={(e) => setTeacherPwd(e.target.value)}
                    placeholder="輸入密碼 (預設: 8888)"
                    className="w-full p-3 text-center border-2 border-gray-300 rounded-lg mb-2 text-xl"
                    autoFocus
                  />
                  {pwdError && <p className="text-red-500 text-sm mb-4 font-bold">{pwdError}</p>}
                  <div className="flex gap-2 mt-4">
                    <button type="button" onClick={() => {setShowTeacherLogin(false); setPwdError('');}} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold">取消</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">解鎖</button>
                  </div>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  }

  // ==== 老師後台介面 ====
  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
        {/* 左側選單 */}
        <div className="w-full md:w-64 bg-indigo-900 text-white flex flex-col">
          <div className="p-6 text-center border-b border-indigo-800">
            <h2 className="text-xl font-bold mb-1">梧南闖關平台</h2>
            <p className="text-indigo-300 text-sm">教師管理中心</p>
          </div>
          <nav className="flex-1 py-4">
            <button onClick={() => setTeacherTab('dashboard')} className={`w-full flex items-center gap-3 px-6 py-3 hover:bg-indigo-800 transition-colors ${teacherTab==='dashboard' ? 'bg-indigo-800 border-l-4 border-blue-400' : ''}`}>
              <Map size={20} /> 發布與監控
            </button>
            <button onClick={() => setTeacherTab('edit')} className={`w-full flex items-center gap-3 px-6 py-3 hover:bg-indigo-800 transition-colors ${teacherTab==='edit' ? 'bg-indigo-800 border-l-4 border-blue-400' : ''}`}>
              <Settings size={20} /> 編輯關卡庫
            </button>
          </nav>
          <div className="p-4 border-t border-indigo-800">
            <button onClick={() => setRole('none')} className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-800 hover:bg-indigo-700 rounded-lg text-sm transition-colors">
              <LogOut size={16} /> 登出後台
            </button>
          </div>
        </div>

        {/* 右側內容區 */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {teacherTab === 'dashboard' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">課堂監控大廳</h1>
                  <p className="text-gray-500 mt-1">即時查看學生闖關進度</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow font-bold transition-colors">
                  <Download size={18} />
                  匯出成績 (CSV)
                </button>
              </div>

              {/* 房間資訊卡片 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div>
                   <h3 className="text-lg font-bold text-gray-700 mb-2">目前開放的房間</h3>
                   <p className="text-sm text-gray-500 mb-1">主題：梧南校園尋寶探險</p>
                   <p className="text-sm text-gray-500">總關卡數：6 關</p>
                 </div>
                 <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="text-center">
                       <p className="text-sm text-gray-500 font-bold mb-1">請學生輸入此代碼加入</p>
                       <div className="text-5xl font-black text-indigo-600 tracking-widest bg-indigo-50 px-6 py-3 rounded-xl border-2 border-indigo-100">
                         123456
                       </div>
                    </div>
                    {/* 新增：動態 QR Code 顯示區 (加入可編輯網址功能) */}
                    <div className="flex flex-col items-center justify-center md:pl-6 md:border-l border-gray-200 mt-4 md:mt-0">
                       <p className="text-sm text-gray-500 font-bold mb-2">或掃描 QR Code 進入</p>
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publishUrl)}`} 
                         alt="房間 QR Code" 
                         className="w-24 h-24 border border-gray-300 rounded p-1 mb-2"
                       />
                       <input 
                         type="text" 
                         value={publishUrl}
                         onChange={(e) => setPublishUrl(e.target.value)}
                         placeholder="請輸入正式部署網址"
                         className="text-xs border border-gray-300 text-gray-500 rounded px-2 py-1 w-full max-w-[150px] text-center focus:border-indigo-500 focus:outline-none"
                         title="在此輸入你正式上線後的網址，QR Code 會自動更新"
                       />
                    </div>
                 </div>
              </div>

              {/* 學生進度列表 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                    <span>學生進度牆 (即時更新)</span>
                    <span className="text-indigo-600 text-sm">連線人數：{realStudents.length} 人</span>
                 </div>
                 <div className="divide-y divide-gray-100">
                    {realStudents.length === 0 && (
                       <div className="p-8 text-center text-gray-400 font-bold">目前還沒有學生連線喔！快請學生輸入房間碼加入吧。</div>
                    )}
                    {realStudents.map(student => (
                      <div key={student.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                               {student.name ? student.name.split(' ')[0] : '?'}
                            </div>
                            <div>
                               <p className="font-bold text-gray-800">{student.name ? (student.name.includes(' ') ? student.name.split(' ')[1] : student.name) : '未知名稱'}</p>
                               <p className="text-xs text-gray-500">💰 {student.score} 枚金幣</p>
                            </div>
                         </div>
                         
                         <div className="flex-1 max-w-xs mx-4">
                           <div className="w-full bg-gray-200 rounded-full h-2.5">
                             <div className={`h-2.5 rounded-full ${student.status === 'ended' ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${(student.progress / 6) * 100}%` }}></div>
                           </div>
                           <p className="text-xs text-center text-gray-500 mt-1">
                             {student.status === 'ended' ? '通關完成' : `第 ${student.progress} 關`}
                           </p>
                         </div>

                         <div>
                           {student.status === 'ended' ? (
                             <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">🏆 已破關</span>
                           ) : (
                             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">🎮 解謎中</span>
                           )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
               <div>
                  <h1 className="text-2xl font-bold text-gray-800">編輯關卡庫</h1>
                  <p className="text-gray-500 mt-1">修改題目內容或替換背景圖片</p>
                </div>
                
                <div className="space-y-4">
                  {editingLevels.map((lvl, idx) => (
                    <div key={lvl.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <input type="text" defaultValue={lvl.title} className="w-full font-bold text-lg border-b border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-1" />
                          <textarea defaultValue={lvl.storyText} className="w-full text-sm text-gray-600 border border-gray-300 rounded p-2 focus:border-indigo-500 focus:outline-none" rows="2" />
                          
                          <div className="flex gap-4">
                             <div className="flex-1">
                               <label className="text-xs text-gray-500 font-bold block mb-1">過關答案 (用逗號分隔多個答案)</label>
                               {lvl.puzzle.type === 'hotspot' ? (
                                  <div className="text-sm text-blue-600 font-bold py-2 bg-blue-50 px-3 rounded border border-blue-200">此關為「熱區點擊」不需輸入文字密碼。</div>
                               ) : (
                                  <input type="text" defaultValue={lvl.puzzle.acceptedAnswers.join(', ')} className="w-full text-sm border border-gray-300 rounded px-2 py-1" />
                               )}
                             </div>
                             <div className="flex-1">
                               <label className="text-xs text-gray-500 font-bold block mb-1">關卡背景圖片</label>
                               <div className="flex items-center gap-2">
                                 <input type="text" value={lvl.backgroundUrl} placeholder="圖片網址或上傳" className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 bg-gray-50" readOnly />
                                 <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1 transition-colors">
                                   <Upload size={14} />
                                   上傳
                                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, lvl.id, 'backgroundUrl')} />
                                 </label>
                               </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==== 學生遊玩介面 ====
  return (
    <div className="min-h-screen bg-slate-900 font-sans relative">
      
      {/* 頂部 Toast 提示框 */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <Search size={18} className="text-yellow-400" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 自訂確認視窗 (取代原本瀏覽器的 alert / confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl text-center max-w-sm w-full shadow-2xl border-4 border-yellow-500">
              <p className="text-xl font-bold mb-6 text-gray-800">{confirmDialog.message}</p>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 bg-gray-200 rounded-lg font-bold text-gray-800 hover:bg-gray-300">取消</button>
                 <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 py-3 bg-yellow-500 rounded-lg font-bold text-yellow-900 hover:bg-yellow-400">確定扣除</button>
              </div>
           </div>
        </div>
      )}

      {gameStatus === 'lobby' ? (
        // 大廳畫面
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-900 to-stone-900 relative overflow-hidden">
          {/* 背景裝飾 */}
          <div className="absolute top-10 left-10 text-white/10 opacity-50"><Map size={120} /></div>
          <div className="absolute bottom-10 right-10 text-white/10 opacity-50"><Key size={120} /></div>

          <div className="max-w-md w-full bg-[#f4e4bc] p-8 rounded-xl shadow-2xl border-[6px] border-yellow-800 relative z-10">
            {/* 釘子裝飾 */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-gray-800 rounded-full"></div>

            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🐬</div>
              <h1 className="text-3xl font-black text-yellow-900 tracking-wide">梧南尋寶探險隊</h1>
              <p className="text-yellow-700 font-bold mt-2">海豚船長正在呼喚你！</p>
            </div>

            <form onSubmit={handleStudentLogin} className="space-y-6">
              <div>
                <label className="block text-yellow-900 font-bold mb-2 text-lg">🗺️ 探險房間代碼</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="請輸入 6 位數密碼"
                  className="w-full px-4 py-4 rounded-lg bg-amber-50 border-2 border-yellow-700 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 text-2xl text-center font-bold text-yellow-900 placeholder-yellow-700/40"
                  maxLength={6}
                  required
                />
              </div>
              
              <div>
                <label className="block text-yellow-900 font-bold mb-2 text-lg">🏷️ 探險家代號 (座號 姓名)</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="例如：01 沛均"
                  className="w-full px-4 py-4 rounded-lg bg-amber-50 border-2 border-yellow-700 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 text-xl font-bold text-yellow-900 placeholder-yellow-700/40"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 mt-4 bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 font-black text-2xl rounded-lg border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                出發尋寶去！ <ChevronRight size={28} />
              </button>
            </form>
          </div>
          <button onClick={() => setRole('none')} className="absolute bottom-4 left-4 text-white/50 hover:text-white text-sm">返回首頁</button>
        </div>
      ) : gameStatus === 'playing' ? (
        // 遊玩畫面
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stone-900 text-stone-800 relative">
          
          {/* 狀態列 */}
          <div className="max-w-2xl w-full flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2 bg-stone-800/80 px-4 py-2 rounded-full border border-stone-600 shadow-md">
              <span className="text-yellow-500 font-bold">探險家：{playerName}</span>
            </div>
            <div className="flex items-center gap-2 bg-stone-800/80 px-4 py-2 rounded-full border border-stone-600 shadow-md">
              <Coins className="text-yellow-400" size={20} />
              <span className="font-black text-yellow-400 text-lg">{score}</span>
            </div>
          </div>

          <div className="max-w-2xl w-full bg-[#f4e4bc] rounded-xl shadow-2xl overflow-hidden border-[6px] border-yellow-800 relative">
            
            {/* 標題與進度 */}
            <div className="bg-yellow-900 text-yellow-100 px-4 py-3 flex justify-between items-center border-b-4 border-yellow-950">
              <h2 className="font-black text-xl tracking-wider">{currentLevel.title}</h2>
              <span className="bg-yellow-950 px-3 py-1 rounded-full text-sm font-bold border border-yellow-700">
                關卡 {currentLevelIndex + 1} / {LEVEL_DATA.length}
              </span>
            </div>

            {/* 圖片區 / 熱區點擊 */}
            <div className="relative h-64 bg-stone-800 flex items-center justify-center border-b-[6px] border-yellow-800 overflow-hidden">
              {currentLevel.backgroundUrl ? (
                <img src={currentLevel.backgroundUrl} alt="關卡圖片" className="w-full h-full object-cover" />
              ) : (
                <div className="text-stone-500 flex flex-col items-center">
                  <ImageIcon size={48} className="mb-2 opacity-50" />
                  <span>[關卡場景圖]</span>
                </div>
              )}
              
              {/* 如果是熱區點擊，渲染一個隱形的按鈕覆蓋在特定區域 (此為示意，全畫面點擊都算過關以利測試) */}
              {currentLevel.puzzle.type === 'hotspot' && (
                 <div 
                    onClick={handleHotspotClick}
                    className="absolute bottom-10 right-10 w-24 h-24 border-4 border-yellow-400 border-dashed rounded-full animate-pulse cursor-pointer hover:bg-yellow-400/20 flex items-center justify-center"
                 >
                    <span className="text-yellow-400 font-bold bg-black/50 px-2 py-1 rounded">點我！</span>
                 </div>
              )}
            </div>

            {/* 內容區 */}
            <div className="p-6 relative">
              <button 
                onClick={() => speakText(currentLevel.storyText)}
                className="absolute top-4 right-4 p-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-full shadow transition-colors"
                title="語音朗讀題目"
              >
                <Volume2 size={24} />
              </button>
              
              <p className="text-xl mb-6 font-bold leading-relaxed text-yellow-950 pr-10">
                {currentLevel.storyText}
              </p>

              {currentLevel.puzzle.type === 'text_lock' && (
                <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentLevel.puzzle.placeholder}
                      className="flex-1 px-4 py-4 rounded-lg bg-amber-50 border-2 border-yellow-700 focus:outline-none focus:border-yellow-600 focus:ring-4 focus:ring-yellow-600/20 text-2xl text-center font-bold text-yellow-950"
                    />
                    <button 
                      type="submit"
                      className="px-6 py-4 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-black text-xl rounded-lg border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all shadow-md whitespace-nowrap"
                    >
                      解鎖
                    </button>
                  </div>
                </form>
              )}

              {/* 錯誤回饋 */}
              {feedbackMsg && (
                <div className={`mt-4 p-3 rounded-lg text-center font-bold text-lg animate-bounce ${feedbackMsg.includes('錯誤') ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-green-100 text-green-700 border-2 border-green-300'}`}>
                  {feedbackMsg}
                </div>
              )}

              {/* 提示系統 */}
              <div className="mt-6 border-t-2 border-yellow-800/20 pt-4 flex flex-col items-center">
                <button
                  type="button"
                  onClick={requestHint}
                  disabled={hintIndex >= currentLevel.hints.length - 1}
                  className="flex items-center gap-2 px-6 py-3 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 font-bold rounded-full transition-colors disabled:opacity-50 border-2 border-yellow-400 shadow-sm"
                >
                  <Search size={18} />
                  {hintIndex >= currentLevel.hints.length - 1 ? "已無更多提示" : "向海豚索取提示 (需扣金幣)"}
                </button>
                
                {hintIndex >= 0 && (
                  <div className="mt-4 w-full space-y-2">
                    {currentLevel.hints.slice(0, hintIndex + 1).map((hint, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-900 font-bold flex gap-2">
                        <span className="text-yellow-500">💡</span> {hint.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ==== 通關結算畫面 (Ending Screen) ====
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#f4e4bc] p-8 rounded-xl shadow-2xl border-[6px] border-yellow-800 text-center relative overflow-hidden">
            {/* 彩帶裝飾 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-start">
               <div className="w-1 h-20 bg-red-500 absolute left-10 animate-bounce delay-100"></div>
               <div className="w-1 h-16 bg-blue-500 absolute left-20 animate-bounce delay-300"></div>
               <div className="w-1 h-24 bg-green-500 absolute right-10 animate-bounce delay-200"></div>
               <div className="w-1 h-12 bg-yellow-500 absolute right-20 animate-bounce delay-500"></div>
            </div>

            <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
            <h1 className="text-3xl font-black text-yellow-900 mb-2">尋寶大成功！</h1>
            
            <div className="bg-yellow-900/10 p-4 rounded-xl border border-yellow-900/20 mb-6 mt-4">
               <p className="text-yellow-800 font-bold mb-1">探險家 {playerName} 的最終成績</p>
               <div className="flex items-center justify-center gap-2 text-3xl font-black text-yellow-600">
                 <Coins /> {score} 枚金幣
               </div>
            </div>

            {/* Module A: 稱號 */}
            <div className="mb-6">
               <p className="text-sm text-yellow-700 font-bold mb-1">獲得專屬稱號</p>
               <div className={`text-2xl font-black ${getTitle(score).color} drop-shadow-md`}>
                 {getTitle(score).title}
               </div>
            </div>

            {/* Module B: 盲盒 */}
            {myBlindBox && (
              <div className="bg-stone-800 p-4 rounded-xl border-2 border-stone-600 mb-6 text-stone-100 shadow-inner">
                <p className="text-sm text-stone-400 font-bold mb-2">🎁 你找到的專屬寶藏</p>
                <div className="text-4xl mb-2">{myBlindBox.icon}</div>
                <h3 className="font-bold text-yellow-400 text-lg">{myBlindBox.name}</h3>
                <p className="text-sm text-stone-300 mt-1">{myBlindBox.desc}</p>
              </div>
            )}

            {/* Module C: 專屬評語 */}
            <div className="border-t-2 border-dashed border-yellow-800/30 pt-4">
              <div className="flex justify-center mb-2"><MessageSquare className="text-yellow-700" size={24}/></div>
              <p className="font-bold text-yellow-900 leading-relaxed">
                {getFeedback(playerName)}
              </p>
            </div>
            
            <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-stone-800 text-stone-100 font-bold rounded-lg hover:bg-stone-700 transition-colors border-2 border-stone-900">
              返回首頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}