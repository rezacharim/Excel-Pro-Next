

const PracticeSchedule = () => {
  return (
    <div className="mt-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">
        Practice Days and Schedule Time
      </h2>
      <p className="mb-2">Location: Ashton Meadows Park, Markham, Ontario</p>
      <p className="mb-4">Starting the Summer season on Monday 28th of April</p>

      <div className="border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 p-3 border-b">
          <h3 className="font-medium">Group U6/ U7 / U8/ U9/U10</h3>
        </div>
        <div className="p-3 border-b">
          <p className="mb-1">
            <span className="font-medium">Monday:</span> 5pm to 6:30pm
          </p>
          <p>
            <span className="font-medium">Wednesday:</span> 5pm to 6:30pm
          </p>
        </div>

        <div className="bg-gray-100 p-3 border-b">
          <h3 className="font-medium">Group U12/ U11/ U10</h3>
        </div>
        <div className="p-3 border-b">
          <p className="mb-1">
            <span className="font-medium">Monday:</span> 5pm to 6:30pm
          </p>
          <p>
            <span className="font-medium">Wednesday:</span> 5pm to 6:30pm
          </p>
        </div>

        <div className="bg-gray-100 p-3 border-b">
          <h3 className="font-medium">Group U13/ U14/ U15/U16/U17</h3>
        </div>
        <div className="p-3 border-b">
          <p className="mb-1">
            <span className="font-medium">Monday:</span> 6:30pm to 8pm
          </p>
          <p>
            <span className="font-medium">Wednesday:</span> 6:30pm to 8pm
          </p>
        </div>

        <div className="bg-gray-100 p-3">
          <h3 className="font-medium">Games Day</h3>
        </div>
        <div className="p-3">
          <p>
            Summer LEAGUE SCHEDULE WILL BE PROVIDED TO EACH TEAM - Hours may
            vary.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PracticeSchedule;
