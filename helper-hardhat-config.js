const networkConfig = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e", //fetched from chainlink->evm->ethereum data feed->rinkeby eth/usd
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945", //fetched from polygon data feed in chainlink.com
    },
}

const developmentChains = ["hardhat", "localhost"] //to see which local nw we have
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000 //2000 with 8 decimals, this is what is pricefeed starting at, so we set what is pricefeed

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
