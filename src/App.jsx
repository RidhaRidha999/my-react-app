import Dashboard from "./doctor/dashboard/dashboard.jsx";
import DoctorForgotPass from "./doctor/doctor-forgot-pass/doctor-forgot-pass.jsx";
import DoctorLanding from "./doctor/doctor-landing/doctor-landing";
import DoctorSignin from "./doctor/doctor-signin/doctor-signin";
import DoctorSignUp from "./doctor/doctor-signup/doctor-signup";
import { Routes, Route } from "react-router";
import RequestChecker from "./doctor/request_checker/requestChecker.jsx";
import Profile from "./doctor/profile/profile.jsx";
import "leaflet/dist/leaflet.css";
import Request from "./doctor/appointements/appointements.jsx";
import MainPage from "./doctor/mainpage/mainpage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DoctorLanding />} />
      <Route path="/landing" element={<DoctorLanding />}></Route>
      <Route path="/signin" element={<DoctorSignin />}></Route>
      <Route path="/signup" element={<DoctorSignUp />}></Route>
      <Route path="/forgotpass" element={<DoctorForgotPass />}></Route>
      <Route path="/request-checker" element={<RequestChecker />}></Route>
      <Route path="/mainpage" element={<MainPage />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="appointements" element={<Request />} />
      </Route>
    </Routes>
  );
}

export default App;
