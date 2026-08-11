import { NextPage } from "next";
import { BiTime } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { FaTrophy } from "react-icons/fa";

interface MatchCardProps {
  id: string | number;
  ageGroup: string;
  location: string;
  teams: string[];
  date: string;
  address: string;
}

const MatchCard: NextPage<MatchCardProps> = ({
  ageGroup,
  location,
  teams,
  date,
  address,
}) => {
  return (
    <div className="max-w-2xl w-full rounded-xl overflow-hidden shadow-lg border-t-4 border-red-500 bg-white hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FaTrophy className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">{ageGroup}</h3>
          </div>
          <div className="px-3 py-1 bg-white rounded-full text-sm font-medium text-red-600 shadow-sm border border-red-100">
            {location}
          </div>
        </div>
      </div>

      {/* Match Section */}
      <div className="p-4">
        {Array.isArray(teams) && teams.length >= 2 ? (
          <div className="flex items-center justify-center my-4">
            <div className="flex-1 text-right">
              <span className="text-lg font-bold text-gray-800">{teams[0]}</span>
            </div>
            <div className="mx-4 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white font-bold">
              VS
            </div>
            <div className="flex-1 text-left">
              <span className="text-lg font-bold text-gray-800">{teams[1]}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center my-4 p-2 bg-gray-50 rounded-lg">
            Teams not available
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          {/* Time */}
          <div className="flex p-2 bg-gray-50 rounded-lg">
            <BiTime className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="text-gray-700">{date}</span>
          </div>

          {/* Location */}
          <div className="flex p-2 bg-gray-50 rounded-lg">
            <IoLocationOutline className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="text-gray-700 break-words">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;