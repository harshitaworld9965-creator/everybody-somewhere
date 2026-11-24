import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(useGSAP, MotionPathPlugin);

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

// Fictional counts: every snapshot contains 1,000 people.
const snapshots = {
  "03:00": [900, 50, 50],
  "08:00": [150, 700, 150],
  "19:00": [100, 100, 800],
};

function getPosition(slot, centerX) {
  const angle = slot * 2.399963;
  const radius = 3.1 * Math.sqrt(slot + 0.5);

  return {
    x: centerX + Math.cos(angle) * radius,
    y: 220 + Math.sin(angle) * radius,
  };
}

// A cubic Bézier curve has a start, two control points,
// and an end. The control points bend the journey.
function buildCurve(start, end, id) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const distance = Math.hypot(dx, dy);

  if (distance < 0.1) {
    return [start, start, end, end];
  }

  // A unit vector perpendicular to the direction of travel.
  const normalX = -dy / distance;
  const normalY = dx / distance;

  // Alternate the bending direction for neighbouring people.
  const direction = id % 2 === 0 ? 1 : -1;
  const bend = Math.min(75, distance * 0.3) * direction;

  return [
    start,
    {
      x: start.x + dx * 0.33 + normalX * bend,
      y: start.y + dy * 0.33 + normalY * bend,
    },
    {
      x: start.x + dx * 0.67 + normalX * bend,
      y: start.y + dy * 0.67 + normalY * bend,
    },
    end,
  ];
}

export default function App() {
  const [time, setTime] = useState("03:00");
  const sceneRef = useRef(null);

  const counts = snapshots[time];

  let nextId = 0;

  const people = activities.flatMap((activity, groupIndex) =>
    Array.from({ length: counts[groupIndex] }, (_, slot) => {
      const position = getPosition(slot, activity.x + 45);

      return {
        id: nextId++,
        x: position.x,
        y: position.y,
        color: activity.color,
      };
    }),
  );

  const [initialPeople] = useState(people);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const dots = sceneRef.current.querySelectorAll(".person");

      dots.forEach((dot, index) => {
        const person = people[index];
        const initial = initialPeople[index];

        // SVG transforms are offsets from the initial coordinates.
        const endX = person.x - initial.x;
        const endY = person.y - initial.y;

        // Read the current position so interrupted journeys continue
        // from wherever the person actually is.
        const startX = parseFloat(gsap.getProperty(dot, "x")) || 0;
        const startY = parseFloat(gsap.getProperty(dot, "y")) || 0;

        const distance = Math.hypot(
          endX - startX,
          endY - startY,
        );

        if (reducedMotion || distance < 0.1) {
          gsap.set(dot, {
            x: endX,
            y: endY,
            attr: {
              fill: person.color,
            },
            overwrite: true,
          });

          return;
        }

        const path = buildCurve(
          { x: startX, y: startY },
          { x: endX, y: endY },
          person.id,
        );

        gsap.to(dot, {
          motionPath: {
            path,
            type: "cubic",
            autoRotate: false,
          },
          attr: {
            fill: person.color,
          },
          duration: 1.8,
          delay: person.id * 0.0006,
          ease: "power2.inOut",
          overwrite: true,
        });
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

      <p>1,000 fictional people. One ordinary day.</p>

      <svg
        viewBox="0 0 720 380"
        role="img"
        aria-label={`Activity distribution at ${time}: ${counts[0]} sleeping, ${counts[1]} working, ${counts[2]} unwinding.`}
        style={{
          display: "block",
          width: "min(720px, 90vw)",
        }}
      >
        <defs>
          <filter
            id="person-glow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur
              stdDeviation="1.1"
              result="glow"
            />

            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          width="720"
          height="380"
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

        <g filter="url(#person-glow)">
          {initialPeople.map((person) => (
            <circle
              key={person.id}
              className="person"
              cx={person.x}
              cy={person.y}
              r="1.7"
              fill={person.color}
            />
          ))}
        </g>
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