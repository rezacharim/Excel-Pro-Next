import { useState } from "react";
import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import FloatingLabelInput from "@/components/organisms/FloatingLabelInput/FloatingLabelInput";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  PlayerPosition,
  ExperienceLevel,
} from "@/stores/UserFormStore/enums/enums";

const validationSchema = Yup.object({
  experienceLevel: Yup.string().required("Skill level is required"),
  player_positions: Yup.string().required("Player position is required"),
  custom_position: Yup.string().when("player_positions", {
    is: PlayerPosition.OTHER,
    then: (schema) => schema.required("Custom position is required"),
    otherwise: (schema) => schema.optional(),
  }),
});

const SoccerBackground: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();
  const {
    experienceLevel,
    player_positions,
    custom_position,
    setExperienceLevel,
    setPlayerPosition,
    setCustomPosition,
  } = useUserFormStore();

  const [focused, setFocused] = useState({
    custom_position: Boolean(custom_position),
  });

  const formik = useFormik({
    initialValues: {
      experienceLevel: experienceLevel || ExperienceLevel.BEGINNER,
      player_positions: player_positions || "",
      custom_position: custom_position || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setExperienceLevel(values.experienceLevel as ExperienceLevel);
      setPlayerPosition(values.player_positions as PlayerPosition);
      if (values.player_positions === PlayerPosition.OTHER) {
        setCustomPosition(values.custom_position);
      }
      setStep(step + 1);
    },
  });

  const handleFocus = (field: string) => {
    setFocused({
      ...focused,
      [field]: true,
    });
  };

  const handleBlur = (field: string) => {
    formik.handleBlur({ target: { name: field } });
    setFocused({
      ...focused,
      [field]: formik.values[field as keyof typeof formik.values] !== "",
    });
  };

  return (
    <>
      {/* Form Content */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Player Skill Level and Positions
        </h1>
        <p className="text-gray-600 mb-4">
          Please select your current skill level and the positions you are
          playing right now.
        </p>

        <form onSubmit={formik.handleSubmit}>
          <div className="mt-6 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Skill Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(ExperienceLevel).map((level) => (
                <div key={level} className="relative">
                  <input
                    type="radio"
                    id={`skill_${level}`}
                    name="experienceLevel"
                    value={level}
                    checked={formik.values.experienceLevel === level}
                    onChange={formik.handleChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`skill_${level}`}
                    className={`block w-full px-4 py-3 text-center rounded-md cursor-pointer border ${
                      formik.values.experienceLevel === level
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() +
                      level.slice(1).toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
            {formik.touched.experienceLevel &&
              formik.errors.experienceLevel && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.experienceLevel}
                </div>
              )}
          </div>

          <div className="mt-6 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Positions you are playing right now
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PlayerPosition).map((position) => (
                <div key={position} className="relative">
                  <input
                    type="radio"
                    id={`position_${position}`}
                    name="player_positions"
                    value={position}
                    checked={formik.values.player_positions === position}
                    onChange={formik.handleChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`position_${position}`}
                    className={`block w-full px-4 py-3 text-center rounded-md cursor-pointer border ${
                      formik.values.player_positions === position
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {position.charAt(0).toUpperCase() +
                      position.slice(1).toLowerCase().replace("_", " ")}
                  </label>
                </div>
              ))}
            </div>
            {formik.touched.player_positions &&
              formik.errors.player_positions && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.player_positions}
                </div>
              )}
          </div>

          {formik.values.player_positions === PlayerPosition.OTHER && (
            <div className="mt-4">
              <FloatingLabelInput
                id="custom_position"
                name="custom_position"
                label="Specify position"
                type="text"
                value={formik.values.custom_position}
                onChange={formik.handleChange}
                onFocus={() => handleFocus("custom_position")}
                onBlur={() => handleBlur("custom_position")}
                placeholder="Example: Sweeper, Wing Back, etc."
                isFocused={focused.custom_position}
              />
              {formik.touched.custom_position &&
                formik.errors.custom_position && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.custom_position}
                  </div>
                )}
            </div>
          )}

          {/* Next Button */}
          <div className="mt-8">
            <Button
              type="submit"
              className={`font-medium w-full py-3 rounded-md ${
                !formik.values.experienceLevel ||
                !formik.values.player_positions ||
                (formik.values.player_positions === PlayerPosition.OTHER &&
                  !formik.values.custom_position)
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-primary hover:bg-[#c9281e] text-white"
              }`}
              disabled={
                !formik.values.experienceLevel ||
                !formik.values.player_positions ||
                (formik.values.player_positions === PlayerPosition.OTHER &&
                  !formik.values.custom_position)
              }
            >
              Next step
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default SoccerBackground;
