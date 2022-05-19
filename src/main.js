const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//input private key and retrieve public key
const myKey = ec.keyFromPrivate('60f1f04cb497169daf5b252e0b41205415a5056d5858e22e254f43369a54739e');
const myWalletAddress = myKey.getPublic('hex'); 

let mattCoin = new Blockchain();


//creating a transaction from my address to a different  address
const tx1 = new Transaction(myWalletAddress, 'public key goes here heh', 10);
//imitating a signing using my private key
tx1.signTransaction(myKey);
//add this transaction to the blockchain
mattCoin.addTransaction(tx1);

console.log('\n Starting the miner...');
//Send it to my own wallet or we won't be able to access it otherwise because we won't have the private key
mattCoin.minePendingTransactions(myWalletAddress);

console.log('\n Balance of Matt is', mattCoin.getBalanceOfAddress(myWalletAddress));

mattCoin.chain[1].transactions[0].amount = 1;

console.log('Is chain valid?', mattCoin.isChainValid());