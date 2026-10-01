// ==========================================
// ⚽ Zelo Sport - Live Matches Engine (Supabase Integration)
// ==========================================

window.IS_DEVNET = true;
window.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

// 1. جلب المباريات الحقيقية المباشرة والقادمة من جدول matches الخاص بك
window.fetchMatchesFromDB = async function() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        try {
            // جلب المباريات مرتبة حسب الموعد match_time
            const { data, error } = await supabaseClient
                .from('matches')
                .select('*')
                .order('match_time', { ascending: true })
                .limit(20);

            if (error) {
                console.warn("⚠️ خطأ في جلب المباريات من Supabase:", error);
            } else if (data && data.length > 0) {
                return data.map(m => {
                    // قراءة أسماء الفريقين بدعم لكافة مسميات الأعمدة المحتملة
                    const teamA = m.team_a || m.home_team || m.home_team_name || 'Home Team';
                    const teamB = m.team_b || m.away_team || m.away_team_name || 'Away Team';
                    
                    // تحديد حالة المباراة (هل انتهت أم لا تزال للتداول/التخمين)
                    const isFinished = (m.home_score !== null && m.home_score !== undefined) && 
                                       (m.away_score !== null && m.away_score !== undefined);
                    
                    let winner = null;
                    if (isFinished) {
                        if (Number(m.home_score) > Number(m.away_score)) winner = teamA;
                        else if (Number(m.away_score) > Number(m.home_score)) winner = teamB;
                        else winner = 'Draw';
                    }

                    return {
                        id: m.id,
                        teamA: teamA,
                        teamB: teamB,
                        matchTime: m.match_time,
                        homeScore: m.home_score,
                        awayScore: m.away_score,
                        status: isFinished ? 'SETTLED' : 'TRADING_LIVE',
                        winner: winner,
                        tokenA: `Devnet_${teamA.replace(/[^a-zA-Z0-9]/g, '')}`,
                        tokenB: `Devnet_${teamB.replace(/[^a-zA-Z0-9]/g, '')}`,
                        bondingProgressTeamA: m.bonding_progress_team_a || 50,
                        bondingProgressTeamB: m.bonding_progress_team_b || 50
                    };
                });
            }
        } catch (err) {
            console.error("❌ استثناء أثناء جلب بيانات المباريات:", err);
        }
    }
    return [];
};

