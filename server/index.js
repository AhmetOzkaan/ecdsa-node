const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const {secp256k1} = require("ethereum-cryptography/secp256k1")
const {toHex, hexToBytes, bytesToUtf8} = require("ethereum-cryptography/utils")
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
  "4c50df5ea456d9829c1fa380500b7b52519d7d17": 100,
  "8af00a17c3c5e8ee077aeb9100b136288ab2de31": 50,
  "4bef5cbdf1f4bd716038832ce54f1ee0324f669d": 75,
};

let nextTransactionId = 0;

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { hexData, sign, recovery} = req.body;

  const {sender, amount, recipient, transactionId} = JSON.parse(bytesToUtf8(hexToBytes(hexData)));

  if (transactionId !== nextTransactionId) {
    res.status(400).send({message: "wrong transaction id"});
    return;
  }

  const signatureType = secp256k1.Signature.fromCompact(sign);
  signatureType.recovery = recovery;
  const publicKey = signatureType.recoverPublicKey(hexData).toRawBytes();
  const hash = keccak256(publicKey.slice(1));
  const signAddress = toHex( hash.slice(hash.length - 20));

  if (sender !== signAddress) {
    res.status(400).send({message: "wrong key!"})
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    nextTransactionId++;
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.get("/transactionId", (req, res) => {
  res.send({ transactionId: nextTransactionId });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
