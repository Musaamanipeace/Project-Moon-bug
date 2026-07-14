package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "moonbug-dev-secret-change-me"))

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

// Claims is the JWT payload for an authenticated session.
type Claims struct {
	UserID    string `json:"uid"`
	SessionID string `json:"sid"`
	jwt.RegisteredClaims
}

// GenerateToken signs a session JWT valid for 30 days.
func GenerateToken(userID, sessionID string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:    userID,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(30 * 24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken validates and returns the claims of a JWT.
func ParseToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}

// HashPassword returns a bcrypt hash of the password.
func HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// CheckPassword verifies a bcrypt password hash.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// GenerateOTP produces a cryptographically random 6-digit code.
func GenerateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", n.Int64())
}

// HashOTP returns a stable hash of an OTP code for at-rest storage.
func HashOTP(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

// SendOTPEmail delivers the OTP via SMTP. In non-production environments
// where SMTP is not configured, the code is written to the server log so
// the passwordless flow remains fully usable locally.
func SendOTPEmail(email, code string) error {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		if os.Getenv("APP_ENV") != "production" {
			fmt.Printf("[DEV OTP] %s -> %s\n", email, code)
		}
		return nil
	}
	port := getEnv("SMTP_PORT", "587")
	from := getEnv("SMTP_FROM", "noreply@moonbug.app")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	subject := "Your Moonbug lunar access code"
	body := fmt.Sprintf(
		"Hello stargazer,\n\nYour Moonbug verification code is: %s\n\nIt expires in 5 minutes.\n\n— The Moonbug Team",
		code,
	)
	msg := buildMail(from, email, subject, body)

	addr := host + ":" + port
	var auth smtp.Auth
	if user != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}
	return smtp.SendMail(addr, auth, from, []string{email}, msg)
}

func buildMail(from, to, subject, body string) []byte {
	var b strings.Builder
	b.WriteString("From: " + from + "\r\n")
	b.WriteString("To: " + to + "\r\n")
	b.WriteString("Subject: " + subject + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("\r\n")
	b.WriteString(body)
	return []byte(b.String())
}
