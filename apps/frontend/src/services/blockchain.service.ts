// frontend/src/services/blockchain.service.ts
import { ethers } from 'ethers';

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.initialize();
  }

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();
      
      // Cargar contrato
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
      const contractABI: any[] = []; // Aquí iría el ABI del contrato
      this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
    }
  }

  async getNetwork() {
    if (!this.provider) return null;
    return this.provider.getNetwork();
  }

  async getAccount() {
    if (!this.signer) return null;
    return this.signer.getAddress();
  }

  async getBalance(address: string) {
    if (!this.provider) return '0';
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to: string, amount: string, data?: string) {
    if (!this.signer) throw new Error('No signer available');
    
    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
      data: data || '0x',
    });
    
    return tx.wait();
  }

  async getGasPrice() {
    if (!this.provider) return '0';
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    return ethers.formatUnits(gasPrice, 'gwei');
  }

  async estimateGas(tx: any) {
    if (!this.provider) return '0';
    const gas = await this.provider.estimateGas(tx);
    return gas.toString();
  }

  async getTransactionReceipt(txHash: string) {
    if (!this.provider) return null;
    return this.provider.getTransactionReceipt(txHash);
  }

  async getTransactionConfirmations(txHash: string) {
    const receipt = await this.getTransactionReceipt(txHash);
    if (!receipt) return 0;
    
    const currentBlock = await this.provider?.getBlockNumber() || 0;
    return currentBlock - receipt.blockNumber + 1;
  }

  async callContract(method: string, params: any[]) {
    if (!this.contract) throw new Error('Contract not initialized');
    return this.contract[method](...params);
  }

  async sendContractTransaction(method: string, params: any[]) {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract[method](...params);
    return tx.wait();
  }

  // Métodos específicos para la votación
  async castVote(sessionId: number, voteHash: string, proof: any, signature: string) {
    return this.sendContractTransaction('castVote', [
      sessionId,
      voteHash,
      proof,
      signature,
    ]);
  }

  async verifyVote(sessionId: number, voteHash: string) {
    return this.callContract('verifyVote', [sessionId, voteHash]);
  }

  async getVoteCount(sessionId: number) {
    return this.callContract('getVoteCount', [sessionId]);
  }

  async getSessionStats(sessionId: number) {
    return this.callContract('getSessionStats', [sessionId]);
  }

  async getCandidates(sessionId: number) {
    return this.callContract('getCandidates', [sessionId]);
  }

  async getResults(sessionId: number) {
    return this.callContract('getResults', [sessionId]);
  }
}

export const blockchainService = new BlockchainService();
export default BlockchainService;