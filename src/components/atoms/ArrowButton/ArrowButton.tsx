import { NextPage } from "next";

// Define the types for the props that the ArrowButton component will receive
interface ArrowButtonProps {
  direction: 'left' | 'right';  // Direction of the arrow (left or right)
  onClick: () => void;          // Function to be called when the button is clicked
   variant?: "primary" | "gray" | "default";
}

const ArrowButton: NextPage<ArrowButtonProps> = ({ direction, onClick, variant="default" }) => {
  return (
    // Button element that triggers the slide change when clicked
    <button
      onClick={onClick}  // Calls the passed in onClick function when clicked
      className={`${ variant==="primary" ? "bg-primary hover:bg-red-700 text-white" : variant==="gray" ? "bg-gray-100 hover:bg-gray-200 text-primary" : "bg-black/50 hover:bg-black/70 text-white" } w-12 h-12 rounded-full flex items-center justify-center transition-colors`}
      aria-label={direction === 'left' ? "Previous slide" : "Next slide"}  // Accessibility label to describe the button's action
    >
      {/* SVG icon representing the arrow */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
        {/* Path defines the arrow direction based on the 'direction' prop */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'left' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
};

export default ArrowButton;
