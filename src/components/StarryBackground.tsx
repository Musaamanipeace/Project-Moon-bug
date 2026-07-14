import { useMemo } from "react";
import { motion } from "motion/react";

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function makeStars(count: number): Star[] {
  const stars: Star[] = [];
  // Deterministic-ish pseudo random so layout is stable across renders.
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      top: rand() * 100,
      left: rand() * 100,
      size: rand() * 2 + 0.6,
      delay: rand() * 4,
      duration: 2.5 + rand() * 4,
      opacity: 0.3 + rand() * 0.7,
    });
  }
  return stars;
}

export default function StarryBackground() {
  const stars = useMemo(() => makeStars(140), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Nebula glows */}
      <div
        className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(91,107,255,0.18), transparent 65%)" }}
      />
      <div
        className="absolute -right-32 top-10 h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(139,123,255,0.16), transparent 65%)" }}
      />
      <div
        className="absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(122,240,208,0.1), transparent 65%)" }}
      />

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
            animate={{ opacity: [s.opacity, 0.15, s.opacity] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
