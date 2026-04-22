/**
 * 2026 Rakuon 新歓予約システム - 制御スクリプト
 * すべてのロジック、色制御、通信処理を含みます。
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyvN1nYEihtW8ZiN6SUQNm48RTdFOKp9KI6W6dgE02A-ujVCkCXmnnBWUPkwGCH8oky/exec";

// 5分間(300000ms)は連投を禁止する設定
const COOLDOWN_MS = 60000; 
const LAST_SUBMIT_KEY = "rakuon_last_submit";

// イベントごとの詳細データ（テーマカラー、発光色を追加）
// ★ 修正：gasName を追加し、以前の名前と一致させる
const EVENT_DETAILS = {
    takopa: {
        title: "たこ焼きパーティー 🐙",
        gasName: "タコパ", 
        date: "4月18日(土) 12:00〜15:00",
        location: "三ノ宮駅近くのレンタルスペース ※詳細は予約確定後にお送りします",
        fee: "無料",
        description: "みんなでワイワイたこ焼きを焼きましょう！おひとり様でも大丈夫です😊",
        belongings: "特になし（手ぶらでOK！）",
        reserveStart: "2026/04/08 10:00",
        eventEnd: "2026/04/18 11:00",
        theme: "#F5B82E",
        glow: "rgba(245, 184, 46, 0.3)"
    },
    picnic: { // ★タコパと同じ設定で作成
        title: "ピクニック 🥪",
        gasName: "ピクニック", 
        date: "5月2日(火) 12:00〜15:00",
        location: "三ノ宮駅近くの公園 ※詳細は予約確定後にお送りします",
        fee: "無料",
        description: "公園で軽食を食べながらみんなでおしゃべりしましょう！おひとり様でも大丈夫です😊",
        belongings: "特になし（手ぶらでOK！）",
        reserveStart: "2026/04/22 12:00",
        eventEnd: "2026/05/02 11:00",
        theme: "#F5B82E",
        glow: "rgba(245, 184, 46, 0.3)"
    },
    instrumentsA: { // ★名前をAに変更
        title: "楽器体験会A 🎸",
        gasName: "楽器体験会A", 
        date: "4月25日(土) 10:20〜 / 11:30〜 / 12:40〜",
        location: "六甲道駅近くの音楽スタジオ ※詳細は予約確定後にお送りします",
        fee: "無料",
        description: "楽器を実際に触ってみる体験会です。未経験者・初心者大歓迎！先輩が丁寧に教えてくれます🎸",
        belongings: "特になし（自分の楽器を持ってきていただいても大丈夫です！）",
        reserveStart: "2026/04/15 10:00",
        eventEnd: "2026/04/25 10:00",
        theme: "#FFD131",
        glow: "rgba(255, 209, 49, 0.3)"
    },
    instrumentsB: { // ★Aをベースに作成
        title: "楽器体験会B 🎸",
        gasName: "楽器体験会B", 
        date: "5月9日(土) 10:20〜 / 11:30〜 / 12:40〜",
        location: "六甲道駅近くの音楽スタジオ ※詳細は予約確定後にお送りします",
        fee: "無料",
        description: "楽器を実際に触ってみる体験会です。未経験者・初心者大歓迎！先輩が丁寧に教えてくれます🎸",
        belongings: "特になし（自分の楽器を持ってきていただいても大丈夫です！）",
        reserveStart: "2026/05/08 12:00",
        eventEnd: "2026/05/09 10:00",
        theme: "#FFD131",
        glow: "rgba(255, 209, 49, 0.3)"
    },
    live: { // ★新規カラーと設定で作成
        title: "新歓ライブ 🎤",
        gasName: "新歓ライブ", 
        date: "5月16日(土) 13:30～",
        location: "神戸ALWAYS（阪急六甲駅すぐ）",
        fee: "無料",
        description: "現役部員による迫力のライブ！楽音のライブの雰囲気を味わいに来てください🎤",
        belongings: "特になし（手ぶらでOK！）",
        reserveStart: "2026/04/18 12:00",
        eventEnd: "2026/05/16 10:00",
        theme: "#F86624",
        glow: "rgba(248, 102, 36, 0.3)"
    }
};

let currentEventType = "";

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', checkOverallCapacity);

/**
 * 1. 全体の定員確認（一覧画面用）
 */
async function checkOverallCapacity() {
    const timeout = setTimeout(() => handleErrorState(), 15000);
    try {
        const res = await fetch(GAS_URL);
        if (!res.ok) throw new Error();
        const status = await res.json();
        clearTimeout(timeout);
        
        // ★全イベントの状態を判定（GAS側の返り値に各キーが含まれている前提）
        applyStatus('takopa', status.takopaFull);
        applyStatus('picnic', status.picnicFull);
        applyStatus('instrumentsA', status.instrumentsAFull);
        applyStatus('instrumentsB', status.instrumentsBFull);
        applyStatus('live', status.liveFull);
    } catch (e) {
        clearTimeout(timeout);
        console.error("Capacity Check Error:", e);
        handleErrorState();
    }
}

