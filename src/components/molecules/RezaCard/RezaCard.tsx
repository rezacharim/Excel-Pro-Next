const RezaCard = () => {
  return (
    <div className="md:w-1/4 h-full rounded-lg shadow-xl relative overflow-hidden my-6 lg:my-0 md:my-0 sm:my-6 bg-[url('/images/person/reza-abedian.webp')] bg-cover bg-no-repeat bg-[center_20%] min-h-[360px]">
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white bg-opacity-90 rounded-bl-lg rounded-br-lg border border-none backdrop-blur-md opacity-95">
        <h2 className="text-lg md:text-xl font-bold text-center text-gray-900">Reza Abedian</h2>
        <p className="text-sm md:text-base text-center text-gray-600">Owner of Excel Pro Academy</p>
      </div>
    </div>
  );
};

export default RezaCard;