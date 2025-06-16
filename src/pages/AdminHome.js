import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaEye } from "react-icons/fa";
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
        if (uniqueTeams.length > 0) {
          setSelectedTeam(uniqueTeams[0]);
        }

        // โหลด evaluateesStatus จาก localStorage มาไว้ใน state
        const allEvaluations = JSON.parse(localStorage.getItem("evaluateesStatus") || "[]");
        setEvaluations(allEvaluations);
      });
  }, []);


    const getEvaluatorStatus = (evaluatorId) => {
    const evaluator = allUsers.find(u => u.ID === evaluatorId);
    if (!evaluator) return "incompleted";

    const teamMembers = allUsers
        .filter(u => u.Team === evaluator.Team && u.ID !== evaluatorId)
        .map(u => u.ID);

    const allEvaluations = JSON.parse(localStorage.getItem("evaluations") || "[]");

    const evaluatorData = allEvaluations.find(e => e.evaluatorId === evaluatorId);

    if (!evaluatorData || !evaluatorData.evaluations) return "incompleted";

    const completedIds = evaluatorData.evaluations
        .filter(e => e.status === "completed")
        .map(e => e.evaluateeId);

    if (teamMembers.every(memberId => completedIds.includes(memberId))) {
        return "completed";
    } else if (completedIds.length > 0) {
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
        const userStatus = getEvaluatorStatus(user.ID);
        return userStatus === status;
    }).length;
};


  const statusIcons = {
    completed: { icon: <FaCheckCircle color="green" />, text: "COMPLETE" },
    inprogress: { icon: <FaHourglassHalf color="orange" />, text: "IN PROGRESS" },
    incompleted: { icon: <FaTimesCircle color="red" />, text: "INCOMPLETE" },
    };

    const handleView = (userId) => {
    alert(`Checking evaluation progress for user ID: ${userId}`);
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
          onChange={(e) => setSelectedTeam(e.target.value)}
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
            const userStatus = getEvaluatorStatus(evaluator.ID);
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