/**
 * ボタンの状態（data-status）を切り替える
 */
function applyStatus(type, isFull) {
    const btn = document.getElementById(`btn-${type}`);
    const now = new Date();
    const detail = EVENT_DETAILS[type];
    const startDate = new Date(detail.reserveStart);
    const endDate = new Date(detail.eventEnd);

    if (now > endDate) {
        btn.dataset.status = "ended";
        btn.disabled = true;
    } else if (now < startDate) {
        btn.dataset.status = "coming-soon";
        btn.disabled = true;
    } else if (isFull) {
        btn.dataset.status = "full";
        btn.disabled = true;
    } else {
        btn.dataset.status = "active";
        btn.disabled = false;
    }
}

/**
 * 通信エラー時の処理
 */
function handleErrorState() {
    Object.keys(EVENT_DETAILS).forEach(type => {
        document.getElementById(`btn-${type}`).dataset.status = "error";
        document.getElementById(`btn-${type}`).disabled = true;
    });
}

/**
 * 2. 詳細画面（Page 1.5）の表示
 */
async function loadEvent(type) {
    const btn = document.getElementById(`btn-${type}`);
    if (btn.dataset.status !== 'active') return;
    
    currentEventType = type;
    const d = EVENT_DETAILS[type];

    // ★ CSS変数をイベントのメインカラーに更新
    document.documentElement.style.setProperty('--theme-color', d.theme);
    document.documentElement.style.setProperty('--theme-glow', d.glow);

    // テキストデータの反映
    document.getElementById('detail-title').innerText = d.title;
    document.getElementById('detail-date').innerText = d.date;
    document.getElementById('detail-location').innerText = d.location;
    document.getElementById('detail-fee').innerText = d.fee;
    document.getElementById('detail-description').innerText = d.description;
    document.getElementById('detail-belongings').innerText = d.belongings;

    // 画面切り替え
    document.getElementById('page1').classList.add('hidden');
    document.getElementById('page-detail').classList.remove('hidden');
    window.scrollTo(0, 0);
}

/**
 * 3. 予約フォーム画面（Page 2）への遷移
 */
async function goToForm() {
    document.getElementById('page-detail').classList.add('hidden');
    document.getElementById('page2').classList.remove('hidden');
    
    const type = currentEventType;
    const d = EVENT_DETAILS[type];
    const eventInput = document.getElementById('event_name');
    
    document.getElementById('eventTitle').innerText = d.title;
    eventInput.value = d.gasName; 

    // ★ 追加：イベントに応じて「その他何かあれば」のヒント文を切り替える
    const messageBox = document.querySelector('textarea[name="message"]');
    if (type === 'live') {
        messageBox.placeholder = "一緒に参加するお友達の名前、途中参加・退出の時間など";
    } else {
        messageBox.placeholder = "友達と一緒に参加される場合は、お相手のお名前もこちらにご記入ください！";
    }

    // ★フォーム項目の切り替えロジック
    // 1. 楽器体験会用（AまたはB）
    if (type === 'instrumentsA' || type === 'instrumentsB') {
        document.getElementById('instruments_extra').classList.remove('hidden');
        document.getElementById('takopa_extra').classList.add('hidden');
        document.getElementById('live_extra').classList.add('hidden');
        await renderCapacityTable();
    } 
    // 2. ライブ用
    else if (type === 'live') {
        document.getElementById('live_extra').classList.remove('hidden');
        document.getElementById('instruments_extra').classList.add('hidden');
        document.getElementById('takopa_extra').classList.add('hidden');
    }
    // 3. タコパ・ピクニック用
    else {
        document.getElementById('takopa_extra').classList.remove('hidden');
        document.getElementById('instruments_extra').classList.add('hidden');
        document.getElementById('live_extra').classList.add('hidden');
    }
    window.scrollTo(0, 0);
}

/**
 * フォームから詳細画面へ戻る
 */
function backToDetail() {
    document.getElementById('page2').classList.add('hidden');
    document.getElementById('page-detail').classList.remove('hidden');
    window.scrollTo(0, 0);
}

/**
 * 4. 楽器体験会の予約枠テーブル生成
 */
