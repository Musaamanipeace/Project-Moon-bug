package test

import (
	"testing"

	"moonbug/internal/auth"
	"moonbug/internal/lunar"
	"moonbug/internal/store"
)

func TestLunar_PhaseBoundaries(t *testing.T) {
	cases := []struct {
		age    float64
		want   string
		emoji  string
		illum  float64
	}{
		{0, "New Moon", "🌑", 0},
		{lunar.SynodicMonth * 0.25, "First Quarter", "🌓", 50},
		{lunar.SynodicMonth * 0.5, "Full Moon", "🌕", 100},
		{lunar.SynodicMonth * 0.75, "Last Quarter", "🌗", 50},
	}
	for _, c := range cases {
		if got := lunar.PhaseName(c.age); got != c.want {
			t.Errorf("PhaseName(%v)=%q want %q", c.age, got, c.want)
		}
		if got := lunar.PhaseEmoji(c.age); got != c.emoji {
			t.Errorf("PhaseEmoji(%v)=%q want %q", c.age, got, c.emoji)
		}
		if got := lunar.Illumination(c.age); got < c.illum-0.01 || got > c.illum+0.01 {
			t.Errorf("Illumination(%v)=%v want ~%v", c.age, got, c.illum)
		}
	}
}

func TestLunar_AgeWraps(t *testing.T) {
	age := lunar.Age(lunar.RefNewMoonTime())
	if age < 0 || age >= lunar.SynodicMonth {
		t.Errorf("Age at reference new moon out of range: %v", age)
	}
}

func TestAuth_PasswordRoundTrip(t *testing.T) {
	hash, err := auth.HashPassword("s3cret-password")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if auth.CheckPassword(hash, "s3cret-password") != true {
		t.Error("expected valid password to verify")
	}
	if auth.CheckPassword(hash, "wrong") == true {
		t.Error("expected wrong password to fail")
	}
}

func TestAuth_OTPRandomAndHash(t *testing.T) {
	a := auth.GenerateOTP()
	b := auth.GenerateOTP()
	if len(a) != 6 || len(b) != 6 {
		t.Errorf("OTP must be 6 digits, got %q %q", a, b)
	}
	if a == b {
		t.Error("two OTPs should not be identical")
	}
	if auth.HashOTP("123456") != auth.HashOTP("123456") {
		t.Error("hash must be deterministic")
	}
	if auth.HashOTP("123456") == auth.HashOTP("123457") {
		t.Error("different codes must hash differently")
	}
}

func TestStore_ComputeStreaksEmpty(t *testing.T) {
	// No dates -> zero streaks, must not panic.
	cur, longest := store.ComputeStreaksFromDates(nil)
	if cur != 0 || longest != 0 {
		t.Errorf("empty dates: got cur=%d longest=%d, want 0 0", cur, longest)
	}
}

func TestStore_ComputeStreaksConsecutive(t *testing.T) {
	dates := []string{"2026-07-15", "2026-07-16", "2026-07-17", "2026-07-19"}
	cur, longest := store.ComputeStreaksFromDates(dates)
	if longest != 3 {
		t.Errorf("longest: got %d want 3", longest)
	}
	// Today (2026-07-19) is in the set, yesterday (2026-07-18) is not -> current 1.
	if cur != 1 {
		t.Errorf("current: got %d want 1", cur)
	}
}

func TestStore_ComputeStreaksBrokenToday(t *testing.T) {
	// No completion today or yesterday -> current streak is 0.
	dates := []string{"2026-07-10", "2026-07-11", "2026-07-12"}
	cur, longest := store.ComputeStreaksFromDates(dates)
	if cur != 0 {
		t.Errorf("current: got %d want 0", cur)
	}
	if longest != 3 {
		t.Errorf("longest: got %d want 3", longest)
	}
}
