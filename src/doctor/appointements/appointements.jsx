import { useState, useEffect } from "react";
import "./appointements.css";
import { getAppointments } from "../../api/api";
import { useTheme } from "../contexts/themeContext";
import { TailSpin } from "react-loader-spinner";

function Request() {
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, statusFilter, searchTerm]);

  const itemsPerPage = 5;

  const formatStatus = (status) => {
    return status;
  };

  const getOnlyDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Fetch from backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await getAppointments();
        console.log("APPOINTMENTS RESPONSE:", res);

        // Handle different response structures
        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          data = res.data.data;
        } else if (
          res.data?.appointments &&
          Array.isArray(res.data.appointments)
        ) {
          data = res.data.appointments;
        } else {
          data = [];
        }

        console.log("EXTRACTED DATA:", data);

        const validAppointments = data.filter((item) => {
          const firstName = item.patient?.first_name;
          const lastName = item.patient?.last_name;

          const isValid =
            firstName &&
            lastName &&
            firstName !== "" &&
            lastName !== "" &&
            firstName !== "string" &&
            lastName !== "string";

          return isValid;
        });

        const formatted = validAppointments.map((item) => {
          const patientName =
            `${item.patient?.first_name || ""} ${item.patient?.last_name || ""}`.trim();

          let pictureUrl = null;
          if (
            item.patient?.picture &&
            item.patient.picture !== "string" &&
            item.patient.picture.startsWith("http")
          ) {
            pictureUrl = item.patient.picture;
          }

          // Generate fallback avatar if no picture
          if (!pictureUrl && patientName) {
            pictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=215eed&color=fff&length=2`;
          }

          return {
            id: item.id,
            name: patientName,
            date: item.date,
            status: formatStatus(item.status),
            picture: pictureUrl,
            initials: `${item.patient?.first_name?.[0] || ""}${item.patient?.last_name?.[0] || ""}`,
          };
        });

        console.log("FORMATTED APPOINTMENTS:", formatted);

        // Only add test appointments if no real data
        let allAppointments = [...formatted];
        if (formatted.length === 0) {
          const testAppointments = [
            {
              id: "test-1",
              name: "TEST - Zakii",
              date: new Date().toISOString().split("T")[0],
              status: "Canceled",
              picture: "https://randomuser.me/api/portraits/man/1.jpg",
              initials: "TZ",
            },
            {
              id: "test-2",
              name: "TEST - Ridha",
              date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
              status: "Scheduled",
              picture: "https://randomuser.me/api/portraits/men/1.jpg",
              initials: "TR",
            },
            {
              id: "test-3",
              name: "TEST - Ahmed",
              date: new Date(Date.now() + 172800000)
                .toISOString()
                .split("T")[0],
              status: "Completed",
              picture: "https://randomuser.me/api/portraits/man/3.jpg",
              initials: "TA",
            },
          ];
          allAppointments = [...formatted, ...testAppointments];
        }

        setRequests(allAppointments);
      } catch (err) {
        console.log("APPOINTMENTS ERROR:", err);
        // Fallback to test appointments if API fails
        const testAppointments = [
          {
            id: "test-1",
            name: "TEST - Zakii",
            date: new Date().toISOString().split("T")[0],
            status: "Canceled",
            picture: "https://randomuser.me/api/portraits/man/1.jpg",
            initials: "TZ",
          },
          {
            id: "test-2",
            name: "TEST - Ridha",
            date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            status: "Scheduled",
            picture: "https://randomuser.me/api/portraits/men/1.jpg",
            initials: "TR",
          },
          {
            id: "test-3",
            name: "TEST - Ahmed",
            date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
            status: "Completed",
            picture: "https://randomuser.me/api/portraits/man/3.jpg",
            initials: "TA",
          },
        ];
        setRequests(testAppointments);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getFilteredRequests = () => {
    const today = getOnlyDate(new Date());
    let endDate = new Date(today);

    if (dateFilter === "3days") {
      endDate.setDate(today.getDate() + 3);
    } else if (dateFilter === "7days") {
      endDate.setDate(today.getDate() + 7);
    } else {
      endDate = new Date(today);
    }

    return requests
      .filter((req) => {
        const reqDate = getOnlyDate(req.date);
        return reqDate >= today && reqDate <= endDate;
      })
      .filter((req) => {
        if (statusFilter === "all") return true;
        return req.status === statusFilter;
      })
      .filter((req) => {
        if (!searchTerm) return true;
        return req.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredRequests = getFilteredRequests();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const scheduledCount = requests.filter(
    (req) => req.status === "Scheduled",
  ).length;

  const completedCount = requests.filter(
    (req) => req.status === "Completed",
  ).length;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Scheduled":
        return "schedule";
      case "Completed":
        return "check_circle";
      case "Canceled":
        return "cancel";
      default:
        return "help";
    }
  };
  if (loading) {
    return (
      <div className="request-wait">
        <TailSpin width="60" height="60" color="#215eed"></TailSpin>
      </div>
    );
  }
  return (
    <div className="request-request-container">
      <div className="request-flex">
        <div className="request-page-header">
          <h2 className="request-page-header__title">
            Patient Appointment Requests
          </h2>
          <p className="request-page-header__subtitle">
            Review upcoming consultation bookings from your patients.
          </p>
        </div>
        <main className="request-main">
          <div className="request-filters-bar">
            <div className="request-filters-bar__left">
              <div className="request-filter-select-wrap">
                <span className="material-symbols-outlined request-filter-icon">
                  calendar_today
                </span>
                <select
                  className="request-filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="3days">Next 3 Days</option>
                  <option value="7days">Next 7 Days</option>
                </select>
                <span className="material-symbols-outlined request-filter-arrow">
                  expand_more
                </span>
              </div>

              <div className="request-filter-select-wrap">
                <span className="material-symbols-outlined request-filter-icon">
                  filter_list
                </span>
                <select
                  className="request-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
                <span className="material-symbols-outlined request-filter-arrow">
                  expand_more
                </span>
              </div>
            </div>

            <div className="request-search-wrap">
              <span className="material-symbols-outlined request-search-icon">
                search
              </span>
              <input
                className="request-search-input"
                type="text"
                placeholder="Search patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="request-table-container">
            <div className="request-table-scroll">
              <table className="request-data-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Date</th>
                    <th className="request-status-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <div className="request-loading-spinner"></div>
                        <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
                          Loading appointments...
                        </p>
                      </td>
                    </tr>
                  ) : currentRequests.length > 0 ? (
                    currentRequests.map((req) => {
                      const formattedDate = formatDate(req.date);
                      return (
                        <tr key={req.id}>
                          <td>
                            <div className="request-patient-cell">
                              <div className="request-patient-avatar">
                                {req.picture ? (
                                  <img
                                    src={req.picture}
                                    alt={req.name}
                                    className="request-patient-avatar-img"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }
                                    }}
                                  />
                                ) : null}

                                {/* Show initials if no picture */}
                                {!req.picture &&
                                req.initials &&
                                req.initials !== "" ? (
                                  <span className="request-patient-initials">
                                    {req.initials}
                                  </span>
                                ) : null}

                                <span
                                  className="material-symbols-outlined"
                                  style={{
                                    fontSize: "1.5rem",
                                    color: "#64748b",
                                    display: req.picture
                                      ? "none"
                                      : req.initials
                                        ? "none"
                                        : "flex",
                                  }}
                                >
                                  person
                                </span>
                              </div>
                              <div>
                                <div className="request-patient-name">
                                  {req.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="request-date-cell">{formattedDate}</td>
                          <td>
                            <div
                              className={`request-status-badge request-${req.status.toLowerCase()}`}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "14px" }}
                              >
                                {getStatusIcon(req.status)}
                              </span>
                              <span className="request-dot"></span>
                              {req.status}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "3rem", color: "#cbd5e1" }}
                        >
                          inbox
                        </span>
                        <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
                          No appointments found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredRequests.length > itemsPerPage && (
              <div className="request-pagination-container">
                <div className="request-pagination">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>

                  {Array.from({
                    length: Math.ceil(filteredRequests.length / itemsPerPage),
                  }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={
                        currentPage === index + 1 ? "request-active" : ""
                      }
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(filteredRequests.length / itemsPerPage),
                        ),
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(filteredRequests.length / itemsPerPage)
                    }
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="request-analytics-grid">
            <div className="request-analytics-card">
              <div className="request-analytics-card__icon request-analytics-card__icon--blue">
                <span className="material-symbols-outlined">
                  event_available
                </span>
              </div>
              <div className="analytic-text-container">
                <p className="request-analytics-card__label">
                  Scheduled Appointments
                </p>
                <p className="request-analytics-card__value">
                  {scheduledCount}
                </p>
              </div>
            </div>

            <div className="request-analytics-card">
              <div className="request-analytics-card__icon request-analytics-card__icon--green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="analytic-text-container">
                <p className="request-analytics-card__label">
                  Completed Appointments
                </p>
                <p className="request-analytics-card__value">
                  {completedCount}
                </p>
              </div>
            </div>

            <div className="request-analytics-card">
              <div className="request-analytics-card__icon request-analytics-card__icon--amber">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div className="analytic-text-container">
                <p className="request-analytics-card__label">
                  Total Appointments
                </p>
                <p className="request-analytics-card__value">
                  {requests.length}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Request;