async function renderCapacityTable() {
    const table = document.getElementById('capacityTable');
    table.innerHTML = "<tr><td colspan='4' class='p-8 text-center italic opacity-50'>最新の空き状況を確認中...</td></tr>";
    
    let counts = {};
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        counts = data.slots || {};
    } catch(e) {
        console.error("枠情報の取得に失敗:", e);
        counts = {}; // エラー時は空のオブジェクトとして扱う
    }

    const slots = ["第1部", "第2部", "第3部"];
    const instruments = ["ギター", "ベース", "ドラム"];
    let html = "";

    slots.forEach(slot => {
        html += `<tr><td class="p-4 border-b border-r bg-slate-50 font-bold text-xs">${slot}</td>`;
        instruments.forEach((inst) => {
            const prefix = currentEventType === 'instrumentsA' ? 'A_' : 'B_'; // AかBかを判定
            const key = prefix + `${slot}_${inst}`; // GAS側のキーと合わせる
            const count = counts[key] || 0;
            const isFull = count >= 4;
            
            if(isFull) {
                html += `<td class="p-4 border-b text-red-500 font-bold bg-red-50 text-xs">満員</td>`;
            } else {
                html += `
                <td class="p-2 border-b relative">
                    <label class="block cursor-pointer group">
                        <input type="radio" name="selection" value="${slot}|${inst}" required class="hidden peer">
                        <div class="py-2 rounded-lg border-2 border-transparent peer-checked:bg-white transition-all hover:bg-slate-50">
                            <div class="font-bold text-[11px] text-available">予約可</div>
                            <div class="text-[9px] opacity-60">残り${4-count}</div>
                        </div>
                    </label>
                </td>`;
            }
        });
        html += `</tr>`;
    });
    table.innerHTML = html;
}

/**
 * 持ち物欄の表示切り替え（経験者のみ表示）
 */
function toggleBringOwn() {
    const val = document.getElementById('expSelect').value;
    document.getElementById('bringOwnBox').classList.toggle('hidden', val !== '経験あり');
}
function toggleUnivOther() {
    const val = document.getElementById('univSelect').value;
    document.getElementById('univOther').classList.toggle('hidden', val !== 'その他');
}
function toggleGradeOther() {
    const val = document.getElementById('gradeSelect').value;
    document.getElementById('gradeOther').classList.toggle('hidden', val !== 'その他');
}

// の送信処理部分を修正

document.getElementById('mainForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // アーティスト欄のクリア（既存）
    if (currentEventType !== 'live') {
        data.target_artist = "";
    }

    // ★追加：楽器体験会（A・B）以外の時は、楽器関連の項目を空にする
    if (currentEventType !== 'instrumentsA' && currentEventType !== 'instrumentsB') {
        data.experience = "";
        data.bring_own = "";
    }

    // 大学名・学年の整形（前の回答で追加した場合）
    if (data.univ_select) {
        data.university = data.univ_select === "その他" ? data.univ_other : data.univ_select;
        data.grade = data.grade_select === "その他" ? data.grade_other : data.grade_select;
    }

    // ハニーポット（hp_field）に値が入っていたら、送信せずに終了する
    if (data.hp_field) {
        console.warn("Spam detected");
        return; 
    }

    // 2. ブラウザ側連投制限 (Cooldown)
    const lastSubmit = localStorage.getItem(LAST_SUBMIT_KEY);
    if (lastSubmit && (Date.now() - lastSubmit < COOLDOWN_MS)) {
        alert("短時間に何度も送信することはできません。1分ほど待ってから再度お試しください。");
        return;
    }
    
    btn.disabled = true; 
    btn.innerText = "チェック中...";

    // 3. IPアドレスの取得
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        data.user_ip = ipData.ip;
    } catch (e) {
        data.user_ip = "unknown";
    }

    if(data.selection) {
        const [slot, inst] = data.selection.split('|');
        data.time_slot = slot;
        data.instrument = inst;
    }

    try {
        const res = await fetch(GAS_URL, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        const result = await res.json();

        if (result.status === "success") {
            localStorage.setItem(LAST_SUBMIT_KEY, Date.now());
            document.getElementById('page2').classList.add('hidden');
            document.getElementById('page3').classList.remove('hidden');
            window.scrollTo(0, 0);
        } else if (result.status === "duplicate") {
            alert("【エラー】\nこのイベントには、入力されたInstagramアカウントで既に申し込みが完了しています。\n\n内容の変更を希望する場合は、InstagramのDMまでご連絡ください。");
            btn.disabled = false;
            btn.innerText = "予約を確定する";
        } else if (result.status === "event_conflict") {
            // ★ ここを追加：タコパ・ピクニックの相互制限エラーを表示
            alert(result.message);
            btn.disabled = false;
            btn.innerText = "予約を確定する";
        } else if (result.status === "full") {
            alert("申し訳ありません！入力中に満員になってしまいました。");
            location.reload();
        } else if (result.status === "limit_exceeded") {
            // ★ ここを追加：GAS側で設定したメッセージ（回数制限）を表示する
            alert(result.message);
            btn.disabled = false;
            btn.innerText = "予約を確定する";
        } else {
            // それ以外の不明なエラー（spam判定などもここに含まれます）
            throw new Error(result.message);
        }
    } catch(e) {
        alert("送信に失敗しました。電波の良い場所でもう一度お試しください。");
        btn.disabled = false;
        btn.innerText = "予約を確定する";
    }
});
