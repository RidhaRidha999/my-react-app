import axios from "axios";
import { useAuth } from "../doctor/contexts/authContext";
const API = axios.create({
  baseURL: "https://mediora-back-2.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
let auth = null;
export const setAuthContext = (authContext) => {
  auth = authContext;
};
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (
    token &&
    !config.headers.Authorization &&
    !config.url.includes("/auth/signout")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!error.config) return Promise.reject(error);
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          "https://mediora-back-2.onrender.com/auth/refresh",
          {},
          { withCredentials: true },
        );
        console.log(res.data.token);
        const newToken = res.data.token;
        localStorage.setItem("authToken", newToken);
        auth?.setToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (err) {
        console.log(err.response);
        auth?.logout.mutate();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);
// LEAVE FUNCTIONS - USING WORKING VERSION
export const addLeave = async (data) => {
  const doctorId = localStorage.getItem("doctorId");
  const response = await API.post("/doctors/leaves", {
    ...data,
    doctor_id: doctorId,
  });

  return response;
};

export const getLeave = async () => {
  const doctorId = localStorage.getItem("doctorId");
  return await API.get("/doctors/leaves/", {
    params: { doctor_id: doctorId },
  });
};

export const deleteLeave = async (id) => {
  const doctorId = localStorage.getItem("doctorId");

  const response = await API.delete(
    `/doctors/leaves/${id}?doctor_id=${doctorId}`,
  );

  return response;
};

export const updateLeave = async (id, data) => {
  const response = await API.patch(`/doctors/leaves/${id}`, data);
  return response;
};

export const getSchedule = (doctorId) =>
  API.get(`/doctors/${doctorId}/schedule`);
export const getAppointments = () => API.get("/appointments/");
export const getAllDoctors = () => API.get("/doctors");

export const login = async (email, password) => {
  try {
    const response = await API.post("/auth/signin", { email, password });
    const { token, doctor_id, username } = response.data;

    if (token) localStorage.setItem("authToken", token);
    if (doctor_id) localStorage.setItem("doctorId", doctor_id);
    if (username) localStorage.setItem("doctorUsername", username);

    return response;
  } catch (error) {
    throw error;
  }
};

export default API;
