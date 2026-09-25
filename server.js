const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(cors());
app.use(express.json());

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

app.post('/api/claim', async (req, res) => {
    const { userWalletAddress, userCoins } = req.body;

    try {
        if (!process.env.TREASURY_PRIVATE_KEY || !process.env.ZELO_MINT_ADDRESS) {
            return res.status(500).json({ success: false, error: "بيانات المحفظة أو العقد غير معرفة في السيرفر" });
        }

        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY));
        const zelocMint = new PublicKey(process.env.ZELO_MINT_ADDRESS);
        const playerPubkey = new PublicKey(userWalletAddress);

        // نسبة التحويل: كل 100 نقطة = 1 عملة ZELOFC
        const tokenAmount = userCoins / 100;
        const decimals = 6;
        const amountInLamports = BigInt(Math.floor(tokenAmount * Math.pow(10, decimals)));

        const treasuryTokenAcc = await getOrCreateAssociatedTokenAccount(
            connection, treasuryKeypair, zelocMint, treasuryKeypair.publicKey
        );

        const playerTokenAcc = await getOrCreateAssociatedTokenAccount(
            connection, treasuryKeypair, zelocMint, playerPubkey
        );

        const signature = await transfer(
            connection,
            treasuryKeypair,
            treasuryTokenAcc.address,
            playerTokenAcc.address,
            treasuryKeypair.publicKey,
            amountInLamports
        );

        return res.json({ success: true, txHash: signature });
    } catch (err) {
        console.error("Transfer Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
          
