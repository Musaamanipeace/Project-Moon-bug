package store

import (
	"context"
	"encoding/json"

	"moonbug/internal/db"
)

// RecentActivity returns the most recent challenge logs for a user.
func RecentActivity(ctx context.Context, userID string, limit int) ([]ChallengeState, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT cl.challenge_id, c.slug, cl.log_date::text, cl.data, cl.completed, cl.completed_at, cl.updated_at
		FROM challenge_logs cl JOIN challenges c ON c.id = cl.challenge_id
		WHERE cl.user_id = $1
		ORDER BY cl.log_date DESC, cl.updated_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ChallengeState
	for rows.Next() {
		var st ChallengeState
		var raw []byte
		if err := rows.Scan(&st.ChallengeID, &st.Slug, &st.LogDate, &raw, &st.Completed, &st.CompletedAt, &st.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(raw, &st.Data)
		if st.Data == nil {
			st.Data = map[string]interface{}{}
		}
		out = append(out, st)
	}
	return out, nil
}
