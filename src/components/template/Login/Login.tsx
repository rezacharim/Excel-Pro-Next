import AuthModel from "@/components/organisms/AuthModel/AuthModel";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-700 p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <AuthModel />
        </div>
      </div>
    </div>
  );
};

export default Login;
