//so we can interact with our contract via this script

const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Withdrawing...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

/**
     * notes for scripts in package.json we added
     * "scripts": {
    "test" : "yarn hardhat test", now only need to write yarn test
    "test:staging": "yarn hardhat test --network rinkeby",  yarn test:staging
    "lint": "yarn solhint  contracts/*.sol",   yarn lint (lint all our .sol files)
    "lint:fix": "yarn solhint 'contracts/*.sol --fix", yarn lint:fix  (fixes our problems found in lint)
    "format": "yarn prettier --write .",   yarn format  (beautfies mistakes in formatting)
    "coverage" : "yarn hardhat coverage" yarn coverage 
  }

  u can beautify readme using best readme templates github
     */
