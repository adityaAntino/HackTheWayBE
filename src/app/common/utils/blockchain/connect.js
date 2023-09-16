const { Web3 } = require("web3");

const rpcURL = "https://mainnet.infura.io/v3/d237c348587848dc97f304e0ac1ad5a5";

const web3Provider = new Web3.providers.HttpProvider(rpcURL);
const web3 = new Web3(web3Provider);
// const web3 = new Web3();

const walletAddress = "0x8F43A06882c42d6C5Ac7e6d4E9bf0516c59D3a25";

const account = "DSI8WTC9XHIJXQEP4MWMK6ZK7SBE738PWR";

// web3.eth.getBalance(walletAddress, (err, wei) => {
// 	balance = web3.utils.fromWei(wei, "ether");
// });

const accounts = web3.eth.accounts.create();
console.log(accounts);
// setTimeout(async function () {
// 	const account = web3.eth.accounts.privateKeyToAccount("d237c348587848dc97f304e0ac1ad5a5");
// 	const accounts = await web3.eth.getAccounts();
// 	console.log(account);
// 	console.log(accounts);
// 	console.log(web3.currentProvider);
// }, 5000);

// web3.eth.getBalance(web3.eth.accounts[0], (err, wei) => {
// 	balance = web3.utils.fromWei(wei, "ether");
// });
// setTimeout(function () {

// }, 5000);
