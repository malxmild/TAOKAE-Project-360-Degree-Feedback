import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaEdit, FaBan, FaHourglassHalf } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './UserHome.css';

export default function UserHome() {
  const [userInfo, setUserInfo] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [skipCandidateId, setSkipCandidateId] = useState(null);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [showConfirmEvaluate, setShowConfirmEvaluate] = useState(false);
  const [evaluateId, setEvaluateId] = useState(null);
  const navigate = useNavigate();

  // 1️⃣ Decode token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        id: decoded.userid,
        name: decoded.name, // ✅ ต้องมี name มาจาก JWT ด้วย
        role: decoded.role
      });
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  // 2️⃣ Load user memberships
  useEffect(() => {
    if (!userInfo) return;
    fetch(`http://localhost:5000/api/users/${userInfo.id}`)
      .then(res => res.json())
      .then(data => {
        const myMemberships = Array.isArray(data) ? data : [data];
        const roles = myMemberships.map(item => ({
          team: item.department,
          role: item.position
        }));
        setMemberships(roles);

        const saved = localStorage.getItem("selectedMembership");
        let selected = roles[0];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (roles.some(r => r.team === parsed.team && r.role === parsed.role)) {
              selected = parsed;
            }
          } catch {}
        }
        setSelectedMembership(selected);
        localStorage.setItem("selectedMembership", JSON.stringify(selected));
      })
      .catch(err => console.error("❌ Failed to load user memberships:", err));
  }, [userInfo]);

  // 3️⃣ Load team members and evaluations
  useEffect(() => {
    if (!userInfo || !selectedMembership) return;

    fetch(`http://localhost:5000/api/users?department=${encodeURIComponent(selectedMembership.team)}`)
      .then(res => res.json())
      .then(async teamMembers => {
        const evalRes = await fetch("http://localhost:5000/api/evaluation_relations");
        const evals = await evalRes.json();

        const evaluatees = teamMembers.map(user => {
          const evalData = evals.find(e =>
            e.evaluatee_id === user.userid && e.evaluator_id === userInfo.id
          );
          return {
            id: user.userid,
            name: user.name,
            role: user.position,
            status: evalData?.status || "incompleted",
            feedbackSaved: evalData?.feedback || null,
          };
        });

        const selfId = `self-${selectedMembership.role}`;
        const selfEvalData = evals.find(e =>
          e.evaluatee_id === selfId && e.evaluator_id === userInfo.id
        );
        const selfEval = {
          id: selfId,
          name: `${userInfo.name} (Self)`,
          role: selectedMembership.role,
          status: selfEvalData?.status || "incompleted",
          feedbackSaved: selfEvalData?.feedback || null,
        };

        const filtered = evaluatees.filter(u => {
          if (u.id === userInfo.id) return false;
          const r = selectedMembership.role;
          if (r === "Sponsor") return ["Member", "Co-sponsor", "Main-sponsor"].includes(u.role);
          if (r === "Co-sponsor") return ["Member", "Sponsor", "Main-sponsor"].includes(u.role);
          if (r === "Member") return ["Member", "Sponsor", "Main-sponsor"].includes(u.role);
          if (r === "Main-sponsor") return ["Co-sponsor", "Member"].includes(u.role);
          return false;
        });

        setAllUsers([selfEval, ...filtered]);
      })
      .catch(console.error);
  }, [userInfo, selectedMembership]);

  const confirmEvaluate = () => {
    setShowConfirmEvaluate(false);
    navigate(`/evaluate/${evaluateId}`);
  };

  const confirmSkip = () => {
    fetch("http://localhost:5000/api/evaluation_relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluatorId: userInfo.id,
        evaluateeId: skipCandidateId,
        status: "completed",
      })
    })
      .then(() => window.location.reload())
      .catch(() => alert("Skip failed"));
  };

  if (!userInfo || !selectedMembership) return <div>Loading data, please wait...</div>;

  return (
    <div className="user-home-container">
      <div className="header">
        <div className="header-left">
          Team: {selectedMembership.team}
        </div>
        <div className="header-right">
          <div className="name">{userInfo.name}</div>
          <div className="role-id">{selectedMembership.role} (ID: {userInfo.id})</div>
        </div>
      </div>
      <div className="membership-selector">
      <label>Select Membership:</label>
      <select
        className="role-select"
        value={JSON.stringify(selectedMembership)}
        onChange={(e) => {
          const newMembership = JSON.parse(e.target.value);
          setSelectedMembership(newMembership);
          localStorage.setItem("selectedMembership", JSON.stringify(newMembership)); // บันทึกการเลือก
        }}
      >
        {memberships.map((m, idx) => (
          <option key={idx} value={JSON.stringify(m)}>
            {m.team} - {m.role}
          </option>
        ))}
      </select>
    </div>
      <table className="evaluate-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map(e => (
            <tr key={e.id} className={e.id.startsWith("self-") ? "self-eval-row" : ""}>
              <td>{e.name}</td>
              <td>{e.role}</td>
              <td className={`status-${e.status}`}>
                {e.status === "completed" ? <FaCheckCircle /> :
                 e.status === "inprogress" ? <FaHourglassHalf /> : <FaTimesCircle />}
                {" "}{e.status.charAt(0).toUpperCase() + e.status.slice(1)}
              </td>
              <td>
                {e.status === "completed" && e.feedbackSaved ? (
                  <button className="action-button btn-edit" onClick={() => navigate(`/evaluate/${e.id}`, { state: { isEdit: true } })}>
                    <FaEdit /> Edit
                  </button>
                ) : e.status === "inprogress" ? (
                  <button className="action-button btn-feedback" onClick={() => navigate(`/evaluate/${e.id}`)}>
                    <FaEdit /> Continue
                  </button>
                ) : (
                  <>
                    <button className="action-button btn-feedback" onClick={() => {
                      setEvaluateId(e.id);
                      setShowConfirmEvaluate(true);
                    }}>
                      <FaEdit /> Evaluate
                    </button>
                    {!e.id.startsWith("self-") && (
                      <button className="action-button btn-skip" onClick={() => {
                        setSkipCandidateId(e.id);
                        setShowConfirmSkip(true);
                      }}>
                        <FaBan /> Not Evaluate
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal: Confirm Evaluate */}
      {showConfirmEvaluate && (
        <div className="confirm-evaluate-overlay">
          <div className="confirm-evaluate-modal">
            <p>เริ่มดำเนินการประเมินผล?</p>
            <div className="confirm-evaluate-buttons">
              <button className="btn-yes" onClick={confirmEvaluate}>Yes</button>
              <button className="btn-no" onClick={() => {
                setShowConfirmEvaluate(false);
                setEvaluateId(null);
              }}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Skip */}
      {showConfirmSkip && (
        <div className="confirm-skip-overlay">
          <div className="confirm-skip-modal">
            <p>ไม่สามารถดำเนินการประเมินผลได้</p>
            <div className="confirm-skip-buttons">
              <button className="btn-yes" onClick={confirmSkip}>Yes</button>
              <button className="btn-no" onClick={() => {
                setShowConfirmSkip(false);
                setSkipCandidateId(null);
              }}>No</button>
            </div>
          </div>
        </div>
      )}

    </div>
    
  );
}

