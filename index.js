const { MerkleTree } = require("merkletreejs");
const keccak256      = require("keccak256");
const ethers         = require("ethers");
const addresses      = require("./setup.js");
const fs             = require("fs");

// Ensure output folder exists
const output_folder = './build'
if(!fs.existsSync(output_folder)) {
	fs.mkdirSync(output_folder);
}

// Create merkle tree proofs
const buf2hex = x => "0x" + x.toString("hex");
const leaves  = addresses.map(x => keccak256(ethers.utils.getAddress(x)));
const tree    = new MerkleTree(leaves, keccak256, { sort: true });

const hexroot  = tree.getHexRoot();
const leaf     = keccak256(ethers.utils.getAddress(addresses[0]));
const hexleaf  = buf2hex(leaf);
const hexproof = tree.getProof(leaf).map(x => buf2hex(x.data));

const leafs = {};
addresses.map(address => {
	const addr_leaf     = keccak256(ethers.utils.getAddress(address));
	const addr_hexproof = tree.getProof(addr_leaf).map(x => buf2hex(x.data));

	leafs[address] = addr_hexproof;
});

const root = tree.getHexRoot();
if(tree.verify(hexproof, hexleaf, hexroot)) {
	const date = new Date();
	const date_created = `${date.getFullYear()}_${date.getMonth()}_${date.getTime()}`
	fs.writeFileSync(`${output_folder}/${date_created}_proofs.json`, JSON.stringify({ root, leafs }, null, 2));
} else {
	console.log(`Could not verify tree for phase: ${phase}`);
}

console.log('Done.');