import { useMemo } from "react";

import { useKeyPress } from "../../hooks/useKeyPress";
import { cn } from "../../lib/utils";

const innerRadius = 0.4;
const thirdPi = Math.PI / 3;
const sixthPi = Math.PI / 6;
const cos30 = Math.sqrt(3) / 2;
const sin30 = 0.5;
const rxy = (angle: number, radius: number) => [Math.sin(angle) * radius, -Math.cos(angle) * radius] as const;
const xy = (x: number, y: number) => `${x.toFixed(3)} ${y.toFixed(3)}`;
const rotations = [180, 120, 60, 0, 300, 240] as const;
const coralLetters = "ABCDEFGHIJKL";

const crosshairX = 0.65 * Math.sin(Math.PI / 12);
const crosshairY = -0.65 * Math.cos(Math.PI / 12);
const letterX = 0.45 * Math.sin(Math.PI / 12);
const letterY = -0.45 * Math.cos(Math.PI / 12);

const Crosshair = ({ size = 12 }: { size: number }) => (
  <g
    transform={`translate(-${size / 2},-${size / 2})`}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1">
    <circle
      cx={size / 2}
      cy={size / 2}
      r={size / 2}
    />
    <path
      d={`M${size} ${size / 2}h-${size / 5}M0 ${size / 2}h${size / 5}M${size / 2} 0v${size / 5}M${size / 2} ${size}v-${size / 5}`}
    />
  </g>
);

const polarToCartesian = (cx: number, cy: number, r: number, angleDegrees: number) => {
  const angleInRadians = ((angleDegrees - 90) * Math.PI) / 180.0;
  return [cx + r * Math.cos(angleInRadians), cy + r * Math.sin(angleInRadians)];
};

/**
 * Generates path for the arc representing part of the circle.
 */
function arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", start[0], start[1], "A", r, r, 0, largeArcFlag, 0, end[0], end[1]].join(" ");
  return d;
}

const Ball = ({ size = 12 }: { size: number }) => (
  <g
    transform={`translate(-${size / 2},-${size / 2})`}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1">
    <circle
      cx={size / 2}
      cy={size / 2}
      r={size / 2}
    />
    <path d={arc(size / 2, size / 2, 0.4 * size, 105, 185)} />
  </g>
);

/**
 * Generates path for the hexagon with rounded corners.
 * @param radius radius of the circle containing the hexagon
 * @param arc arc angle for the rounded corner
 */
function hexagon(radius: number, arc: number) {
  // radius to the point where rounded corner arc starts/ends
  const r = (radius * Math.sin(thirdPi)) / Math.sin((Math.PI * 2) / 3 - arc);

  // rotate by 90 degrees (top is flat side)
  const rotation = -Math.PI / 2;
  const [x, y] = rxy(rotation + arc, r); // initial point

  // generate line segment and attached round corner for each side
  const segments = [thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi, 0]
    .map((angle) => {
      const a = angle + rotation;
      const [xc, yc] = rxy(a, radius);
      const [x0, y0] = rxy(a - arc, r);
      const [x1, y1] = rxy(a + arc, r);

      return `L ${xy(x0, y0)} Q ${xy(xc, yc)}, ${xy(x1, y1)}`;
    })
    .join(" ");

  return `M ${xy(x, y)} ${segments} Z`;
}

/**
 * Generates path for the left or right "paddle".
 * @param r1 outer radius
 * @param r2 inner radius
 * @param left left orientation indicator
 */
function paddle(r1: number, r2: number, left: boolean) {
  const p = 1;
  const c = 4;
  r1 -= p * 2;
  r2 += p * 2;

  const s = left ? -1 : 1;
  const xy0 = rxy(0, r1 * cos30);
  const xy1 = rxy(s * sixthPi, r1);
  const xy2 = rxy(s * sixthPi, r2);
  const xy3 = rxy(0, r2 * cos30);

  const x0 = xy0[0] + s * p;
  const x3 = xy3[0] + s * p;
  const x1 = xy1[0] - (s * p) / cos30;
  const x2 = xy2[0] - (s * p) / cos30;
  const y0 = xy0[1];
  const y3 = xy3[1];
  const y1 = xy1[1];
  const y2 = xy2[1];

  return `M ${xy(x0 + s * c, y0)} L ${xy(x1 - s * c, y1)} Q ${xy(x1, y1)}, ${xy(x1 - s * c * sin30, y1 + c * cos30)} L ${xy(x2 + s * c * sin30, y2 - c * cos30)} Q ${xy(x2, y2)}, ${xy(x2 - s * c, y2)} L ${xy(x3 + s * c, y3)} Q ${xy(x3, y3)}, ${xy(x3, y3 - c)} L ${xy(x0, y0 + c)} Q ${xy(x0, y0)}, ${xy(x0 + s * c, y0)} Z`;
}

/**
 * Generates path for the algae "paddle".
 * @param r1 outer radius
 * @param r2 inner radius
 */
