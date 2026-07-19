package lunar

import (
	"math"
	"time"
)

const (
	SynodicMonth = 29.530588853
	RefNewMoon   = 947166000 // Date.UTC(2000, 0, 6, 18, 14, 0) in seconds
)

// PhaseName returns the canonical moon phase for a given lunar age in days.
func PhaseName(age float64) string {
	pct := age / SynodicMonth
	switch {
	case pct < 0.03 || pct >= 0.97:
		return "New Moon"
	case pct < 0.22:
		return "Waxing Crescent"
	case pct < 0.28:
		return "First Quarter"
	case pct < 0.47:
		return "Waxing Gibbous"
	case pct < 0.53:
		return "Full Moon"
	case pct < 0.72:
		return "Waning Gibbous"
	case pct < 0.78:
		return "Last Quarter"
	default:
		return "Waning Crescent"
	}
}

func PhaseEmoji(age float64) string {
	pct := age / SynodicMonth
	switch {
	case pct < 0.03 || pct >= 0.97:
		return "🌑"
	case pct < 0.22:
		return "🌒"
	case pct < 0.28:
		return "🌓"
	case pct < 0.47:
		return "🌔"
	case pct < 0.53:
		return "🌕"
	case pct < 0.72:
		return "🌖"
	case pct < 0.78:
		return "🌗"
	default:
		return "🌘"
	}
}

func PhaseCode(age float64) string {
	pct := age / SynodicMonth
	switch {
	case pct < 0.03 || pct >= 0.97:
		return "new-moon"
	case pct < 0.22:
		return "waxing-crescent"
	case pct < 0.28:
		return "first-quarter"
	case pct < 0.47:
		return "waxing-gibbous"
	case pct < 0.53:
		return "full-moon"
	case pct < 0.72:
		return "waning-gibbous"
	case pct < 0.78:
		return "last-quarter"
	default:
		return "waning-crescent"
	}
}

// RefNewMoonTime returns the reference new moon as a time.Time.
func RefNewMoonTime() time.Time {
	return time.Unix(RefNewMoon, 0).UTC()
}
func Age(t time.Time) float64 {
	secs := float64(t.Unix())
	days := (secs - float64(RefNewMoon)) / 86400.0
	age := math.Mod(days, SynodicMonth)
	if age < 0 {
		age += SynodicMonth
	}
	return age
}

// Illumination returns the percentage of the moon illuminated (0-100).
func Illumination(age float64) float64 {
	angle := (age / SynodicMonth) * 2 * math.Pi
	return ((1 - math.Cos(angle)) / 2) * 100
}

// DaysUntilNext returns the number of days until the next target phase.
// target 0 = New Moon, 0.5 = Full Moon (fraction of synodic month).
func DaysUntilNext(age, target float64) float64 {
	pct := age / SynodicMonth
	delta := target - pct
	if delta < 0 {
		delta += 1
	}
	return delta * SynodicMonth
}
