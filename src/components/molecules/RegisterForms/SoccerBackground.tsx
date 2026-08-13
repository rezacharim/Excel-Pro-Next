import {
  PlayerPosition,
  ExperienceLevel,
} from "@/stores/UserFormStore/enums/enums";
import { TextField } from "./Fields";

type SoccerBackgroundProps = {
  experienceLevel: string;
  playerPosition: string;
  customPosition: string;
  onChange: (
    field: "experienceLevel" | "player_positions" | "custom_position",
    value: string
  ) => void;
  errors?: {
    experienceLevel?: string;
    player_positions?: string;
    custom_position?: string;
  };
};

/**
 * The soccer half of the final step. It is controlled by the parent step so the
 * whole "Soccer & consent" page validates and submits as one form.
 */
const SoccerBackground = ({
  experienceLevel,
  playerPosition,
  customPosition,
  onChange,
  errors = {},
}: SoccerBackgroundProps) => {
  const cardClasses = (selected: boolean) =>
    `flex min-h-[44px] w-full items-center justify-center rounded-md border px-4 py-3 text-center text-sm cursor-pointer ${
      selected
        ? "border-[#E43125] bg-red-50 text-[#E43125] font-medium"
        : "border-gray-300 hover:border-gray-400"
    }`;

  return (
    <>
      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-gray-800 mb-2">
          Experience level <span className="text-[#E43125]">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(ExperienceLevel).map((level) => (
            <div key={level}>
              <input
                type="radio"
                id={`skill_${level}`}
                name="experienceLevel"
                value={level}
                checked={experienceLevel === level}
                onChange={(e) => onChange("experienceLevel", e.target.value)}
                aria-describedby={
                  errors.experienceLevel ? "experienceLevel-error" : undefined
                }
                className="sr-only peer"
              />
              <label
                htmlFor={`skill_${level}`}
                className={`${cardClasses(
                  experienceLevel === level
                )} peer-focus-visible:ring-2 peer-focus-visible:ring-[#E43125]/40`}
              >
                {level}
              </label>
            </div>
          ))}
        </div>
        {errors.experienceLevel && (
          <p
            id="experienceLevel-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.experienceLevel}
          </p>
        )}
      </fieldset>

      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-gray-800 mb-2">
          Preferred position <span className="text-[#E43125]">*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(PlayerPosition).map((position) => (
            <div key={position}>
              <input
                type="radio"
                id={`position_${position}`}
                name="player_positions"
                value={position}
                checked={playerPosition === position}
                onChange={(e) => onChange("player_positions", e.target.value)}
                aria-describedby={
                  errors.player_positions ? "player_positions-error" : undefined
                }
                className="sr-only peer"
              />
              <label
                htmlFor={`position_${position}`}
                className={`${cardClasses(
                  playerPosition === position
                )} peer-focus-visible:ring-2 peer-focus-visible:ring-[#E43125]/40`}
              >
                {position}
              </label>
            </div>
          ))}
        </div>
        {errors.player_positions && (
          <p
            id="player_positions-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.player_positions}
          </p>
        )}
      </fieldset>

      {playerPosition === PlayerPosition.OTHER && (
        <div className="mb-6">
          <TextField
            id="custom_position"
            name="custom_position"
            label="Which position?"
            required
            type="text"
            placeholder="Example: Sweeper, Wing Back"
            value={customPosition}
            onChange={(e) => onChange("custom_position", e.target.value)}
            error={errors.custom_position}
          />
        </div>
      )}
    </>
  );
};

export default SoccerBackground;
