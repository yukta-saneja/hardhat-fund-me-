const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments //pulling 2 fns out of deployment
    const { deployer } = await getNamedAccounts() //pulling deployer account from getnamedaccounts function
    //in hardhat config u can name accounts rather than putting pvt keys in a accounts list above to easily recognise them
    // const chainId = network.config.chainId

    if (
        developmentChains.includes(
            network.name
        ) /* checks if array contains something, i.e. we checking if the nw we deployed to
    is one of those in developmentchains array,,, we could also simply check if(chainId=="31337/") */
    ) {
        log("Local network detected: Deploying mocks...")
        await deploy("MockV3Aggregator", {
            //this contract is in node modules->chainlink-> src-> v0.6->tests->mockv3agg
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, //to not need to write console.log instead only log and give logs of where deployed and what gas
            args: [DECIMALS, INITIAL_ANSWER], //needed for this contracts constructor
        })
        log("Mocks deployed!")
        log("______________________________________________________________") //just for formatting funzies :)
    }
}

module.exports.tags = ["all", "mocks"]
//u can deploy mock deployment solely using yarn hardhat deploy --tags mocks
