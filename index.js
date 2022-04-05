const { MerkleTree } = require("merkletreejs");
const keccak256      = require("keccak256");
const ethers         = require("ethers");
const address_list   = require("./setup.js");
const fs             = require("fs");

async function main() {
	const addresses = formatAddresses(address_list);

	// Ensure output folder exists
	const output_folder = './build'
	if(!fs.existsSync(output_folder)) {
		fs.mkdirSync(output_folder);
	}

	// Create merkle tree
	const buf2hex = x => "0x" + x.toString("hex");
	console.log(addresses);
	const leaves  = addresses.map(x => keccak256(ethers.utils.getAddress(x)));
	const tree    = new MerkleTree(leaves, keccak256, { sort: true });

	// Find the
	const leaves_by_addr = {};
	addresses.map(address => {
		const addr_leaf     = keccak256(ethers.utils.getAddress(address));
		const addr_hexproof = tree.getProof(addr_leaf).map(x => buf2hex(x.data));

		leaves_by_addr[address] = addr_hexproof;
	});

	// Make sure this stuff all worked, and then save it
	const hexroot  = tree.getHexRoot();
	const leaf     = keccak256(ethers.utils.getAddress(addresses[0]));
	const hexleaf  = buf2hex(leaf);
	const hexproof = tree.getProof(leaf).map(x => buf2hex(x.data));
	if(tree.verify(hexproof, hexleaf, hexroot)) {
		const date = new Date();
		const date_created = `${date.getFullYear()}_${date.getMonth()}_${date.getTime()}`
		fs.writeFileSync(`${output_folder}/${date_created}_proofs.json`, JSON.stringify({ root: hexroot, leaves: leaves_by_addr }, null, 2));
		console.log(`Created file: ${output_folder}/${date_created}_proofs.json`)
	} else {
		console.log('RIP your not suppose to get here. GL');
	}
}

function formatAddresses(addresses) {
	// Ensure a list exists
	if(addresses.length == 0) {
		throw new Error("You have no wallet address's in the setup.js file.");
	}

	// Remove white space and lowercase all address's
	const formatted_addresses = addresses.map(addr => addr.toLowerCase().trim());

	// Ensure all address are ETH address's
	for(const address of formatted_addresses) {
		if(!ethers.utils.isAddress(address)) {
			throw new Error(`Is not a valid ETH address: ${address}`);
		}
	}

	return formatted_addresses;
}

main().catch(err => console.error(err.message));