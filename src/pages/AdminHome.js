import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(""); 
  const [evaluations, setEvaluations] = useState([]);


useEffect(() => {
  fetch(`${process.env.PUBLIC_URL}/data.json`)
    .then((res) => res.json())
    .then((data) => {
      setAllUsers(data);

      const uniqueTeams = [...new Set(data.map((item) => item.Team))];
      setTeams(uniqueTeams);

      // ถ้ามีทีมใน sessionStorage ให้ใช้ทีมที่เก็บไว้ ถ้าไม่มีค่อยใช้ทีมแรก
      const savedTeam = sessionStorage.getItem("selectedTeam");
      if (savedTeam && uniqueTeams.includes(savedTeam)) {
        setSelectedTeam(savedTeam);
      } else if (uniqueTeams.length > 0) {
        setSelectedTeam(uniqueTeams[0]);
      }
    });
  // ✅ โหลด evaluations จาก backend
  fetch("http://localhost:5000/evaluations")
    .then((res) => res.json())
    .then((data) => setEvaluations(data))
    .catch((err) => console.error("Failed to load evaluations", err));
}, []);


    const getEvaluatorStatus = (evaluatorId, teamName) => {
      const evaluator = allUsers.find(u => u.ID === evaluatorId);
      if (!evaluator) return "incompleted";

      // Filter team members เฉพาะทีมนี้
      const teamMembers = allUsers.filter(u => u.Team === teamName && u.ID !== evaluatorId);

      // Filter evaluations ของ evaluatorId + เฉพาะคนในทีมนี้
      const myEvals = evaluations.filter(e => 
        e.evaluatorId === evaluatorId && teamMembers.some(m => m.ID === e.evaluateeId)
      );

      if (myEvals.length === 0) return "incompleted";

      const completedCount = myEvals.filter(e => e.status === "completed").length;

      if (completedCount === teamMembers.length && completedCount > 0) {
        return "completed";
      } else if (completedCount > 0) {
        return "inprogress";
      } else {
        return "incompleted";
      }
    };



  const filteredUsers = allUsers.filter((u) => u.Team === selectedTeam);
  const evaluators = filteredUsers;

  const statusCount = (status) => {
    if (status === "all") {
        return filteredUsers.length;
    }
    return filteredUsers.filter((user) => {
        const userStatus = getEvaluatorStatus(user.ID, selectedTeam);
        return userStatus === status;
    }).length;
};


  const statusIcons = {
    completed: { icon: <FaCheckCircle color="green" />, text: "Completed" },
    inprogress: { icon: <FaHourglassHalf color="orange" />, text: "In Progress" },
    incompleted: { icon: <FaTimesCircle color="red" />, text: "Incompleted" },
    };

  const navigate = useNavigate();

  const handleView = (userId) => {
  navigate(`/admin-dashboard/${userId}`, {
    state: { team: selectedTeam }  
  });
};

  return (
    <div className="admin-home-container">
      <div className="admin-header">
        <div className="title">360 Feedback Report Tracking</div>
        <div className="admin-icon">Admin</div>
      </div>

      <div className="dropdown-container">
        <label>Select Team:</label>
        <select
          className="role-select"
          value={selectedTeam}
          onChange={(e) => {
            setSelectedTeam(e.target.value);
            sessionStorage.setItem("selectedTeam", e.target.value); // เก็บใน sessionStorage
          }}
        >
          {teams.map((team, index) => (
            <option key={index} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <div className="summary-cards">
        <div className="summary-card all">
          <div>All</div>
          <div className="count">{statusCount("all")}</div>
        </div>
        <div className="summary-card complete">
          <div>Complete</div>
          <div className="count">{statusCount("completed")}</div>
        </div>
        <div className="summary-card incomplete">
          <div>Incomplete</div>
          <div className="count">{statusCount("incompleted")}</div>
        </div>
      </div>

      <table className="evaluate-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Dashboard</th>
          </tr>
        </thead>
        <tbody>
        {evaluators.map((evaluator, index) => {
            const userStatus = getEvaluatorStatus(evaluator.ID, selectedTeam);
            return (
            <tr key={index}>
                <td>{evaluator.ID}</td>
                <td>{evaluator["Full Name"]}</td>
                <td className={`status ${userStatus}`}>
                {statusIcons[userStatus]?.icon} {statusIcons[userStatus]?.text}
                </td>
                <td>
                <button className="view-button" onClick={() => handleView(evaluator.ID)}>
                    <FaEye />
                </button>
                </td>
            </tr>
            );
        })}
        </tbody>

      </table>
    </div>
  );
};

export default AdminHome;
