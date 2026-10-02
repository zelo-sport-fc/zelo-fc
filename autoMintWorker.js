const { createClient } = require('@supabase/supabase-client');
const { Connection, Keypair, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
const bs58 = require('bs58');

// 1. إعدادات البيئة (قم بوضع بياناتك الخاصة)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY; // المفتاح الخاص ببيئة Devnet

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// جلب محفظة المسؤول عن السك
function getPayerKeypair() {
    if (!SOLANA_PRIVATE_KEY) {
        console.log("⚠️ لم يتم العثور على مفتاح خاص، جاري توليد محفظة موقتة...");
        return Keypair.generate();
    }
    return Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY));
}

// دالة توليد رمز التوكن (Symbol) تلقائياً من اسم الفريق
function generateSymbol(teamName) {
    if (!teamName) return 'TKN';
    return teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'TKN';
}

async function processPendingMatches() {
    try {
        const payer = getPayerKeypair();
        console.log(`👤 محفظة السك: ${payer.publicKey.toBase58()}`);

        // التأكد من وجود رصيد كافٍ للرسوم
        const balance = await connection.getBalance(payer.publicKey);
        if (balance < 0.1 * 10**9) {
            console.log("⏳ طلب SOL تجريبي من Faucet...");
            const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 10**9);
            await connection.confirmTransaction(airdropSig);
        }

        // 2. جلب جميع المباريات التي لم يتم سك توكنات لها بعد (الحقول NULL)
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .or('token_a_mint.is.null,token_b_mint.is.null');

        if (error) throw error;

        if (!matches || matches.length === 0) {
            console.log("✨ جميع المباريات في الجدول تحتوي على توكنات حالياً.");
            return;
        }

        console.log(`📌 تم العثور على ${matches.length} مباراة معلقة تحتاج للسك التلقائي...\n`);

        for (const match of matches) {
            console.log(`⚽ جاري معالجة المباراة [ID: ${match.id}]: ${match.team_a} VS ${match.team_b}...`);

            // أ) سك توكن الفريق A (إذا لم يكن موجوداً)
            let mintA = match.token_a_mint;
            if (!mintA) {
                const mintPK = await createMint(connection, payer, payer.publicKey, payer.publicKey, 6);
                mintA = mintPK.toBase58();
                console.log(`   └─ ✅ تم سك توكن ${match.team_a}: ${mintA}`);
            }

            // ب) سك توكن الفريق B (إذا لم يكن موجوداً)
            let mintB = match.token_b_mint;
            if (!mintB) {
                const mintPK = await createMint(connection, payer, payer.publicKey, payer.publicKey, 6);
                mintB = mintPK.toBase58();
                console.log(`   └─ ✅ تم سك توكن ${match.team_b}: ${mintB}`);
            }

            // ج) تحديث صف المباراة في Supabase
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    token_a_mint: mintA,
                    token_b_mint: mintB,
                    token_a_symbol: generateSymbol(match.team_a),
                    token_b_symbol: generateSymbol(match.team_b)
                })
                .eq('id', match.id);

            if (updateError) {
                console.error(`❌ خطأ أثناء تحديث بيانات المباراة [ID: ${match.id}]:`, updateError);
            } else {
                console.log(`💾 تم حفظ التوكنات بنجاح للمباراة [ID: ${match.id}].\n`);
            }
        }

        console.log("🎉 اكتملت عملية السك التلقائي لجميع المباريات المعلقة!");

    } catch (err) {
        console.error("❌ حدث خطأ أثناء تنفيذ العمل الحاد:", err);
    }
}

// تشغيل الدالة
processPendingMatches();
              