function algae(r1: number, r2: number) {
  const p = 1;
  const c = 4;
  r1 -= p * 2;
  r2 += p * 2;

  const xy0 = rxy(-sixthPi, r1);
  const xy3 = rxy(-sixthPi, r2);
  const xy1 = rxy(sixthPi, r1);
  const xy2 = rxy(sixthPi, r2);

  const x0 = xy0[0] + p / cos30;
  const x3 = xy3[0] + p / cos30;
  const x1 = xy1[0] - p / cos30;
  const x2 = xy2[0] - p / cos30;
  const y0 = xy0[1];
  const y3 = xy3[1];
  const y1 = xy1[1];
  const y2 = xy2[1];

  return `M ${xy(x0 + c, y0)} L ${xy(x1 - c, y1)} Q ${xy(x1, y1)}, ${xy(x1 - c * sin30, y1 + c * cos30)} L ${xy(x2 + c * sin30, y2 - c * cos30)} Q ${xy(x2, y2)}, ${xy(x2 - c, y2)} L ${xy(x3 + c, y3)} Q ${xy(x3, y3)}, ${xy(x3 - c * sin30, y3 - c * cos30)} L ${xy(x0 + c * sin30, y0 + c * cos30)} Q ${xy(x0, y0)}, ${xy(x0 + c, y0)} Z`;
}

const isBitSet = (v: number, i: number) => (v & (1 << i)) !== 0;
const countBits = (n: number) => {
  // see https://graphics.stanford.edu/%7Eseander/bithacks.html
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
};

export const setBit = (v: number, i: number) => v | (1 << i);
export const clearBit = (v: number, i: number) => v & ~(1 << i);
export const toggleBit = (v: number, i: number) => v ^ (1 << i);

type PaddleProps = {
  radius: number;
  side: "left" | "right";
  scored?: boolean;
  target?: boolean;
  locked?: boolean;
  letter?: string;
  onClick?: (modifier: boolean) => void;
};

