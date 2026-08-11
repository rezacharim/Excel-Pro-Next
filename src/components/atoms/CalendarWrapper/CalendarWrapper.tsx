'use client';
import { ReactNode } from 'react';
import { NextPage } from 'next';
import 'react-calendar/dist/Calendar.css';

interface CalendarWrapperProps {
  children: ReactNode;
}

const CalendarWrapper: NextPage<CalendarWrapperProps> = ({ children }) => {
  // This component injects tailwind classes to override react-calendar's default styles
  return (
    <div className="calendar-wrapper">
      <style jsx global>{`
        /* Base override to allow for our custom styles */
        .react-calendar {
          width: 100%;
          max-width: 100%;
          background: white;
          font-family: inherit;
          line-height: 1.125em;
          border: none !important;
        }

        /* Hide the default navigation */
        .react-calendar__navigation {
          display: none;
        }

        /* Basic tile styling */
        .react-calendar__tile {
          max-width: 100%;
          height: 8rem;
          padding: 0.5rem !important;
          background: none;
          text-align: left;
          line-height: normal;
          font-weight: 500;
          position: relative;
          border: 1px solid #f3f4f6;
        }

        /* Weekday headers */
        .react-calendar__month-view__weekdays {
          font-weight: normal;
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 0.75rem;
          text-decoration: none;
          text-transform: none;
          font-weight: 500;
          color: #4B5563;
        }
        
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        /* Today's date special styling */
        .react-calendar__tile--now {
          background: white;
          position: relative;
        }

        .react-calendar__tile--now::after {
          content: '';
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 0.5rem;
          height: 0.5rem;
          background-color: #3B82F6;
          border-radius: 50%;
        }

        /* Hover states */
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #f9fafb;
        }

        /* Neighboring month dates */
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #9CA3AF;
        }

        /* Force grid layout for days */
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
        }

        /* Make sure the day number appears in the top left */
        .react-calendar__tile > abbr {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          font-size: 1rem;
        }
      `}</style>
      {children}
    </div>
  );
};

export default CalendarWrapper;