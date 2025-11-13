import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

class NFTService {
  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
      'confirmed'
    );

    // Initialize platform wallet keypair from private key
    // NOTE: In production, this should be stored securely (e.g., AWS Secrets Manager, KMS)
    if (process.env.PLATFORM_WALLET_PRIVATE_KEY) {
      try {
        const privateKeyArray = bs58.decode(process.env.PLATFORM_WALLET_PRIVATE_KEY);
        this.platformWallet = Keypair.fromSecretKey(privateKeyArray);
        console.log('✅ Platform wallet loaded from environment');
      } catch (error) {
        console.error('Failed to load platform wallet:', error);
        // Fallback: generate a new keypair for development
        this.platformWallet = Keypair.generate();
        console.warn('⚠️  Using generated keypair for NFT minting. Set PLATFORM_WALLET_PRIVATE_KEY in production!');
      }
    } else {
      // Development: generate temporary keypair
      this.platformWallet = Keypair.generate();
      console.warn('⚠️  Using generated keypair for NFT minting. Set PLATFORM_WALLET_PRIVATE_KEY in production!');
    }

    // Initialize Metaplex instance (without bundlrStorage - using default storage)
    this.metaplex = Metaplex.make(this.connection)
      .use(keypairIdentity(this.platformWallet));

    console.log('✅ NFT Service initialized with wallet:', this.platformWallet.publicKey.toBase58());
    console.log('   Network:', process.env.SOLANA_RPC_URL ? 'Custom RPC' : 'Devnet');
  }

  /**
   * Generate metadata for Wexel NFT Miner
   * @param {Object} params - NFT parameters
   * @returns {Object} metadata
   */
  generateMetadata(params) {
    const { investmentId, poolName, amount, duration, takaraMultiplier, userWallet } = params;

    return {
      name: `Takara Wexel Miner #${investmentId.substring(0, 8)}`,
      symbol: 'WEXEL',
      description: `Takara DeFi Platform - Wexel NFT Miner representing a ${amount} USDT investment in the ${poolName} pool (${duration} months, ${takaraMultiplier}x TAKARA multiplier). This NFT validates ownership of the investment and mining rights.`,
      image: this.generateNFTImageUrl(params),
      attributes: [
        {
          trait_type: 'Investment Amount',
          value: `${amount} USDT`,
        },
        {
          trait_type: 'Pool',
          value: poolName,
        },
        {
          trait_type: 'Duration',
          value: `${duration} Months`,
        },
        {
          trait_type: 'TAKARA Multiplier',
          value: `${takaraMultiplier}x`,
        },
        {
          trait_type: 'Mining Power',
          value: this.calculateMiningPower(amount, takaraMultiplier),
        },
        {
          trait_type: 'Rarity',
          value: this.getRarity(amount, duration),
        },
        {
          trait_type: 'Investment ID',
          value: investmentId,
        },
      ],
      properties: {
        files: [
          {
            uri: this.generateNFTImageUrl(params),
            type: 'image/png',
          },
        ],
        category: 'image',
        creators: [
          {
            address: this.platformWallet.publicKey.toBase58(),
            share: 100,
          },
        ],
      },
      external_url: `https://takara.defi/investments/${investmentId}`,
    };
  }

  /**
   * Generate NFT image URL (placeholder or dynamic generation)
   * @param {Object} params
   * @returns {string} image URL
   */
  generateNFTImageUrl(params) {
    const { poolName, takaraMultiplier, duration } = params;

    // Option 1: Use a static placeholder with query params for uniqueness
    const baseUrl = process.env.NFT_IMAGE_BASE_URL || 'https://via.placeholder.com';
    const color = this.getColorByMultiplier(takaraMultiplier);
    return `${baseUrl}/500x500/${color}/D4AF37?text=Wexel+Miner+${duration}M`;

    // Option 2: In production, use a service like:
    // - AWS S3 with pre-generated images
    // - IPFS with dynamic generation
    // - Cloudinary/Imgix for on-the-fly generation
  }

  /**
   * Get color code by TAKARA multiplier
   */
  getColorByMultiplier(multiplier) {
    if (multiplier === '1') return '0A2F23'; // Dark green for 1x
    if (multiplier === '1.5') return '1A4D3A'; // Medium green for 1.5x
    if (multiplier === '2') return 'D4AF37'; // Gold for 2x
    return '0A2F23';
  }

  /**
   * Calculate mining power based on investment
   */
  calculateMiningPower(amount, multiplier) {
    const power = parseFloat(amount) * parseFloat(multiplier);
    return power.toFixed(2);
  }

  /**
   * Determine rarity based on investment and duration
   */
  getRarity(amount, duration) {
    const value = parseFloat(amount);
    if (value >= 10000) return 'Legendary';
    if (value >= 5000) return 'Epic';
    if (value >= 1000) return 'Rare';
    if (value >= 500) return 'Uncommon';
    return 'Common';
  }

  /**
   * Mint Wexel NFT for an investment
   * @param {Object} params - Minting parameters
   * @returns {Promise<Object>} NFT data
   */
  async mintWexelNFT(params) {
    try {
      const { userWalletAddress, investmentData } = params;

      console.log('🎨 Starting NFT minting for investment:', investmentData.id);

      // Generate metadata
      const metadata = this.generateMetadata({
        investmentId: investmentData.id,
        poolName: investmentData.poolName,
        amount: investmentData.amount,
        duration: investmentData.duration,
        takaraMultiplier: investmentData.takaraMultiplier,
        userWallet: userWalletAddress,
      });

      console.log('📝 Generated metadata:', JSON.stringify(metadata, null, 2));

      // Upload metadata to Arweave/IPFS via Bundlr
      const { uri } = await this.metaplex.nfts().uploadMetadata(metadata);
      console.log('📤 Metadata uploaded to:', uri);

      // Create the NFT
      const { nft } = await this.metaplex.nfts().create({
        uri,
        name: metadata.name,
        symbol: metadata.symbol,
        sellerFeeBasisPoints: 500, // 5% royalty on secondary sales
        creators: [
          {
            address: this.platformWallet.publicKey,
            share: 100,
          },
        ],
        collection: null, // Can be set to a collection NFT if needed
        uses: null,
        isMutable: false, // Immutable NFT
        maxSupply: 1, // Only one copy
      });

      console.log('✅ NFT minted successfully!');
      console.log('   Mint Address:', nft.address.toBase58());
      console.log('   Metadata URI:', nft.uri);

      // Transfer NFT to user
      await this.transferNFT(nft.address, userWalletAddress);

      return {
        mintAddress: nft.address.toBase58(),
        metadata: nft.json,
        metadataUri: nft.uri,
        name: nft.name,
        symbol: nft.symbol,
        imageUrl: metadata.image,
      };
    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      throw new Error(`NFT minting failed: ${error.message}`);
    }
  }

  /**
   * Transfer NFT to user's wallet
   * @param {PublicKey} mintAddress - NFT mint address
   * @param {string} toWalletAddress - Recipient wallet address
   */
  async transferNFT(mintAddress, toWalletAddress) {
    try {
      console.log('🔄 Transferring NFT to user:', toWalletAddress);

      const toPublicKey = new PublicKey(toWalletAddress);

      await this.metaplex.nfts().transfer({
        nftOrSft: { address: mintAddress, tokenStandard: 0 }, // 0 = NonFungible
        toOwner: toPublicKey,
      });

      console.log('✅ NFT transferred successfully to:', toWalletAddress);
    } catch (error) {
      console.error('❌ NFT transfer failed:', error);
      // Don't throw here - NFT is minted but needs manual transfer
      console.warn('⚠️  NFT was minted but transfer failed. Manual transfer required.');
    }
  }

  /**
   * Get NFT details by mint address
   * @param {string} mintAddress
   * @returns {Promise<Object>}
   */
  async getNFTDetails(mintAddress) {
    try {
      const nft = await this.metaplex.nfts().findByMint({
        mintAddress: new PublicKey(mintAddress),
      });

      return {
        address: nft.address.toBase58(),
        name: nft.name,
        symbol: nft.symbol,
        uri: nft.uri,
        metadata: nft.json,
        creators: nft.creators,
        collection: nft.collection,
      };
    } catch (error) {
      console.error('Failed to fetch NFT details:', error);
      throw error;
    }
  }

  /**
   * Verify NFT ownership
   * @param {string} mintAddress
   * @param {string} walletAddress
   * @returns {Promise<boolean>}
   */
  async verifyNFTOwnership(mintAddress, walletAddress) {
    try {
      const nft = await this.metaplex.nfts().findByMint({
        mintAddress: new PublicKey(mintAddress),
      });

      const owner = nft.token.ownerAddress.toBase58();
      return owner === walletAddress;
    } catch (error) {
      console.error('Failed to verify NFT ownership:', error);
      return false;
    }
  }
}

// Export singleton instance
const nftService = new NFTService();
export default nftService;
