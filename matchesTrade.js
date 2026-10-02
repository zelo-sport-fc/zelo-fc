// ==========================================
// ⚽ Meteora Devnet Launchpad & Trading Engine
// ==========================================

// 🛡️ [حل جذر للخطأ]: إنشاء دالة تحويل Lamports إلى Uint8Array بطول 8 بايت مع Buffer Polyfill متوافق
(function() {
    if (typeof window.Buffer === 'undefined' || !window.Buffer.alloc) {
        if (typeof buffer !== 'undefined' && buffer.Buffer) {
            window.Buffer = buffer.Buffer;
        } else {
            // Polyfill متوافق تماماً مع متطلبات Solana web3.js
            window.Buffer = class Buffer extends Uint8Array {
                constructor(arg, encoding) {
                    if (typeof arg === 'number') {
                        super(arg);
                    } else if (typeof arg === 'string') {
                        const encoded = new TextEncoder().encode(arg);
                        super(encoded);
                    } else {
                        super(arg);
                    }
                }
                static alloc(size) {
                    return new Uint8Array(size);
                }
                static from(data, encoding) {
                    if (typeof data === 'string') {
                        return new TextEncoder().encode(data);
                    }
                    return new Uint8Array(data);
                }
            };
        }
    }
})();

if (typeof window.VAULT_PUBLIC_KEY === 'undefined') {
    window.VAULT_PUBLIC_KEY = 'G2zT2vK1y2426mKxT1p3zT2vK1y2426mKxT1p3zT2vK1';
}

// دالة تحويل الأرقام إلى 8 Bytes Little-Endian المتوافقة تماماً مع Solana SystemProgram
function numberTo8ByteUint8Array(value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    const bigIntValue = BigInt(Math.round(value));
    view.setBigUint64(0, bigIntValue, true); // true = Little Endian
    return new Uint8Array(buffer);
}

window.fetchMatchesForMeteora = async function() {
    const fallbackMatches = [
        { id: 101, teamA: 'São Paulo FC', teamB: 'Santos FC', matchTime: new Date().toISOString(), priceA: '2.25', priceB: '2.25', bondingProgressA: 50, bondingProgressB: 50 },
        { id: 102, teamA: 'CA Mineiro', teamB: 'RB Bragantino', matchTime: new Date().toISOString(), priceA: '2.25', priceB: '2.25', bondingProgressA: 50, bondingProgressB: 50 },
        { id: 103, teamA: 'RB Bragantino', teamB: 'Mirassol FC', matchTime: new Date().toISOString(), priceA: '2.25', priceB: '2.25', bondingProgressA: 50, bondingProgressB: 50 }
    ];

    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null) {
        try {
            const { data, error } = await window.supabaseClient
                .from('matches')
                .select('*')
                .neq('status', 'FINISHED')
                .order('match_date', { ascending: true })
                .limit(20);

            if (!error && data && data.length > 0) {
                return data.map(m => {
                    const priceA = (1.25 + (m.bonding_progress_team_a || 50) * 0.02).toFixed(2);
                    const priceB = (1.25 + (m.bonding_progress_team_b || 50) * 0.02).toFixed(2);
                    return {
                        id: m.id,
                        teamA: m.team_a || 'Team A',
                        teamB: m.team_b || 'Team B',
                        matchTime: m.match_date || new Date().toISOString(),
                        priceA: priceA,
                        priceB: priceB,
                        bondingProgressA: m.bonding_progress_team_a || 50,
                        bondingProgressB: m.bonding_progress_team_b || 50
                    };
                });
            }
        } catch (err) {
            console.error("❌ خطأ جلب بيانات Supabase:", err);
        }
    }
    return fallbackMatches;
};

