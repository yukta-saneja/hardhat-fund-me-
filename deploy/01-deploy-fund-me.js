//no need for main and calling main, as hardhat runs a function we will specify and mark as default to run

/*function deployFunc(hre) {
    console.log("Hi")
}

module.exports.default = deployFunc


could use this but we want to use anonymous async fn
*/

//it is same as above syntax
/*module.exports = async (hre) => {
    const {getNamedAccounts, deployment} =hre //fetching items in {} from hre which is just about hardhat itself
    //same as hre.getNamedAccounts() and so on
}
*/
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network, deployments } = require("hardhat")
const { verify } = require("../utils/verify")

/*
same as 
const helperConfig= require("../helper-hardhat-config")
const networkConfig= helperConfig.networkConfig
*/

//same as-> //called as syntactical sugar in js -?
//async nameless function using arrow notation and we are default exporting it using module.exports
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments //pulling 2 fns out of deployment
    const { deployer } = await getNamedAccounts() //pulling deployer account from getnamedaccounts function
    //in hardhat config u can name accounts rather than putting pvt keys in a accounts list above to easily recognise them
    const chainId = network.config.chainId //to fetch chainid of our chain

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress //because we will need to update it

    //in case localhost, run mock
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") //or get get function above in {} getting from development
        //this get function gets the most recently deployed for that contract
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    //but hardhat localchain wont even have this ethusdpricefeed, so use mocks, use deploy mock script
    //if the contrcact doesnt exist, we deploy a minimal verision for our local testing-> mocking

    //we test our contract by deploying it on localhost rather than testnet as it is slow
    //but hardhat destroys after running scripts once, so wont retain the priceconvertor, and it contains eth to usd acc for rinkeby as of now
    //so we use mocks (creating simulation of priceconvertor) for running on localhost
    //when going for localhost or hardhat network we want to use a mock

    //but we also want to be able to run our code on various chains w/o having to change code everytime, therefore
    //we parameterize the pricefeed using fundme constructor, s.t. eth usd converter address for various chains in put as input while calling it
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        //here we dont need contract factory, we directly use deploy function
        from: deployer,
        args: args, //put pricefeed address, to get address for various chains, use aave's format,
        //use helper-hardhat-config which gives various variables for various chains,
        log: true, //some custom logging to avoid console.logs
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // auto verification for non local chains
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //verify code is in utils (utility) as it is repeatable in verious projects
        await verify(fundMe.address, args)
    }

    log("______________________________________________")
}
module.exports.tags = ["all", "fundme"]

//yarn hardhat node will automatically come with a node having all our code deployed on it as we r using hardhat deploy
