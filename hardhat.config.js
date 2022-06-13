const { deployContract } = require("ethereum-waffle")

require("dotenv").config()

require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy") //creates many new tasks including deploy task, use it instead of deploy.js script, create deploy folder
// do yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers to overwrite nomic labs hardhat ethers by hardhat-deploy ethers
//when u run yarn hardhat deployContract, all scripts in deploy folder will run one after other, so number them

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const RINKEBY_URL = process.env.RINKEBY_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
module.exports = {
    // solidity: "0.8.8", as we want more versions to compile
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6, //useful for verify while deploying
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
        currency: "USD",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            //one of the named accounts is named deployer
            default: 0, //by default it is zeroth position in accounts array
            //    4: 1, //to say in rinkeby, it is at 1
            //   31337: 1, //to say in hardhat it is at 1 and so on
        },
        user: {
            default: 1,
        },
    },
}