window.renderMeteoraPage = async function(container) {
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 30px 15px;">
            <div style="display: inline-block; width: 26px; height: 26px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #aaa; font-size: 0.8rem; margin-top: 10px;">جاري تحميل سوق Meteora SOL...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    try {
        const matches = await window.fetchMatchesForMeteora();

        let html = `
            <div style="text-align: center; margin-bottom: 18px;">
                <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 4px 12px; border-radius: 15px; font-size: 0.7rem; color: #14F195; font-weight: bold; margin-bottom: 6px;">
                    ⚡ METEORA DBC LAUNCHPAD
                </div>
                <h3 style="margin: 0; color: #fcb045; font-size: 1.1rem;">سوق تداول توكنات المباريات</h3>
            </div>
        `;

        if (matches && matches.length > 0) {
            matches.forEach(m => {
                const matchDate = new Date(m.matchTime);
                const formattedDate = !isNaN(matchDate.getTime()) ? matchDate.toLocaleDateString('ar-EG') : '';
                const formattedTime = !isNaN(matchDate.getTime()) ? matchDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

                const safeTeamA = String(m.teamA).replace(/'/g, "\\'");
                const safeTeamB = String(m.teamB).replace(/'/g, "\\'");

                html += `
                    <div class="card" style="padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.9); border: 1px solid rgba(252, 176, 69, 0.25); border-radius: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                            <span style="font-size: 0.75rem; color: #14F195; font-weight: bold;">⚽ ${m.teamA} VS ${m.teamB}</span>
                            <span style="font-size: 0.68rem; color: #aaa;">📅 ${formattedDate} ${formattedTime}</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 8px;">
                            <div style="text-align: center; flex: 1;">
                                <span style="font-size: 0.68rem; color: #aaa; display: block; margin-bottom: 2px;">${m.teamA}</span>
                                <strong style="font-size: 0.85rem; color: #14F195;">${m.priceA} SOL</strong>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.1);"></div>
                            <div style="text-align: center; flex: 1;">
                                <span style="font-size: 0.68rem; color: #aaa; display: block; margin-bottom: 2px;">${m.teamB}</span>
                                <strong style="font-size: 0.85rem; color: #f72585;">${m.priceB} SOL</strong>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.openSwapModal('${m.id}', '${safeTeamA}', '${m.priceA}')" style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px 4px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                شراء ${m.teamA}
                            </button>
                            <button onclick="window.openSwapModal('${m.id}', '${safeTeamB}', '${m.priceB}')" style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px 4px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                شراء ${m.teamB}
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align:center; color:#aaa; padding:20px;">لا توجد مباريات متاحة للتداول حالياً.</div>`;
        }

        container.innerHTML = html;
    } catch (e) {
        console.error("❌ خطأ في عرض الواجهة:", e);
        container.innerHTML = `<div style="text-align:center; color:#ff4d4d; padding:20px;">حدث خطأ أثناء تحميل البيانات.</div>`;
    }
};

window.openSwapModal = function(matchId, teamName, priceSol) {
    const oldModal = document.getElementById("swap-modal");
    if (oldModal) oldModal.remove();

    const safeTeamName = String(teamName).replace(/'/g, "\\'");

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
        direction: rtl; font-family: sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #181824; border: 1px solid rgba(252, 176, 69, 0.4); border-radius: 16px; padding: 20px; width: 90%; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin:0; color: #14F195; font-size: 1rem;">🚀 شراء توكن ${teamName}</h3>
                <button onclick="document.getElementById('swap-modal').remove()" style="background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color:#aaa; font-size:0.75rem; display:block; margin-bottom:5px;">المبلغ بـ SOL:</label>
                <input type="number" id="swap-amount" value="${priceSol}" step="0.001" style="width: 100%; padding: 10px; background: #0d0d12; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 0.9rem; box-sizing: border-box;">
            </div>

            <div id="swap-status-msg" style="color: #fcb045; font-size: 0.75rem; margin-bottom: 12px; text-align: center; min-height: 18px;"></div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-confirm-swap" onclick="window.executeDevnetSwap('${matchId}', '${safeTeamName}')" style="background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer;">
                    🚀 إتمام المقايضة (Swap on DBC)
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

window.executeDevnetSwap = async function(matchId, teamName) {
    const statusMsg = document.getElementById("swap-status-msg");
    const btn = document.getElementById("btn-confirm-swap");
    const amountInput = document.getElementById("swap-amount");
    const solAmount = parseFloat(amountInput ? amountInput.value : "0.1");

    if (isNaN(solAmount) || solAmount <= 0) {
        alert("⚠️ يرجى إدخال قيمة صحيحة بـ SOL.");
        return;
    }

    try {
        if (btn) btn.disabled = true;
        if (statusMsg) statusMsg.innerText = "⏳ جاري الإتصال بالشبكة ومعالجة المعاملة...";

        const provider = window.phantom?.solana || window.solana || window.solflare;

        if (!provider) {
            if (window.Telegram?.WebApp?.openLink) {
                const currentUrl = window.location.href;
                const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(currentUrl)}`;
                window.Telegram.WebApp.openLink(phantomUrl);
                if (statusMsg) statusMsg.innerText = "📱 جاري التوجيه إلى Phantom...";
                return;
            } else {
                throw new Error("لم يتم العثور على محفظة Solana.");
            }
        }

        const resp = await provider.connect();
        const userPublicKey = resp.publicKey || provider.publicKey;

        if (!userPublicKey) {
            throw new Error("تعذر الحصول على العنوان المباشر للمحفظة.");
        }

        const solanaWeb3Lib = window.solanaWeb3;
        if (!solanaWeb3Lib) {
            throw new Error("مكتبة Solana Web3 غير متوفرة.");
        }

        const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');

        // حساب الـ Lamports وتأمين التنسيق بأسلوب مباشر لا يعتمد على Buffer.encode
        const lamportsCount = Math.round(solAmount * solanaWeb3Lib.LAMPORTS_PER_SOL);

        // إنشائ العملية بأسلوب Instruction المباشر لتفادي مشاكل Blob.encode
        const transferInstruction = new solanaWeb3Lib.TransactionInstruction({
            keys: [
                { pubkey: userPublicKey, isSigner: true, isWritable: true },
                { pubkey: new solanaWeb3Lib.PublicKey(window.VAULT_PUBLIC_KEY), isSigner: false, isWritable: true }
            ],
            programId: solanaWeb3Lib.SystemProgram.programId,
            data: (() => {
                // SystemProgram Transfer Instruction Index = 2 (4-byte LE) + 8-byte LE Lamports
                const dataArray = new Uint8Array(12);
                const view = new DataView(dataArray.buffer);
                view.setUint32(0, 2, true); // Index 2 = Transfer
                view.setBigUint64(4, BigInt(lamportsCount), true); // Lamports
                return dataArray;
            })()
        });

        const transaction = new solanaWeb3Lib.Transaction().add(transferInstruction);

        transaction.feePayer = userPublicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        if (statusMsg) statusMsg.innerText = "🔐 يرجى تأكيد العملية من نافذة Phantom...";

        const result = await provider.signAndSendTransaction(transaction);
        const signature = result.signature || result;

        if (statusMsg) statusMsg.innerText = "⏳ جاري التأكيد المباشر عبر Solana Devnet...";
        await connection.confirmTransaction(signature, 'confirmed');

        alert(`✅ تمت المعاملة بنجاح!\n\nرقم التوقيع:\n${signature}`);

        const modal = document.getElementById("swap-modal");
        if (modal) modal.remove();

    } catch (err) {
        console.error("❌ تفاصيل الخطأ في المعاملة:", err);

        let errorMsg = "تم إلغاء العملية أو رفض التوقيع.";
        if (err && typeof err === 'object') {
            if (err.message) errorMsg = err.message;
        } else if (typeof err === 'string') {
            errorMsg = err;
        }

        alert("❌ تعذر إتمام العملية:\n" + errorMsg);

        if (btn) btn.disabled = false;
        if (statusMsg) statusMsg.innerText = "";
    }
};

console.log("✅ [Meteora Engine] matchesTrade.js Blob/Buffer Encoded Fix Applied.");
        
