"use client";
import { useState } from "react";
import AuthForm from "@/components/organisms/AuthForm/AuthForm";
import RegisterForm from "@/components/organisms/RegisterContent/RegisterForm/RegisterForm";

const Register = () => {
  const [auth, setAuth] = useState<boolean>(false);
  return (
    <section>
      {!auth ? (
        <div className="min-h-screen flex items-center">
          <AuthForm
            auth={(state: boolean) => {
              setAuth(state);
            }}
          />
        </div>
      ) : (
        <RegisterForm />
      )}
    </section>
  );
};

export default Register;
