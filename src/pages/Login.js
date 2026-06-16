import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getHomePath, getStoredUser, persistAuthSession } from "../data/auth";
import { login as loginApi } from "../api/auth.api";
import { getErrorMessage } from "../api/client";
import { Navigate } from "react-router-dom";
import { errorToast } from "../utils/ToastControllers";
import PasswordInput from "../component/PasswordInput";

const Login = () => {
  const router = useNavigate();
  const existingUser = getStoredUser();

  const loginValidation = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email format").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const result = await loginApi(values.email, values.password);
        persistAuthSession(result);
        const home = getHomePath(result.user);
        if (home === "/login") {
          errorToast("Unknown role for this account");
          return;
        }
        router(home);
      } catch (err) {
        errorToast(getErrorMessage(err, "Invalid email or password"));
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (existingUser) {
    return <Navigate to={getHomePath(existingUser)} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-brand-50/30 to-slate-100 flex flex-col items-center justify-center font-sans px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-bold shadow-lg mb-4">
          N
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NAT IT</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Human Resources Portal</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10">
        <form onSubmit={loginValidation.handleSubmit}>
          <h2 className="text-xl font-semibold text-center text-slate-800">Sign in</h2>
          <p className="text-center text-sm text-slate-500 mb-8 mt-1">Sign in to your account</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              name="email"
              value={loginValidation.values.email}
              onChange={loginValidation.handleChange}
              onBlur={loginValidation.handleBlur}
              placeholder="admin@yopmail.com"
            />
            {loginValidation.touched.email && loginValidation.errors.email && (
              <p className="text-sm text-red-600 mt-1">{loginValidation.errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput
              inputClassName="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              name="password"
              value={loginValidation.values.password}
              onChange={loginValidation.handleChange}
              onBlur={loginValidation.handleBlur}
            />
            {loginValidation.touched.password && loginValidation.errors.password && (
              <p className="text-sm text-red-600 mt-1">{loginValidation.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 text-base disabled:opacity-60"
            disabled={loginValidation.isSubmitting}
          >
            {loginValidation.isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Default admin: admin@yopmail.com / Admin@123
          <br />
          Your dashboard automatically shows your assigned shift (General, Mid or Night).
        </p>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <button type="button" className="link-brand font-medium" onClick={() => router("/register")}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
