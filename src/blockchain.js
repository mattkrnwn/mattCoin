const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Transaction{
     constructor(fromAddress, toAddress, amount) {
         this.fromAddress = fromAddress;
         this.toAddress = toAddress;
         this.amount  = amount;
     }

     calculateHash() {
         return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
     }

     signTransaction(signingKey) {
         //the public key of the signing address must equal the sending address or else it isn't valid
        if(signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets');
        }

         //retrieves hash of inputted transaction
         const hashTx = this.calculateHash();
         //signature using signing key for hash transaction in base64
         const sig = signingKey.sign(hashTx, 'base64');
         this.signature = sig.toDER('hex');
     }

     isValid() {
         //Allow for null addresses because this accounts for sending transactions that are mining rewards
         if(this.fromAddress === null) return true;

         if(!this.signature || this.signature.length === 0) {
             throw new Error('No signature in this transaction');
         }

         const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
         return publicKey.verify(this.calculateHash(), this.signature);
     }
}

//defining what a block will look like
//index: actual index of the block on the blockchain
//timestamp: time and date of block creation
//data: details of transaction, how much money, sender, receiver
//previous hash: string containing hash of previous block
class Block {
    constructor(timestamp, transactions, previousHash = '' ) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;

    }

    //Takeing above properties, run through the function(sha256), and output the hash
    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        //Below line allows for the substring of the first "difficulty" amount of characters to be compared to an array of 0s the length of difficulty
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    hasValidTransactions() {
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
     }
}



class Blockchain{
    constructor() {
        //Start with genesis block, not an empty chain
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }
    //Genesis block needs to be created manually
    createGenesisBlock() {
        return new Block("01/01/2017", "Genesis block", "0");
    }

    getLatestBlock() {
        //calls index of chain that's one less than the total length
        return this.chain[this.chain.length - 1];
    }
    /*
    //Logic behind creating a new block (replaced by minePendingTransactions function)
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        //Simplified way of adding blocks to the blockchain, its typically not this simple
        this.chain.push(newBlock);
    }
    */

    minePendingTransactions(miningRewardAddress){

        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);
        //Miners take several pending transactions to be put in a block, and it is mined along with the date at a certain difficulty
        let block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [
            //Sends crypto straight from the system to the mining reward address
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];
    }

    addTransaction(transaction) {

        if(!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to addresses');
        }

        if(!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    //getting the balance is not simply returning a user's balance, but searching the chain for every transaction relating to the user and subtracting or adding accordingly
    getBalanceOfAddress(address) {
        let balance = 0;
        //Iterate through each transaction in each block of the chain
        for(const block of this.chain) {
            for(const trans of block.transactions) {
                //if the sending address is equal to the target address, subtract that amount
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                //if the receiving address is equal to the target address, add that amount
                if(trans.toAddress === address) {
                    balance += trans.amount
                }
            }
        }
        return balance;
    }

    isChainValid() {
        //start at one because you don't need to iterate over genesis block
        for(let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransactions()) {
                return false;
            }

            //if a block's given hash is not the same as the one calculated by the sha256 algorithm, it is invalid
            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }
            //if the calculated previous hash of a current block is not the same as the actual hash of the previous block, it is invalid
            if(currentBlock.previousHash !== previousBlock.hash){
                return false;
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;