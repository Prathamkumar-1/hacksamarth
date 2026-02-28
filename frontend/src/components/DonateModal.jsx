import { useState } from "react";
import { donate } from "../utils/web3";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const DonateModal = ({ project, onClose, onSuccess }) => {
  const { wallet, connectWallet } = useAuth();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const quickAmounts = ["0.01", "0.05", "0.1", "0.5"];

  const handleDonate = async () => {
    if (!wallet.connected) {
      await connectWallet();
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const result = await donate(project.onChainId, amount, message);
      setTxHash(result.txHash);
      toast.success("Donation successful! 🎉");
      onSuccess?.(result);
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: 24,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", overflow: "hidden",
          animation: "fadeUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 24px 20px",
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Donate to Project
              </div>
              <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: 24, fontWeight: 700 }}>
                {project.title}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: "var(--surface3)", border: "none", color: "var(--text-dim)",
              width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16,
            }}>×</button>
          </div>
        </div>

        {txHash ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 28, marginBottom: 12 }}>
              Donation Confirmed!
            </h3>
            <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>
              Your contribution has been recorded on the blockchain.
            </p>
            <div style={{
              background: "var(--surface2)", borderRadius: 10, padding: "12px 16px",
              fontFamily: "DM Mono", fontSize: 12, color: "var(--emerald)", wordBreak: "break-all",
              marginBottom: 20,
            }}>
              {txHash}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >View on Etherscan ↗</a>
              <button className="btn btn-primary btn-sm" onClick={onClose} style={{ flex: 1 }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {/* Wallet status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: wallet.connected ? "rgba(16,185,129,0.08)" : "var(--surface2)",
              border: `1px solid ${wallet.connected ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
              borderRadius: 10, padding: "12px 16px", marginBottom: 20,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: wallet.connected ? "var(--emerald)" : "var(--text-muted)",
              }} />
              <span style={{ fontSize: 13, color: "var(--text-dim)", flex: 1 }}>
                {wallet.connected ? wallet.address : "Wallet not connected"}
              </span>
              {wallet.connected && (
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}>
                  {parseFloat(wallet.balance).toFixed(4)} ETH
                </span>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Quick Select
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    style={{
                      background: amount === a ? "var(--emerald-glow)" : "var(--surface2)",
                      border: `1px solid ${amount === a ? "var(--emerald)" : "var(--border)"}`,
                      color: amount === a ? "var(--emerald)" : "var(--text-dim)",
                      borderRadius: 8, padding: "8px 0", fontSize: 13, cursor: "pointer",
                      fontFamily: "DM Mono", transition: "all 0.2s",
                    }}
                  >{a} ETH</button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Custom Amount (ETH)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="0.000"
                value={amount}
                min="0"
                step="0.001"
                onChange={e => setAmount(e.target.value)}
                style={{ fontFamily: "DM Mono" }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Message (Optional)
              </label>
              <textarea
                className="input-field"
                placeholder="Leave a message of support..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{ resize: "none" }}
              />
            </div>

            {/* Fee notice */}
            {amount && (
              <div style={{
                background: "var(--surface2)", borderRadius: 10, padding: "12px 16px",
                marginBottom: 20, fontSize: 13, color: "var(--text-dim)",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>Platform fee (2%)</span>
                <span className="mono" style={{ color: "var(--text)" }}>
                  {(parseFloat(amount) * 0.02).toFixed(6)} ETH
                </span>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px" }}
              onClick={handleDonate}
              disabled={loading || !amount}
            >
              {loading ? (
                <span>⟳ Confirming Transaction...</span>
              ) : !wallet.connected ? (
                <span>Connect Wallet to Donate</span>
              ) : (
                <span>Donate {amount || "0"} ETH →</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonateModal;
