import { NextPage } from "next";

// Define the props for the IndicatorDot component
interface IndicatorDotProps {
  isActive: boolean;  // Determines whether the dot is active (selected) or not
  bgActiveColor?: string;
  onClick: () => void; // Function to be called when the dot is clicked to change the slide
}

const IndicatorDot: NextPage<IndicatorDotProps> = ({ isActive, onClick, bgActiveColor="bg-white" }) => (
  // Button element that represents the dot indicator for the slider
  <button
    onClick={onClick}  // Trigger the onClick function when the dot is clicked
    className={`h-3 rounded-full transition-all duration-300 ${  // Basic styles and transition effects
      isActive  // Check if the dot is active
        ? `w-6 border-2 ${bgActiveColor} border-black`  // Active state: Larger dot with white background and black border
        : 'w-3 bg-gray-400 border border-transparent'  // Inactive state: Smaller gray dot with no border
    }`}
    aria-label="Go to slide"  // Accessibility label for screen readers
  />
);

export default IndicatorDot;
