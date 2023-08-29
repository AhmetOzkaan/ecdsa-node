import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import {toHex, utf8ToBytes} from "ethereum-cryptography/utils";

function Transfer({ address, setBalance }) {
  const [privateKey, setPrivateKey] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const data = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
      };
      const hexData = toHex(utf8ToBytes(JSON.stringify(data)));
      const sign = secp256k1.sign(hexData, privateKey);
      const {
        data: { balance },
      } = await server.post(`send`, {
        hexData,
        sign: sign.toCompactHex(),
        recovery: sign.recovery
      });
      setBalance(balance);
    } catch (ex) {
      console.error(ex)
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Your Private Key (actually you shouldn't enter it here for security)
        <input
          placeholder="Type your private key"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        ></input>
      </label>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