// 2. عرض واجهة التداول والمباريات المباشرة
window.renderMeteoraPage = async function(container) {
    if (!container) return;

    // شاشة التحميل
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 15px;">
            <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #aaa; font-size: 0.85rem; margin-top: 12px;">جاري جلب المباريات الحقيقية القادمة...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    // جلب المباريات الفعلية من Supabase
    const matches = await window.fetchMatchesFromDB();

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; color: #14F195; font-weight: bold; margin-bottom: 8px;">
                🌐 SOLANA DEVNET MARKET
            </div>
            <h2 style="margin: 0; color: var(--accent-gold, #fcb045); font-size: 1.3rem;">سوق التخمين والتداول المباشر</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.78rem; color: var(--text-muted, #888899);">
                المباريات الحقيقية المجلوبة من قاعدة البيانات
            </p>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 0.9rem; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                🔥 المباريات القادمة والمباشرة
            </h3>
    `;

    if (matches.length > 0) {
        matches.forEach(match => {
            html += window.renderPredictionCard(match);
        });
    } else {
        html += `
            <div style="text-align:center; padding:30px 15px; color:#aaa; background:rgba(255,255,255,0.03); border-radius:15px;">
                <p style="margin:0; font-size:0.85rem;">⏳ لا توجد مباريات متاحة حالياً في الجدول.</p>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
};

// 3. تصميم بطاقة المباراة وتفاصيل التخمين
window.renderPredictionCard = function(match) {
    // تنسيق التاريخ والوقت
    let formattedTime = 'قريباً';
    if (match.matchTime) {
        const d = new Date(match.matchTime);
        formattedTime = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' | ' + 
                        d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }

    if (match.status === 'SETTLED') {
        return `
            <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(20, 241, 149, 0.05); border: 1px solid rgba(20, 241, 149, 0.3); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                    <span style="font-weight: 800; color: #fff; font-size: 0.9rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                    <span style="font-size: 0.68rem; color: #14F195; background: rgba(20,241,149,0.2); padding: 3px 8px; border-radius: 6px; font-weight: bold;">انتهت (${match.homeScore} - ${match.awayScore})</span>
                </div>
                
                <div style="text-align: center; padding: 4px 0;">
                    <span style="font-size: 0.8rem; color: #aaa;">النتيجة: </span>
                    <strong style="color: #fcb045; font-size: 0.9rem;">🏆 ${match.winner === 'Draw' ? 'تعادل' : 'فوز ' + match.winner}</strong>
                </div>

                <button 
                    onclick="alert('🎉 تم تسوية أرباح السيولة بنجاح!')" 
                    style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 0.82rem; cursor: pointer;">
                    💰 استلام السيولة الأرباح
                </button>
            </div>
        `;
    }

    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.8); border: 1px solid rgba(252, 176, 69, 0.3); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.9rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.68rem; color: #fcb045; background: rgba(252,176,69,0.15); padding: 3px 8px; border-radius: 6px; font-weight: bold;">📅 ${formattedTime}</span>
            </div>

            <div style="margin: 4px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #ccc; margin-bottom: 4px;">
                    <span style="color: #14F195; font-weight: bold;">${match.teamA} (${match.bondingProgressTeamA}%)</span>
                    <span style="color: #f72585; font-weight: bold;">${match.teamB} (${match.bondingProgressTeamB}%)</span>
                </div>
                <div style="width: 100%; background: #0f1721; height: 8px; border-radius: 10px; overflow: hidden; display: flex;">
                    <div style="width: ${match.bondingProgressTeamA}%; background: #14F195; height: 100%;"></div>
                    <div style="width: ${match.bondingProgressTeamB}%; background: #f72585; height: 100%;"></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button 
                    onclick="window.openSwapModal('${match.tokenA}', '${match.teamA}')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                    🔥 تخمين ${match.teamA}
                </button>
                <button 
                    onclick="window.openSwapModal('${match.tokenB}', '${match.teamB}')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
                    🔥 تخمين ${match.teamB}
                </button>
            </div>
        </div>
    `;
};

// 4. نافذة التداول بـ Devnet SOL
window.openSwapModal = function(tokenMint, teamName) {
    let existingModal = document.getElementById("swap-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 15px;
    `;

    modal.innerHTML = `
        <div style="background: #1c1c22; border: 1px solid rgba(20, 241, 149, 0.4); border-radius: 20px; width: 100%; max-width: 380px; padding: 20px; color: #fff; position: relative;">
            <button onclick="document.getElementById('swap-modal').remove()" style="position: absolute; top: 12px; left: 12px; background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(20,241,149,0.2); color: #14F195; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: bold;">SOLANA DEVNET</span>
                <h3 style="margin: 6px 0 0 0; color: #fcb045; font-size: 1.1rem;">تخمين فوز ${teamName}</h3>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 15px;">
                <label style="font-size: 0.75rem; color: #aaa; display: block; margin-bottom: 6px;">المبلغ بـ Devnet SOL:</label>
                <input type="number" id="swap-amount" value="0.1" step="0.1" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; color: #fff; font-size: 1rem; outline: none;">
            </div>

            <button onclick="window.executeDevnetSwap('${teamName}')" style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.88rem; cursor: pointer;">
                🚀 تأكيد الشراء بـ Devnet SOL
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

// 5. تنفيذ الشراء
window.executeDevnetSwap = function(teamName) {
    const amount = document.getElementById("swap-amount")?.value || "0.1";
    alert(`✅ تم التخمين والشراء بنجاح!\n\nتم تخصيص ${amount} Devnet SOL لصالح ${teamName}.`);
    const modal = document.getElementById("swap-modal");
    if (modal) modal.remove();
};
    
