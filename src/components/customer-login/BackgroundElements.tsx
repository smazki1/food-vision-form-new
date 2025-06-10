
const BackgroundElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8b1e3f]/10 to-[#f3752b]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#f3752b]/10 to-[#8b1e3f]/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default BackgroundElements;
