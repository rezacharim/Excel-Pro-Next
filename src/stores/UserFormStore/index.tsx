import { create } from "zustand";
import {
  Gender,
  SkillLevel,
  PlayerPosition,
  TShirtSize,
  ExperienceLevel,
} from "./enums/enums";

interface UserFormState {
  id?: number;
  fullname: string;
  dateOfBirth: string;
  gender: Gender;
  // Height/weight are no longer asked on the public form (they scared parents
  // off), but the admin Excel export still has columns for them — keep the
  // fields with a neutral default so nothing downstream breaks.
  height: number;
  weight: number;
  // The parent picks one kit size; `uniformSize` is what the form binds to and
  // the four garment fields below are the ones the backend/admin already know.
  uniformSize: TShirtSize | "";
  tShirtSize: TShirtSize;
  shortSize: TShirtSize;
  jacketSize: TShirtSize;
  pantsSize: TShirtSize;
  address: string;
  postalCode: string;
  city: string;
  emergencyContactName: string;
  emergencyPhone: string;
  experienceLevel: ExperienceLevel;
  medicalNotes: string;
  photoUrl: string;
  parent_name: string;
  phone_number: string;
  email: string;
  emailVerified: boolean;
  player_positions?: PlayerPosition;
  custom_position?: string;
  policy: boolean;
  stripeCustomerId?: string;
  activePlan?: string;

  setFullname: (fullname: string) => void;
  setDateOfBirth: (dateOfBirth: string) => void;
  setGender: (gender: Gender) => void;
  setHeight: (height: number) => void;
  setWeight: (weight: number) => void;
  setUniformSize: (size: TShirtSize) => void;
  setTShirtSize: (size: TShirtSize) => void;
  setShortSize: (size: TShirtSize) => void;
  setJacketSize: (size: TShirtSize) => void;
  setPantsSize: (size: TShirtSize) => void;
  setAddress: (address: string) => void;
  setPostalCode: (postalCode: string) => void;
  setCity: (city: string) => void;
  setEmergencyContactName: (name: string) => void;
  setEmergencyPhone: (phone: string) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setMedicalNotes: (medicalNotes: string) => void;
  setPhotoUrl: (url: string) => void;
  setParentName: (parentName: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setEmail: (email: string) => void;
  setEmailVerified: (emailVerified: boolean) => void;
  setPlayerPosition: (position: PlayerPosition) => void;
  setCustomPosition: (customPosition: string) => void;
  setPolicy: (policy: boolean) => void;
  setStripeCustomerId: (stripeCustomerId: string) => void;
  setActivePlan: (activePlan: string) => void;
}

const useUserFormStore = create<UserFormState>((set) => ({
  fullname: "",
  dateOfBirth: "",
  gender: Gender.PREFER_NOT_TO_SAY,
  height: 0,
  weight: 0,
  uniformSize: "",
  tShirtSize: TShirtSize.M,
  shortSize: TShirtSize.M,
  jacketSize: TShirtSize.M,
  pantsSize: TShirtSize.M,
  address: "",
  postalCode: "",
  city: "",
  emergencyContactName: "",
  emergencyPhone: "",
  experienceLevel: ExperienceLevel.BEGINNER,
  medicalNotes: "",
  photoUrl: "",
  parent_name: "",
  phone_number: "",
  email: "",
  emailVerified: false,
  current_skill_level: SkillLevel.BEGINNER,
  player_positions: undefined,
  custom_position: "",
  policy: false,
  stripeCustomerId: "",
  activePlan: "",

  setFullname: (fullname) => set({ fullname }),
  setDateOfBirth: (dateOfBirth) => set({ dateOfBirth }),
  setGender: (gender) => set({ gender }),
  setHeight: (height) => set({ height }),
  setWeight: (weight) => set({ weight }),
  // One kit size answered by the parent fans out to the four garment fields the
  // backend and the admin screens already read, so nothing there has to change.
  setUniformSize: (size) =>
    set({
      uniformSize: size,
      tShirtSize: size,
      shortSize: size,
      jacketSize: size,
      pantsSize: size,
    }),
  setTShirtSize: (tShirtSize) => set({ tShirtSize }),
  setShortSize: (shortSize) => set({ shortSize }),
  setJacketSize: (jacketSize) => set({ jacketSize }),
  setPantsSize: (pantsSize) => set({ pantsSize }),
  setAddress: (address) => set({ address }),
  setPostalCode: (postalCode) => set({ postalCode }),
  setCity: (city) => set({ city }),
  setEmergencyContactName: (emergencyContactName) =>
    set({ emergencyContactName }),
  setEmergencyPhone: (emergencyPhone) => set({ emergencyPhone }),
  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),
  setMedicalNotes: (medicalNotes) => set({ medicalNotes }),
  setPhotoUrl: (photoUrl) => set({ photoUrl }),
  setParentName: (parentName) => set({ parent_name: parentName }),
  setPhoneNumber: (phoneNumber) => set({ phone_number: phoneNumber }),
  setEmail: (email) => set({ email }),
  setEmailVerified: (emailVerified) => set({ emailVerified }),
  setPlayerPosition: (position) => set({ player_positions: position }),
  setCustomPosition: (customPosition) =>
    set({ custom_position: customPosition }),
  setPolicy: (policy) => set({ policy }),
  setStripeCustomerId: (stripeCustomerId) => set({ stripeCustomerId }),
  setActivePlan: (activePlan) => set({ activePlan }),
}));

export default useUserFormStore;