const Paddle = ({ radius, side, scored, target, locked, letter, onClick }: PaddleProps) => {
  const l = radius / 10;
  const modifier = useKeyPress(["ShiftLeft", "ControlLeft", "AltLeft"]);
  const interactive = !modifier || !scored; // do not allow setting target to scored position

  return (
    <g>
      <path
        d={paddle(radius, radius * innerRadius, side === "left")}
        fill={scored ? "url(#--hatch-diagonal)" : undefined}
        pointerEvents="fill"
        className={cn(
          interactive && (modifier ? "cursor-crosshair" : "cursor-pointer"),
          !scored &&
            "fill-muted-foreground/10 stroke-muted-foreground hover:fill-muted-foreground/50 hover:stroke-gray-100",
          scored && "stroke-gray-100",
          scored && interactive && "hover:stroke-2"
        )}
        strokeDasharray={!scored ? l * 0.5 : undefined}
        onClick={() => (interactive ? onClick?.(modifier) : undefined)}>
        {target && (
          <animate
            attributeName="stroke-dashoffset"
            values={`${l * 0.5};-${l * 0.5}`}
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </path>
      {target && (
        <g
          transform={`translate(${(side === "left" ? -1 : 1) * radius * crosshairX}, ${radius * crosshairY})`}
          pointerEvents="none"
          className={locked ? "text-yellow-600" : "text-gray-100"}>
          <Crosshair size={radius / 8} />
        </g>
      )}
      {letter && (
        <text
          transform={`translate(${(side === "left" ? -1 : 1) * radius * letterX}, ${radius * letterY})`}
          pointerEvents="none"
          textAnchor="middle"
          className="fill-muted-foreground/40 text-[9px]">
          {letter}
        </text>
      )}
    </g>
  );
};

type AlgaeProps = {
  radius: number;
  value?: boolean;
  onClick?: () => void;
};

const Algae = ({ radius, value, onClick }: AlgaeProps) => {
  const l = radius / 10;
  return (
    <g>
      <path
        d={algae(radius, radius * innerRadius)}
        fill={value ? "url(#--hatch-diagonal)" : "none"}
        pointerEvents="fill"
        className={cn(
          "cursor-pointer hover:fill-muted-foreground/50",
          value && "fill-muted-foreground/10 stroke-muted-foreground",
          !value && "stroke-muted-foreground"
        )}
        strokeDasharray={!value ? l * 0.5 : undefined}
        onClick={onClick}
      />
      {value && (
        <g
          transform={`translate(0, -${radius * 0.62})`}
          pointerEvents="none">
          <Ball size={radius / 4} />
        </g>
      )}
    </g>
  );
};

const Barrier = ({ radius }: { radius: number }) => {
  const size = radius / 20;
  return (
    <g transform={`translate(-${radius / 2}, -${radius * cos30})`}>
      <rect
        x={0}
        y={0}
        rx={size}
        width={radius}
        height={size}
        className="fill-black stroke-black stroke-1"
      />
      <rect
        fill="url(#--hatch-barrier)"
        x={0}
        y={0}
        rx={size}
        width={radius}
        height={size}
      />
    </g>
  );
};

export type ReefLevelProps = {
  className?: string;

  /**
   * Radius (size).
   */
  radius: number;

  /**
   * Bitmap of scored positions indexed counterclockwise starting
   * at the bottom-left (A...L positions in the game manual).
   */
  value: number;

  /**
   * Current target index. See `value` for indexing convention.
   */
  target?: number;

  /**
   * Indicates that current target is locked by the operator.
   */
  locked?: boolean;

  /**
   * Indicates that this level has been selected as a target.
   */
  selected?: boolean;

  /**
   * Bitmap of barrier positions indexed counterclockwise starting
   * at the bottom-left (AB/CD/EF/GH/IJ/KL.positions in the game manual).;
   */
  barrier?: number;

  /**
   * Caption to display in the middle.
   */
  caption?: string;

  /**
   * Indicates whether to display the index letter on each position..
   */
  letterVisible?: boolean;

  /**
   * Callback invoked when the coral position is clicked.
   * @param index Index of the position (0...11)
   * @param modifier `true` if the shift key is pressed
   */
  onClick?: (index: number, modifier?: boolean) => void;

  /**
   * Callback invoked when the reef level is selected (clicked).
   */
  onSelect?: () => void;
};

export const ReefLevel = ({
  radius,
  className,
  value,
  target,
  locked,
  selected,
  barrier,
  caption,
  letterVisible,
  onClick,
  onSelect,
}: ReefLevelProps) => {
  const pathOuter = useMemo(() => hexagon(radius, Math.PI / 60), [radius]);
  const pathInner = useMemo(() => hexagon(radius * innerRadius, Math.PI / 60), [radius]);
  const count = countBits(value);
  const highlighted = count >= 5;

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="absolute inset-0 stroke-1">
        <defs>
          <pattern
            id="--hatch-diagonal"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4">
            <path
              d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
              strokeWidth={1}
              className="stroke-gray-100/80"
            />
          </pattern>
          <pattern
            id="--hatch-barrier"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4">
            <path
              d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
              strokeWidth={1.5}
              className="stroke-destructive/80"
            />
          </pattern>
        </defs>
        <g transform={`translate(${radius},${radius})`}>
          <path
            d={pathOuter}
            className="fill-none stroke-accent"
          />
          <path
            d={pathInner}
            pointerEvents="fill"
            className={cn(
              "fill-none stroke-accent",
              highlighted && "fill-accent/50",
              selected
                ? "fill-amber-500/15 stroke-amber-500 stroke-2"
                : "cursor-pointer hover:fill-amber-500/15 hover:stroke-amber-500"
            )}
            onClick={onSelect ? () => onSelect() : undefined}
          />
          {rotations.map((rotation, i) => (
            <g
              key={`_${rotation}`}
              transform={`rotate(${rotation})`}>
              <Paddle
                radius={radius}
                side="left"
                scored={isBitSet(value, i * 2 + 1)}
                target={target === i * 2 + 1}
                locked={locked}
                letter={letterVisible ? coralLetters[i * 2 + 1] : undefined}
                onClick={(modifier) => onClick?.(i * 2 + 1, modifier)}
              />
              <Paddle
                radius={radius}
                side="right"
                scored={isBitSet(value, i * 2)}
                target={target === i * 2}
                locked={locked}
                letter={letterVisible ? coralLetters[i * 2] : undefined}
                onClick={(modifier) => onClick?.(i * 2, modifier)}
              />
              {barrier != null && isBitSet(barrier, i) && <Barrier radius={radius} />}
            </g>
          ))}
        </g>
      </svg>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center text-center font-semibold text-muted-foreground",
          highlighted && "text-foreground"
        )}>
        <div>
          {caption && <div className="text-xl">{caption}</div>}
          <div className="font-normal">{count} scored</div>
        </div>
      </div>
    </div>
  );
};

export type ReefAlgaeProps = {
  className?: string;

  /**
   * Radius (size).
   */
  radius: number;

  /**
   * Bitmap of algae positions indexed counterclockwise starting
   * at the bottom-left (AB/CD/EF/GH/IJ/KL.positions in the game manual).;
   */
  value: number;

  /**
   * Callback invoked when the algae position is clicked.
   * @param index Index of the position (0...5)
   */
  onClick?: (index: number) => void;
};

export const ReefAlgae = ({ radius, className, value, onClick }: ReefAlgaeProps) => {
  const pathOuter = useMemo(() => hexagon(radius, Math.PI / 60), [radius]);
  const pathInner = useMemo(() => hexagon(radius * innerRadius, Math.PI / 60), [radius]);

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="absolute inset-0 stroke-1">
        <g transform={`translate(${radius},${radius})`}>
          <path
            d={pathOuter}
            className="fill-none stroke-accent"
          />
          <path
            d={pathInner}
            className={"fill-none stroke-accent"}
          />
          {rotations.map((rotation, i) => (
            <g
              key={`_${rotation}`}
              transform={`rotate(${rotation})`}>
              <Algae
                radius={radius}
                value={isBitSet(value, i)}
                onClick={() => onClick?.(i)}
              />
            </g>
          ))}
        </g>
      </svg>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center text-center font-semibold text-muted-foreground"
        )}>
        <div className="text-xl">Algae</div>
      </div>
    </div>
  );
};
