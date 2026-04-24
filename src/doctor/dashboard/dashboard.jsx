import "./dashboard.css";
import { useState } from "react";
import {
  addLeave,
  getLeave,
  deleteLeave,
  getSchedule,
  updateLeave,
  getAppointments,
  getAllDoctors,
} from "../../api/api";
import { useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../contexts/authContext";
import { TailSpin } from "react-loader-spinner";

function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [leaveId, setLeaveId] = useState(null);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [tempVacationStart, setTempVacationStart] = useState("");
  const [tempVacationEnd, setTempVacationEnd] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [canceledCount, setCanceledCount] = useState(0);
  const [capacityPercentage, setCapacityPercentage] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [todayschedule, setTodaySchedule] = useState(null);
  const { data: doctorData, refetch, isLoading, isFetching } = useUser();
  const { logout } = useAuth();
  useEffect(() => {
    refetch();
  }, []);
  useEffect(() => {
    if (doctorData?.data) {
      console.log(doctorData.data);
      localStorage.setItem("doctorId", doctorData.data.id);
      //setCurrentDoctor(doctorData.data);
    }
  }, [doctorData]);
  const getTodaySchedule = () => {
    if (!schedule) return null;

    let scheduleData = Array.isArray(schedule?.data)
      ? schedule.data
      : Array.isArray(schedule)
        ? schedule
        : Array.isArray(schedule?.data?.data)
          ? schedule.data.data
          : null;

    if (!scheduleData || scheduleData.length === 0) return null;

    // Fix Sunday issue (backend usually 1–7)
    const today = new Date().getDay() || 7;

    return scheduleData.find((s) => s.day_of_week === today) || null;
  };

  const buildWorkBlocks = () => {
    const todaySchedule = getTodaySchedule();

    if (!todaySchedule) {
      return [{ start: "09:00", end: "17:00" }];
    }

    const formatTime = (timeString) => {
      if (!timeString) return "00:00";
      if (timeString.includes("T")) {
        return timeString.split("T")[1].slice(0, 5);
      }
      return timeString.slice(0, 5);
    };

    const startTime = formatTime(todaySchedule.starting_time);
    const endTime = formatTime(todaySchedule.finish_time);

    // No rest times → single block
    if (!todaySchedule.rest_times || todaySchedule.rest_times.length === 0) {
      return [{ start: startTime, end: endTime }];
    }

    const blocks = [];
    let currentStart = startTime;

    const sortedRests = [...todaySchedule.rest_times].sort((a, b) =>
      a.starting_time.localeCompare(b.starting_time),
    );

    for (const rest of sortedRests) {
      const restStart = formatTime(rest.starting_time);
      const restEnd = formatTime(rest.finish_time);

      if (currentStart < restStart) {
        blocks.push({
          start: currentStart,
          end: restStart,
        });
      }

      currentStart = restEnd;
    }

    // Final block after last rest
    if (currentStart < endTime) {
      blocks.push({
        start: currentStart,
        end: endTime,
      });
    }

    return blocks;
  };

  const getDoctorId = () => {
    const doctorId = localStorage.getItem("doctorId");
    if (!doctorId) {
      return null;
    }
    return doctorId;
  };

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();

      let appointmentsList = [];

      if (Array.isArray(response.data)) {
        appointmentsList = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        appointmentsList = response.data.data;
      }

      setAppointments(appointmentsList);

      const today = new Date().toISOString().split("T")[0];
      const todayApps = appointmentsList.filter((app) => app.date === today);
      setAppointmentsCount(todayApps.length);

      const completed = appointmentsList.filter(
        (app) => app.status === "completed",
      ).length;
      const canceled = appointmentsList.filter(
        (app) => app.status === "canceled",
      ).length;
      setCompletedCount(completed);
      setCanceledCount(canceled);

      const totalSlots = 8;
      const percentage = (todayApps.length / totalSlots) * 100;
      setCapacityPercentage(Math.round(percentage));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointmentsCount(0);
      setCompletedCount(0);
      setCanceledCount(0);
      setCapacityPercentage(0);
    }
  };

  const fetchDoctorInfo = async () => {
    try {
      const doctorId = getDoctorId();
      if (!doctorId) {
        setDoctorName("");
        setCurrentDoctor(null);
        return;
      }

      const response = await getAllDoctors();

      let doctorsList = [];
      if (Array.isArray(response.data)) {
        doctorsList = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        doctorsList = response.data.data;
      }

      const doctor = doctorsList.find((doc) => String(doc.id) === doctorId);
      setCurrentDoctor(doctor || null);

      if (doctor) {
        const displayName = doctor.username || "Doctor";
        setDoctorName(displayName);
        localStorage.setItem("doctorUsername", displayName);
      } else {
        setDoctorName("");
      }
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      setDoctorName("");
      setCurrentDoctor(null);
    }
  };

  const getMinEditableEndDate = () => {
    const today = new Date();
    const startDate = new Date(vacationStart);

    if (today < startDate) {
      const minDate = new Date(vacationStart);
      minDate.setDate(minDate.getDate() + 1);
      return minDate.toISOString().split("T")[0];
    } else {
      return today.toISOString().split("T")[0];
    }
  };

  const checkVacationStatus = async () => {
    try {
      const response = await getLeave();

      let vacations = [];

      if (Array.isArray(response.data)) {
        vacations = response.data;
      } else if (Array.isArray(response.data?.data)) {
        vacations = response.data.data;
      } else if (response.data?.data && !Array.isArray(response.data.data)) {
        vacations = [response.data.data];
      }

      const doctorId = localStorage.getItem("doctorId");
      const myVacations = vacations.filter(
        (v) => !v.doctor_id || String(v.doctor_id) === doctorId,
      );

      if (myVacations.length > 0) {
        const v = myVacations[0];
        setVacationMode(true);
        setLeaveId(v.id);
        setVacationStart(v.starting_date);
        setVacationEnd(v.finish_date);
      } else {
        setVacationMode(false);
        setLeaveId(null);
        setVacationStart("");
        setVacationEnd("");
      }
    } catch (error) {
      console.error("Vacation error:", error);
      setVacationMode(false);
    }
  };

  useEffect(() => {
    checkVacationStatus();
    fetchDoctorInfo();
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const doctorId = getDoctorId();
        if (!doctorId) {
          setSchedule(null);
          return;
        }
        const response = await getSchedule(doctorId);
        setSchedule(response.data);
      } catch (err) {
        console.error("Schedule error:", err);
        setSchedule(null);
      }
    };
    fetchSchedule();
  }, []);

  const getMinStartDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    return minDate.toISOString().split("T")[0];
  };

  const getMinEndDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 8);
    return minDate.toISOString().split("T")[0];
  };

  const getReturnDate = (vacationEndDate) => {
    const returnDate = new Date(vacationEndDate);
    returnDate.setDate(returnDate.getDate() + 1);
    return formatDisplayDate(returnDate.toISOString().split("T")[0]);
  };

  const openVacationModal = async () => {
    await checkVacationStatus();

    if (vacationMode) {
      openEndDateModal();
      return;
    }
    setTempVacationStart("");
    setTempVacationEnd("");
    setShowVacationModal(true);
  };

  const openEndDateModal = () => {
    setNewEndDate(vacationEnd);
    setShowEndDateModal(true);
  };

  const closeEndDateModal = () => {
    setShowEndDateModal(false);
    setNewEndDate("");
  };

  const confirmEndDateChange = async () => {
    if (!newEndDate) return;

    setLoading(true);
    try {
      await updateLeave(leaveId, { finish_date: newEndDate });
      await checkVacationStatus();
      alert("Vacation end date updated successfully!");
      closeEndDateModal();
    } catch (error) {
      console.error("Error updating end date:", error);
      alert(`Error: ${error.response?.data?.message || "Please try again"}`);
    } finally {
      setLoading(false);
    }
  };

  const closeVacationModal = () => {
    setShowVacationModal(false);
    setTempVacationStart("");
    setTempVacationEnd("");
  };

  const confirmVacation = async () => {
    if (!tempVacationStart || !tempVacationEnd) return;

    setLoading(true);
    try {
      await addLeave({
        starting_date: tempVacationStart,
        finish_date: tempVacationEnd,
      });
      await checkVacationStatus();
      alert("Vacation scheduled successfully!");
      closeVacationModal();
    } catch (error) {
      console.error("Error creating vacation:", error);
      if (error.response?.status === 409) {
        alert("You already have an active vacation. Refreshing...");
        await checkVacationStatus();
      } else {
        alert(`Error: ${error.response?.data?.message || "Please try again"}`);
        console.log(error.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelVacation = async () => {
    if (!leaveId) {
      alert("No active vacation found to cancel.");
      return;
    }

    setLoading(true);
    try {
      await deleteLeave(leaveId);
      await checkVacationStatus();
      alert("Availability reopened successfully!");
    } catch (error) {
      console.error("Error deleting vacation:", error);
      if (error.response?.status === 404) {
        alert("Vacation not found.");
        await checkVacationStatus();
      } else {
        alert(`Error: ${error.response?.data?.message || "Please try again"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDisplayName = () => {
    if (doctorName && doctorName !== "Doctor") {
      return `${getGreeting()}, ${doctorName}.`;
    }
    return `${getGreeting()}, Doctor.`;
  };

  const getProfileName = () => {
    if (doctorName && doctorName !== "Doctor") {
      return doctorName;
    }
    return "Doctor";
  };

  const doctorProfilePic =
    currentDoctor?.picture || currentDoctor?.photo_url || null;
  const doctorSpecialty = currentDoctor?.specialty || "Healthcare Provider";
  const doctorEmail = currentDoctor?.email || "";
  const doctorPhone = currentDoctor?.phone || "";
  const doctorBio =
    doctorData?.data.description ||
    "Dedicated healthcare professional committed to providing excellent patient care.";
  if (isLoading || isFetching) {
    return (
      <div className="request-wait-dash">
        <TailSpin width="60" height="60" color="#215eed"></TailSpin>
      </div>
    );
  }
  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <p className="dash-sidebar-label">Clinical Tools</p>
          <p className="dash-sidebar-subtitle">Practitioner Portal</p>
        </div>
        <nav className="dash-sidebar-nav">
          <a className="dash-active" href="#">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              grid_view
            </span>
            Overview
          </a>
          <a href="#">
            <span className="material-symbols-outlined">group</span>
            Patient List
          </a>
        </nav>
        <div className="dash-sidebar-footer">
          <a className="dash-help" href="#">
            <span className="material-symbols-outlined">help</span>
            Help Center
          </a>
          <a onClick={() => logout.mutate()} className="dash-logout" href="#">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </a>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-main-inner">
          <header className="dash-welcome-header">
            <h1>{getDisplayName()}</h1>
            <p>
              You have{" "}
              <span className="dash-highlight">
                {appointmentsCount} appointment
                {appointmentsCount !== 1 ? "s" : ""}
              </span>{" "}
              scheduled for today.
            </p>
            {vacationMode && (
              <div className="dash-vacation-notice">
                <span className="material-symbols-outlined">beach_access</span>
                <span>
                  On vacation from {formatDisplayDate(vacationStart)} to{" "}
                  {formatDisplayDate(vacationEnd)}. Returning on{" "}
                  {getReturnDate(vacationEnd)}
                </span>
              </div>
            )}
          </header>

          <div className="dash-grid">
            <div className="dash-col-left">
              <section className="dash-card dash-availability-card">
                <div className="dash-availability-header">
                  <h2>Availability Control</h2>
                  <div className="dash-status-control">
                    <span className="dash-status-control-label">
                      Status Control
                    </span>
                    <div className="dash-toggle-group">
                      <button
                        className={
                          !isOnline ? "dash-off dash-active" : "dash-off"
                        }
                        onClick={() => setIsOnline(false)}
                      >
                        OFFLINE
                      </button>
                      <button
                        className={isOnline ? "dash-on dash-active" : "dash-on"}
                        onClick={() => setIsOnline(true)}
                      >
                        ONLINE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dash-current-hours">
                  <div className="dash-hours-info">
                    <span className="dash-hours-label">
                      Current Working Hours
                    </span>
                    <div
                      className="dash-hours-value"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {buildWorkBlocks().map((b, i) => (
                        <div
                          key={i}
                          className="dash-schedule-block"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ color: "#1976d2", fontSize: "20px" }}
                          >
                            schedule
                          </span>
                          <span style={{ fontWeight: 500, color: "#215eed" }}>
                            {b.start} — {b.end}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dash-quick-actions">
                  <button
                    className={`dash-qa-btn dash-stop ${vacationMode ? "dash-active-stop" : ""}`}
                    onClick={openVacationModal}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      {vacationMode ? "edit_calendar" : "beach_access"}
                    </span>
                    <span className="dash-label">
                      {loading ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="dash-spinner-white-small"></span>
                          Processing...
                        </span>
                      ) : vacationMode ? (
                        "Change End Date"
                      ) : (
                        "Take Time Off"
                      )}
                    </span>
                  </button>
                  <button
                    className={`dash-qa-btn dash-reopen ${!vacationMode ? "dash-active-reopen" : ""}`}
                    onClick={cancelVacation}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span className="dash-label">
                      {loading ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="dash-spinner-blue-small"></span>
                          Processing...
                        </span>
                      ) : (
                        "Reopen Availability"
                      )}
                    </span>
                  </button>
                </div>

                {showVacationModal && (
                  <div className="dash-calendar-overlay">
                    <div className="dash-calendar-modal">
                      <div className="dash-calendar-header">
                        <h3>Set Time Off</h3>
                        <button
                          className="dash-close-calendar"
                          onClick={closeVacationModal}
                        >
                          <span className="material-symbols-outlined">
                            close
                          </span>
                        </button>
                      </div>

                      <div className="dash-calendar-body">
                        <div className="dash-time-input-group">
                          <label>Start Date (minimum 7 days from today)</label>
                          <input
                            type="date"
                            className="dash-date-picker-input"
                            value={tempVacationStart}
                            onChange={(e) =>
                              setTempVacationStart(e.target.value)
                            }
                            min={getMinStartDate()}
                          />
                        </div>

                        <div className="dash-time-input-group">
                          <label>End Date (minimum 8 days from today)</label>
                          <input
                            type="date"
                            className="dash-date-picker-input"
                            value={tempVacationEnd}
                            onChange={(e) => setTempVacationEnd(e.target.value)}
                            min={getMinEndDate()}
                          />
                        </div>

                        {(tempVacationStart || tempVacationEnd) && (
                          <div className="dash-selected-date-info">
                            <span className="material-symbols-outlined">
                              info
                            </span>
                            <span>
                              Time off from{" "}
                              <strong>
                                {tempVacationStart
                                  ? formatDisplayDate(tempVacationStart)
                                  : "selected date"}
                              </strong>
                              {tempVacationEnd &&
                                ` to ${formatDisplayDate(tempVacationEnd)}`}
                              {tempVacationEnd && (
                                <span className="dash-note">
                                  {" "}
                                  (Returning on {getReturnDate(tempVacationEnd)}
                                  )
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="dash-calendar-footer">
                        <button
                          className="dash-btn-secondary"
                          onClick={closeVacationModal}
                        >
                          Cancel
                        </button>
                        <button
                          className="dash-btn-primary"
                          onClick={confirmVacation}
                          disabled={
                            !tempVacationStart || !tempVacationEnd || loading
                          }
                        >
                          {loading ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="dash-spinner-white-small"></span>
                              Processing...
                            </span>
                          ) : (
                            "Confirm Time Off"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showEndDateModal && (
                  <div className="dash-calendar-overlay">
                    <div className="dash-calendar-modal">
                      <div className="dash-calendar-header">
                        <h3>Change Vacation End Date</h3>
                        <button
                          className="dash-close-calendar"
                          onClick={closeEndDateModal}
                        >
                          <span className="material-symbols-outlined">
                            close
                          </span>
                        </button>
                      </div>

                      <div className="dash-calendar-body">
                        <div className="dash-time-input-group">
                          <label>
                            Current Start Date:{" "}
                            {formatDisplayDate(vacationStart)}
                          </label>
                          <label style={{ marginTop: "10px" }}>
                            Current End Date: {formatDisplayDate(vacationEnd)}
                          </label>
                          <label style={{ marginTop: "10px" }}>
                            New End Date
                          </label>
                          <input
                            type="date"
                            className="dash-date-picker-input"
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                            min={getMinEditableEndDate()}
                          />
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "10px",
                            }}
                          >
                            {new Date() < new Date(vacationStart)
                              ? `Note: Vacation hasn't started yet. End date must be after ${formatDisplayDate(vacationStart)}`
                              : `Note: You can end your vacation early. You'll return to work tomorrow.`}
                          </p>
                        </div>
                      </div>

                      <div className="dash-calendar-footer">
                        <button
                          className="dash-btn-secondary"
                          onClick={closeEndDateModal}
                        >
                          Cancel
                        </button>
                        <button
                          className="dash-btn-primary"
                          onClick={confirmEndDateChange}
                          disabled={
                            !newEndDate || newEndDate === vacationEnd || loading
                          }
                        >
                          {loading ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="dash-spinner-white-small"></span>
                              Processing...
                            </span>
                          ) : (
                            "Update End Date"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section
                className="dash-card dash-profile-card"
                onClick={() => setShowProfileModal(true)}
                style={{ cursor: "pointer" }}
              >
                <div className="dash-profile-bg-blob"></div>
                <div className="dash-profile-info">
                  <div className="dash-profile-avatar">
                    {doctorProfilePic ? (
                      <img
                        src={doctorProfilePic}
                        alt={doctorName}
                        className="dash-profile-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="dash-avatar-placeholder dash-large">${getProfileName().charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    ) : (
                      <div className="dash-avatar-placeholder dash-large">
                        {getProfileName().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="dash-profile-name">{getProfileName()}</p>
                    <p className="dash-profile-role">{doctorSpecialty}</p>
                  </div>
                </div>
                <div className="dash-profile-actions">
                  <button
                    className="dash-btn-view-profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileModal(true);
                    }}
                  >
                    VIEW FULL PROFILE
                  </button>
                </div>
              </section>
            </div>

            <div className="dash-col-right">
              <section className="dash-card dash-stats-card">
                <h3 className="dash-anal-head">Daily Statistics</h3>
                <div className="dash-stats-body">
                  <div>
                    <div className="dash-capacity-label">
                      <span>Capacity Used</span>
                      <span className="dash-capacity-pct">
                        {capacityPercentage}%
                      </span>
                    </div>
                    <div className="dash-progress-track">
                      <div
                        className="dash-progress-fill"
                        style={{ width: `${capacityPercentage}%` }}
                      ></div>
                    </div>
                    <p className="dash-capacity-note">
                      {appointmentsCount} of{" "}
                      {getTodaySchedule()?.max_appointments} slots booked for
                      today
                    </p>
                  </div>
                  <div className="dash-stat-mini-grid">
                    <div className="dash-stat-mini">
                      <p className="dash-stat-mini-label">Completed</p>
                      <p className="dash-stat-mini-val">{completedCount}</p>
                    </div>
                    <div className="dash-stat-mini">
                      <p className="dash-stat-mini-label">Canceled</p>
                      <p className="dash-stat-mini-val dash-red">
                        {canceledCount}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="dash-card dash-feedback-card">
                <div className="dash-feedback-header">
                  <h3 className="dash-anal-head">Patient Feedback</h3>
                </div>
                <div className="dash-review-box">
                  <p className="dash-review-text">
                    "Excellent care and very professional. The doctor took time
                    to explain everything thoroughly."
                  </p>
                  <p className="dash-review-author">— Recent Patient</p>
                </div>
                <button className="dash-reviews-btn">Read All Reviews</button>
              </section>
            </div>
          </div>
        </div>
      </main>
      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="dash-calendar-overlay"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="dash-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-profile-modal-header">
              <h3>Doctor Profile</h3>
              <button
                className="dash-close-calendar"
                onClick={() => setShowProfileModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="dash-profile-modal-body">
              <div className="dash-profile-modal-avatar">
                {doctorProfilePic ? (
                  <img
                    src={doctorProfilePic}
                    alt={doctorName}
                    className="dash-profile-modal-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `<div class="dash-profile-modal-placeholder">${getProfileName().charAt(0).toUpperCase()}</div>`;
                    }}
                  />
                ) : (
                  <div className="dash-profile-modal-placeholder">
                    {getProfileName().charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="dash-profile-modal-name">{getProfileName()}</h2>
              <p className="dash-profile-modal-specialty">{doctorSpecialty}</p>

              <div className="dash-profile-modal-details">
                <div className="dash-profile-modal-detail-item">
                  <span className="material-symbols-outlined">email</span>
                  <div>
                    <label>Email</label>
                    <p>{doctorEmail || "Not provided"}</p>
                  </div>
                </div>

                <div className="dash-profile-modal-detail-item">
                  <span className="material-symbols-outlined">phone</span>
                  <div>
                    <label>Phone</label>
                    <p>{doctorPhone || "Not provided"}</p>
                  </div>
                </div>

                <div className="dash-profile-modal-detail-item">
                  <span className="material-symbols-outlined">badge</span>
                  <div>
                    <label>Doctor ID</label>
                    <p>{getDoctorId() || "Not available"}</p>
                  </div>
                </div>

                <div className="dash-profile-modal-detail-item">
                  <span className="material-symbols-outlined">info</span>
                  <div>
                    <label>Bio</label>
                    <p>{doctorBio}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-profile-modal-footer">
              <button
                className="dash-btn-secondary"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
              <button className="dash-btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
