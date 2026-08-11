import { NextPage } from 'next';
import IndicatorDot from '../../atoms/IndicatorDot/IndicatorDot';

// Define the props for the IndicatorDots component
interface IndicatorDotsProps {
  slideCount: number;  // Total number of slides
  currentSlide: number; // Index of the current active slide
  goToSlide: (index: number) => void;  // Function to navigate to a specific slide
}

const IndicatorDots: NextPage<IndicatorDotsProps> = ({ slideCount, currentSlide, goToSlide }) => {
  return (
    // Container for the indicator dots
    <div className="flex justify-center items-center gap-3 mt-6 pb-8">
      {/* Loop through the slideCount to generate the dots */}
      {Array.from({ length: slideCount }).map((_, index) => (
        // Each dot is represented by the IndicatorDot component
        <IndicatorDot
          key={index}  // Unique key for each dot
          isActive={index === currentSlide}  // Determine if the dot is active (based on current slide)
          onClick={() => goToSlide(index)}  // Trigger goToSlide function to change the slide when the dot is clicked
        />
      ))}
    </div>
  );
};

export default IndicatorDots;
