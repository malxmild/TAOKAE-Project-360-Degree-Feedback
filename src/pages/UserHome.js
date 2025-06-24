import React, { useState, useEffect} from "react";
import { FaCheckCircle, FaTimesCircle, FaEdit, FaBan, FaHourglassHalf} from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import './UserHome.css';

const userInfo = {
  fullName: "Yosapol Arttachariya",
  id: "90010683",
};

export default function UserHome() {
  const [allUsers, setAllUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [skipCandidateId, setSkipCandidateId] = useState(null);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [showConfirmEvaluate, setShowConfirmEvaluate] = useState(false);
  const [evaluateId, setEvaluateId] = useState(null);
  const navigate = useNavigate();

  const continueEvaluate = (id, isEdit = false) => {
    if (id.startsWith("self-")) {
      localStorage.setItem("selfInfo", JSON.stringify(userInfo));
    }

    navigate(`/evaluate/${id}`, { state: { isEdit } });
  };

  useEffect(() => {
    fetch(`http://localhost:5000/users?ID=${userInfo.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(myData => {
        if (!myData || myData.length === 0) {
          console.error("User info not found");
          return;
        }

        const myMemberships = myData.map(item => ({
          team: item.Team,
          role: item.Role,
        }));
        setMemberships(myMemberships);

        // ลองโหลดจาก localStorage
        const savedMembershipStr = localStorage.getItem("selectedMembership");
        let selected = null;

        if (savedMembershipStr) {
          try {
            const savedMembership = JSON.parse(savedMembershipStr);
            const found = myMemberships.find(m =>
              m.team === savedMembership.team && m.role === savedMembership.role
            );
            if (found) {
              selected = savedMembership;
            }
          } catch (e) {
            console.warn("Failed to parse selectedMembership from localStorage", e);
          }
        }

        // ถ้ายังไม่มี selectedMembership ใด ๆ เลย
        if (!selected && myMemberships.length > 0) {
          selected = myMemberships[0];
        }

        // ตั้งค่าการเลือก
        if (selected) {
          setSelectedMembership(selected);
        }
      })
      .catch(console.error);
  }, []); 


  useEffect(() => {
    if (!selectedMembership) return;

    // โหลดสมาชิกทีม
    fetch(`http://localhost:5000/users?Team=${encodeURIComponent(selectedMembership.team)}`)
      .then(res => res.json())
      .then(async teamMembers => {
        // โหลดสถานะการประเมินทั้งหมดจาก evaluations
        const evalRes = await fetch("http://localhost:5000/evaluations");
        const evals = await evalRes.json();

        // map สถานะให้แต่ละคน
        const evaluateesWithStatus = teamMembers.map(user => {
          const evalData = evals.find(e => 
            e.evaluateeId === user.ID && e.evaluatorId === userInfo.id
          );
          return {
            id: user.ID,
            name: user["Full Name"],
            role: user.Role,
            status: evalData?.status || "incompleted",
            feedbackSaved: evalData?.feedback || null,
          };
        });

        // รวม self-evaluation
        const selfId = `self-${selectedMembership.role}`;
        const selfEvalData = evals.find(e => 
          e.evaluateeId === selfId && e.evaluatorId === userInfo.id
        );
        const selfEval = {
        id: selfId,
        name: userInfo.fullName,
        role: selectedMembership.role,
        status: selfEvalData?.status || "incompleted", // ✅ ใช้ status ตรง ๆ
        feedbackSaved: selfEvalData?.feedback || null,
      };
        const filteredOthers = evaluateesWithStatus.filter(u => {
          if (u.id === userInfo.id) return false;
          if (selectedMembership.role === "Sponsor") {
            return ["Member", "Co-sponsor", "Main-sponsor"].includes(u.role);
          }
          if (selectedMembership.role === "Co-sponsor") {
            return ["Member", "Sponsor", "Main-sponsor"].includes(u.role);
          }
          if (selectedMembership.role === "Member") {
            return ["Member", "Sponsor", "Main-sponsor"].includes(u.role);
          }
          if (selectedMembership.role === "Main-sponsor") {
            return ["Co-sponsor", "Member"].includes(u.role);
          }
          return false;
        });

        setAllUsers([selfEval, ...filteredOthers]);
      })
      .catch(console.error);
  }, [selectedMembership]);

  const evaluatees = allUsers;

  const handleEvaluate = (id) => {
    setEvaluateId(id);
    setShowConfirmEvaluate(true);
  };

  const confirmEvaluate = () => {
    setShowConfirmEvaluate(false);
    if (evaluateId) {
      if (evaluateId.startsWith("self-")) {
        localStorage.setItem("selfInfo", JSON.stringify(userInfo));
      }
      navigate(`/evaluate/${evaluateId}`);
    }
  };

  const cancelEvaluate = () => {
    setShowConfirmEvaluate(false);
    setEvaluateId(null);
  };


  const confirmSkip = () => {
    if (!skipCandidateId) return;

    fetch("http://localhost:5000/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluatorId: userInfo.id,
        evaluateeId: skipCandidateId,
        status: "completed",
        feedback: null
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to skip");
        return res.json();
      })
      .then(() => {
        setShowConfirmSkip(false);
        setSkipCandidateId(null);
        window.location.reload(); // อัปเดตหน้าใหม่ให้สถานะรีเฟรช
      })
      .catch(err => {
        console.error("Skip failed", err);
        alert("ไม่สามารถ skip ได้");
      });
  };


const cancelSkip = () => {
  setShowConfirmSkip(false);
  setSkipCandidateId(null);
};

if (!selectedMembership || memberships.length === 0) {
    return <div>Loading data, please wait...</div>;
  }

  return (
    <div className="user-home-container">
      {selectedMembership && (
        <>
          <div className="header">
            <div className="header-left">Team: {selectedMembership.team}</div>
            <div className="header-right">
              <div className="name">{userInfo.fullName}</div>
              <div className="role-id">{selectedMembership.role} (ID: {userInfo.id})</div>
            </div>
          </div>

          <div className="dropdown-container">
            <label>Select Membership:</label>
            <select
              className="role-select"
              value={JSON.stringify(selectedMembership)}
              onChange={(e) => {
                const newMembership = JSON.parse(e.target.value);
                setSelectedMembership(newMembership);
                localStorage.setItem("selectedMembership", JSON.stringify(newMembership)); // บันทึกค่า
              }}
            >
              {memberships.map((m, index) => (
                <option key={index} value={JSON.stringify(m)}>
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
              {evaluatees.map(e => (
                <tr 
                  key={e.id} 
                  className={e.id.startsWith("self-") ? "self-eval-row" : ""}
                >
                  <td>
                    {e.name} 
                    {e.id.startsWith("self-") && <span className="self-label"> (Self)</span>}
                  </td>
                  <td>{e.role}</td>
                  <td className={
                    e.status === "completed" ? "status-completed" :
                    e.status === "inprogress" ? "status-inprogress" : "status-incompleted"
                  }>
                    {e.status === "completed" ? (
                      <><FaCheckCircle className="icon-complete" /> Completed</>
                    ) : e.status === "inprogress" ? (
                      <><FaHourglassHalf className="icon-inprogress" /> In Progress</>
                    ) : (
                      <><FaTimesCircle className="icon-incomplete" /> Incompleted</>
                    )}
                  </td>
                  <td>
                    {e.status === "completed" ? (
                      e.feedbackSaved ? (
                        <button className="action-button btn-edit" onClick={() => continueEvaluate(e.id, true)}>
                          <FaEdit /> Edit
                        </button>
                      ) : (
                        <span className="cannot-evaluate-text">Cannot Evaluate</span>
                      )
                    ) : e.status === "inprogress" ? (
                      <button className="action-button btn-feedback" onClick={() => continueEvaluate(e.id)}>
                        <FaEdit /> Continue
                      </button>

                    ) : (
                      <>
                        <button className="action-button btn-feedback" onClick={() => handleEvaluate(e.id)}>
                          <FaEdit /> Evaluate
                        </button>
                        {/* เงื่อนไขใหม่: ถ้าไม่ใช่ self ค่อยโชว์ปุ่ม Skip */}
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
          <div className="skip-explanation">
            * Not evaluate: ใช้ในกรณีที่ไม่สามารถประเมินผลการดำเนินงานได้
          </div>
        </>
      )}
      {showConfirmSkip && (
        <div className="confirm-skip-overlay">
          <div className="confirm-skip-modal">
            <p>ไม่สามารถดำเนินการประเมินผลได้</p>
            <div className="confirm-skip-buttons">
              <button className="btn-yes" onClick={confirmSkip}>Yes</button>
              <button className="btn-no" onClick={cancelSkip}>No</button>
            </div>
          </div>
        </div>
      )}
    {showConfirmEvaluate && (
        <div className="confirm-evaluate-overlay">
          <div className="confirm-evaluate-modal">
            <p>เริ่มดำเนินการประเมินผล?</p>
            <div className="confirm-evaluate-buttons">
              <button className="btn-yes" onClick={confirmEvaluate}>Yes</button>
              <button className="btn-no" onClick={cancelEvaluate}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

