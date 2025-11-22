require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TronWeb } = require('tronweb');  // 使用解构导入 TronWeb

const app = express();
app.use(cors());
app.use(express.json());

// Nile 测试网 + 你的owner私钥
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.PRIVATE_KEY,
});

// 你的业务合约地址（有 transferUSDT 函数的那个）
const MY_CONTRACT = process.env.CONTRACT_ADDRESS;

// Nile 测试网官方 USDT 地址（固定写死，不用改）
const USDT_CONTRACT = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf';

// 参数验证函数
const validateParams = ({ sender, recipient, amount }) => {
  if (!tronWeb.isAddress(sender) || !tronWeb.isAddress(recipient) || amount <= 0) {
    return { success: false, message: '参数错误' };
  }
  return { success: true };
};

app.post('/api/transfer', async (req, res) => {
  try {
    const { sender, recipient, amount } = req.body;

    // 验证请求参数
    const validation = validateParams({ sender, recipient, amount });
    if (!validation.success) return res.json(validation);

    const contract = await tronWeb.contract().at(MY_CONTRACT);

    // 代转USDT
    const txID = await contract
      .transferUSDT(sender, recipient, amount * 1000000) // 乘以 10^6 来符合 USDT 的小数位
      .send({ feeLimit: 100_000_000 });

    res.json({
      success: true,
      message: 'Nile测试网代转成功',
      txid: txID,
      查看交易: `https://nile.tronscan.org/#/transaction/${txID}`,
    });
  } catch (e) {
    res.json({ success: false, message: e.message || '交易失败' });
  }
});
const PORT = process.env.PORT || 3000;
const host = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
app.use(require('cors')());
app.listen(PORT, host,() => {
  console.log('Nile测试网代转后端运行中 → http://127.0.0.1:3000');
});
