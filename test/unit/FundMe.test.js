//unit tests are used to check small parts of our code using localhost or forked hardhat, staging tests on a testnet,
//usually last step before deploying
//using hardhat-deploy to test as if both the deploy files have run
//const { inputToConfig } = require("@ethereum-waffle/compiler")
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//we wanna run unit tests only on the development chain
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") //converts 1 ether to 1e18, parse utils of ethers doc is useful for unit conversion

          beforeEach(async function () {
              //deploy fundme contract using hardhat-deploy
              deployer = (await getNamedAccounts()).deployer
              //or const accounts = await.getSigners()  //to fetch accounts in networks from hardhat config, if for hardhat
              //gives a list of test accounts
              //const accountZero = accounts[0]
              await deployments.fixture(["all"])
              //fixture function runs all scripts having tag it has for parameter, so here it runs both our scripts
              fundMe = await ethers.getContract("FundMe", deployer) //getcontract gives most recent deployment for fundme contract
              //these contracts will be deployed from deployer account, for transactions
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          //for constructor
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              it("Fails if u dont send enough eth", async function () {
                  //await fundMe.fund()  //if u dont pass any value, test breaks and gives error u need to spend more,
                  // but its what we wnant, for that we use waffle testing, where we can expect for function to be reverted
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  )
              })
              //to check if map works fine
              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue }) //1 eth passed to defo gonna pass as 1 eth> 1 usd
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  ) //here response=bigno. version of fund amount by deployer
                  assert.equal(response.toString(), sendValue.toString()) //response must be equal to amount we sent
              }) //can run only using yarn hardhat test --grep "amount funded"
              //checking if funder address added to array
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              //to successfully check withdrawl let us add money to withdraw before testing using it by beforeeach
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw eth from a single funder", async function () {
                  //do 3 things- arrange, act and assert

                  //arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployingBalance =
                      await fundMe.provider.getBalance(deployer)

                  //act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  //on right u see red dot u can make a breakpoint, when u debug a code it runs till the breakpoint and
                  //gives u variables with their infos upto breakpoint
                  //click run & debug icon on right and select javascript debug terminal, type yarn hardhat test on new terminal, stops till brkpt, u see variables
                  //on right and in debug console search variables u like to get info abt, u can find gasused and gas price
                  //associated with transactionReceipt, multiplying both u can get gas cost needed later
                  //can also find in documentation
                  //another tool u can use if console.log for solidity by hardhat, check doc, here u can import it in solidity contract
                  //and write console.logs in functions, when they execute in test etc, they print those logs like js
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //can also use ether.provider
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployingBalance)
                          .toString()
                  ) //because working with bigno. we cant simply use +, see bigno doc
                  //bec calling withdraw() function is gonna cost gas, we add gas cost as well to ending so we get accurate result
              })
              it("allows us to withdraw from multiple getFunder", async function () {
                  const accounts = await ethers.getSigners() //gives a bunch o accounts
                  //arrange
                  for (let i = 1; i < 6; i++) {
                      //i!=0 as zeroth account is of deployer already as it has funded once
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) //bec if we dont connect, deployer gets charged everytime
                      //as initially it is the one connected to fundme, so we create new fundme objects with these accounts b4 calling fund()
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployingBalance =
                      await fundMe.provider.getBalance(deployer)

                  //act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //can also use ether.provider
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployingBalance)
                          .toString()
                  )

                  //make sure getFunder array is reset successfully, should throw error if we try to access any index eg 0
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  //make sure all the accounts have funded amount 0 in map
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner") //to check if precise error is reverteds
              })

              it("cheaperWithdraw testing...", async function () {
                  const accounts = await ethers.getSigners() //gives a bunch o accounts
                  //arrange
                  for (let i = 1; i < 6; i++) {
                      //i!=0 as zeroth account is of deployer already as it has funded once
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) //bec if we dont connect, deployer gets charged everytime
                      //as initially it is the one connected to fundme, so we create new fundme objects with these accounts b4 calling fund()
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployingBalance =
                      await fundMe.provider.getBalance(deployer)

                  //act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //can also use ether.provider
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployingBalance)
                          .toString()
                  )

                  //make sure getFunder array is reset successfully, should throw error if we try to access any index eg 0
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  //make sure all the accounts have funded amount 0 in map
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          //here gas will increase as we are working with storage array
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("cheaperWithdraw eth from a single funder", async function () {
                  //do 3 things- arrange, act and assert

                  //arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployingBalance =
                      await fundMe.provider.getBalance(deployer)

                  //act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  //on right u see red dot u can make a breakpoint, when u debug a code it runs till the breakpoint and
                  //gives u variables with their infos upto breakpoint
                  //click run & debug icon on right and select javascript debug terminal, type yarn hardhat test on new terminal, stops till brkpt, u see variables
                  //on right and in debug console search variables u like to get info abt, u can find gasused and gas price
                  //associated with transactionReceipt, multiplying both u can get gas cost needed later
                  //can also find in documentation
                  //another tool u can use if console.log for solidity by hardhat, check doc, here u can import it in solidity contract
                  //and write console.logs in functions, when they execute in test etc, they print those logs like js
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //can also use ether.provider
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployingBalance)
                          .toString()
                  ) //because working with bigno. we cant simply use +, see bigno doc
                  //bec calling withdraw() function is gonna cost gas, we add gas cost as well to ending so we get accurate result
              })
          })
      })
