package payout

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
)

// priv is the Moonbug Ed25519 private key used to sign completion claims.
// It is populated once at package init from MOONBUG_PAYOUT_KEY, or an
// ephemeral key is generated when the variable is unset.
var priv ed25519.PrivateKey

func init() {
	const envKey = "MOONBUG_PAYOUT_KEY"
	if v := os.Getenv(envKey); v != "" {
		raw, err := base64.StdEncoding.DecodeString(v)
		if err != nil {
			fmt.Printf("[WARN payout] MOONBUG_PAYOUT_KEY is not valid base64; generating ephemeral key: %v\n", err)
			priv, _, _ = ed25519.GenerateKey(rand.Reader)
			return
		}
		if len(raw) != ed25519.PrivateKeySize {
			fmt.Printf("[WARN payout] MOONBUG_PAYOUT_KEY has wrong length (%d); generating ephemeral key\n", len(raw))
			priv, _, _ = ed25519.GenerateKey(rand.Reader)
			return
		}
		priv = ed25519.PrivateKey(raw)
		return
	}
	priv, _, _ = ed25519.GenerateKey(rand.Reader)
	fmt.Println("[WARN payout] MOONBUG_PAYOUT_KEY not set; generated ephemeral Ed25519 key (signatures will not survive restart)")
}

// PublicKeyBase64 returns the base64-encoded Ed25519 public key so advertisers
// can verify completion signatures via the GET /api/public-key endpoint.
func PublicKeyBase64() string {
	return base64.StdEncoding.EncodeToString(priv.Public().(ed25519.PublicKey))
}

// CompletionClaim is a Moonbug-signed proof that a user completed an ad action.
type CompletionClaim struct {
	UserID    string `json:"user_id"`
	CampaignID string `json:"campaign_id"`
	Nonce     string `json:"nonce"`
	IssuedAt  int64  `json:"issued_at"`
}

// SignCompletion marshals the claim to canonical JSON, signs it with the
// Moonbug private key, and returns the base64-encoded signature.
func SignCompletion(claim CompletionClaim) (string, error) {
	msg, err := json.Marshal(claim)
	if err != nil {
		return "", fmt.Errorf("marshal claim: %w", err)
	}
	sig := ed25519.Sign(priv, msg)
	return base64.StdEncoding.EncodeToString(sig), nil
}

// VerifyCompletion re-marshals the claim and verifies the base64-encoded
// signature against the Moonbug public key.
func VerifyCompletion(claim CompletionClaim, signatureBase64 string) bool {
	msg, err := json.Marshal(claim)
	if err != nil {
		return false
	}
	sig, err := base64.StdEncoding.DecodeString(signatureBase64)
	if err != nil {
		return false
	}
	return ed25519.Verify(priv.Public().(ed25519.PublicKey), msg, sig)
}
