const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer,seller,inspector,lender;
    let realEstate, escrow;

    beforeEach(async()=>{
        [buyer,seller,inspector,lender] = await ethers.getSigners()

        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        await transaction.wait();

        const Escrow = await ethers.getContractFactory('Escrow');
        escrow =await Escrow.deploy(realEstate.address,seller.address,inspector.address,lender.address)

        transaction = await realEstate.connect(seller).approve(escrow.address, 1);
        await transaction.wait();

        transaction = await escrow.connect(seller).list(1,buyer.address, tokens(10), tokens(5));
        await transaction.wait();
    })

    describe('Deployment',()=>{
        it('returns NFT Address',async()=>{
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address);
        })
    
        it('returns Seller',async()=>{
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address);
        })
    
        it('returns Inspector',async()=>{
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        })
    
        it('returns Lender',async()=>{
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        })
    })
    describe('Listing',()=>{
        
    })
    describe('Deposits',()=>{
        it('Updates Contract Balance',async()=>{
            const transaction = await escrow.connect(buyer).deopsitEarnest(1,{ value:tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })
    describe('Inspection',()=>{
        it('Updates Inspector Status',async()=>{
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1,true);
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })
    describe('Approval',()=>{
        it('updates Inspector Status',async()=>{
            let transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait()

            expect(await escrow.approval(1,buyer.address)).to.be.equal(true);
            expect(await escrow.approval(1,seller.address)).to.be.equal(true);
            expect(await escrow.approval(1,lender.address)).to.be.equal(true);
        })
    })
    describe('Sale',async()=>{
        it('Updates Inspector Status',async()=>{
            
            let transaction = await escrow.connect(buyer).deopsitEarnest(1,{value:tokens(5)});
            await transaction.wait()

            transaction = await escrow.connect(inspector).updateInspectionStatus(1,true);
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait()

            await lender.sendTransaction({ to:escrow.address, value:tokens(5)})

            transaction = await escrow.connect(seller).finalizeSale(1);
            await transaction.wait();
        })
        it('Updates Balance',async()=>{
            expect(await escrow.getBalance()).to.be.equal(0);
        })
    })
})