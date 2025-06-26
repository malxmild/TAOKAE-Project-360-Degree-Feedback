import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const location = useLocation();
  const initialTeam = location.state?.team;
  const { evaluatorId } = useParams();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [evaluator, setEvaluator] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(() => {
    const savedTeam = sessionStorage.getItem("selectedTeam");
    if (savedTeam) return savedTeam;
    if (initialTeam) return initialTeam;
    return "";
  });
  
  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    sessionStorage.setItem("selectedTeam", team);
  };

  const [allEvaluations, setAllEvaluations] = useState([]);

  const evaluateesWithStatus = useMemo(() => {
    if (!allUsers.length || !allEvaluations.length || !selectedTeam) return [];

    const evaluatorRole = evaluator?.Role || "";
    const selfId = `self-${evaluatorRole}`;

    const selfStatusEntry = allEvaluations.find((e) => {
      if (e.evaluateeId !== selfId || e.evaluatorId !== evaluatorId) return false;

      // เช็กว่าผู้ประเมินอยู่ในทีมนี้ (เผื่ออยู่หลายทีม)
      const isEvaluatorInTeam = allUsers.some(
        (u) => u.ID === evaluatorId && u.Team === selectedTeam
      );
      return isEvaluatorInTeam;
    });

// กำหนด status โดยพิจารณาทั้ง status และ feedback
let selfStatus = "incompleted";
if (selfStatusEntry?.status === "completed") {
  selfStatus = "completed";
} else if (
  selfStatusEntry?.feedback !== null &&
  selfStatusEntry?.feedback !== undefined &&
  selfStatusEntry?.feedback !== ""
) {
  selfStatus = "inprogress";
}


const selfEval = {
  ID: selfId,
  "Full Name": evaluator?.["Full Name"],
  Role: evaluatorRole,
  status: selfStatus,
  isSelf: true,
};


    // สมาชิกทีมที่ไม่ใช่ evaluator
    const teamMembers = allUsers.filter(
      (u) => u.Team === selectedTeam && u.ID !== evaluatorId
    );

    const membersWithStatus = teamMembers.map((member) => {
      const statusEntry = allEvaluations.find(
        (e) => e.evaluateeId === member.ID && e.evaluatorId === evaluatorId
      );
      return {
        ...member,
        status: statusEntry?.status || "incompleted",
      };
    });

    return [selfEval, ...membersWithStatus];
  }, [allUsers, allEvaluations, evaluator, evaluatorId, selectedTeam]);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then(res => res.json())
      .then(data => {
        setAllUsers(data);
        const foundEvaluator = data.find(user => user.ID === evaluatorId);
        setEvaluator(foundEvaluator);

        if (!selectedTeam) {
          if (initialTeam) {
            setSelectedTeam(initialTeam);
            sessionStorage.setItem("selectedTeam", initialTeam);
          } else if (foundEvaluator) {
            setSelectedTeam(foundEvaluator.Team);
            sessionStorage.setItem("selectedTeam", foundEvaluator.Team);
          }
        }
      });

    const evalData = JSON.parse(localStorage.getItem("evaluations") || "[]");
    setAllEvaluations(evalData);
  }, [evaluatorId, initialTeam, selectedTeam]);



  useEffect(() => {
    const fetchEvaluations = () => {
      fetch(`http://localhost:5000/evaluations`)
        .then(res => res.json())
        .then(data => setAllEvaluations(data))
        .catch(err => console.error("Error fetching evaluations:", err));
    };

    fetchEvaluations(); // ดึงข้อมูลตอนเริ่ม

    const intervalId = setInterval(fetchEvaluations, 10000); // ดึงทุก 10 วินาที

    return () => clearInterval(intervalId); // ล้าง interval ตอน component unmount
  }, []);


  useEffect(() => {
  console.log("allUsers:", allUsers);
  console.log("selectedTeam:", selectedTeam);
}, [allUsers, selectedTeam]);


  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="left">
          <h2>{evaluator?.["Full Name"]}</h2>
          <div>Role: {evaluator?.Role}</div>
          <div>ID: {evaluator?.ID}</div>
        </div>
        <div className="right">
          <label>Select Team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
          >
            {[...new Set(allUsers.filter((u) => u.ID === evaluatorId).map((u) => u.Team))].map(
              (team, idx) => (
                <option key={idx} value={team}>
                  {team}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <table className="evaluatee-status-table">
        <thead>
          <tr>
            <th>Evaluatee ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {evaluateesWithStatus.map((e) => (
            <tr key={e.ID} className={e.isSelf ? "self-eval-row" : ""}>
              <td>{e.ID}</td>
              <td>
                {e["Full Name"]} {e.isSelf && <span className="self-label">(Self)</span>}
              </td>
              <td>{e.Role}</td>
              <td>
                {e.status === "completed" ? (
                  <span className="status completed">
                    <FaCheckCircle color="green" /> Completed
                  </span>
                ) : e.status === "inprogress" ? (
                  <span className="status inprogress">
                    <FaHourglassHalf color="orange" /> In Progress
                  </span>
                ) : (
                  <span className="status incompleted">
                    <FaTimesCircle color="red" /> Incomplete
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default AdminDashboard;
