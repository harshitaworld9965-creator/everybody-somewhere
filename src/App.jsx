import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const activities = [
  {
    name: "Sleeping",
    color: "#baabf4",
    x: 70,
  },
  {
    name: "Working",
    color: "#7ee1da",
    x: 290,
  },
  {
    name: "Unwinding",
    color: "#e7a8db",
    x: 510,
  },
];

// Fictional counts: every snapshot contains exactly 100 people.
const snapshots = {
  "03:00": [90, 5, 5],
  "08:00": [15, 70, 15],
  "19:00": [10, 10, 80],
};

export default function App() {
  const [time, setTime] = useState("03:00");
  const sceneRef = useRef(null);

  const counts = snapshots[time];

  let nextId = 0;

  // Calculate each person's destination for the selected time.
  const people = activities.flatMap((activity, groupIndex) =>
    Array.from({ length: counts[groupIndex] }, (_, slot) => ({
      id: nextId++,
      x: activity.x + (slot % 10) * 10,
      y: 150 + Math.floor(slot / 10) * 10,
      color: activity.color,
    })),
  );

  // Keep React's rendered coordinates fixed at the initial snapshot.
  // GSAP controls the circles' coordinates during animation.
  const [initialPeople] = useState(people);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.to(".person", {
        attr: {
          cx: (index) => people[index].x,
          cy: (index) => people[index].y,
          fill: (index) => people[index].color,
        },
        duration: reducedMotion ? 0 : 1.6,
        stagger: reducedMotion ? 0 : 0.003,
        ease: "power3.inOut",
        overwrite: true,
      });
    },
    {
      scope: sceneRef,
      dependencies: [time],
    },
  );

  return (
    <main ref={sceneRef}>
      <h1>Everybody, Somewhere.</h1>

      <p>100 fictional people. One ordinary day.</p>

      <svg
        viewBox="0 0 720 310"
        role="img"
        aria-label={`Activity distribution at ${time}: ${counts[0]} sleeping, ${counts[1]} working, ${counts[2]} unwinding.`}
        style={{
          display: "block",
          width: "min(720px, 90vw)",
        }}
      >
        <rect
          width="720"
          height="310"
          fill="#080d14"
        />

        {activities.map((activity, index) => (
          <g key={activity.name}>
            <text
              x={activity.x + 45}
              y="70"
              textAnchor="middle"
              fill="#e8efee"
              fontSize="16"
            >
              {activity.name}
            </text>

            <text
              x={activity.x + 45}
              y="95"
              textAnchor="middle"
              fill="#a5b4bf"
              fontSize="13"
            >
              {counts[index]} people
            </text>
          </g>
        ))}

        {initialPeople.map((person) => (
          <circle
            key={person.id}
            className="person"
            cx={person.x}
            cy={person.y}
            r="2.5"
            fill={person.color}
          />
        ))}
      </svg>

      <div>
        {Object.keys(snapshots).map((snapshotTime) => (
          <button
            key={snapshotTime}
            type="button"
            aria-pressed={time === snapshotTime}
            onClick={() => setTime(snapshotTime)}
          >
            {snapshotTime}
          </button>
        ))}
      </div>
    </main>
  );
}