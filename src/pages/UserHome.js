import React, { useState, useEffect, useMemo } from "react";
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

  const continueEvaluate = (id) => {
    if (id.startsWith("self-")) {
      localStorage.setItem("selfInfo", JSON.stringify(userInfo));
    }
    navigate(`/evaluate/${id}`);
  };


  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(data);
        const myData = data.filter(u => u.ID === userInfo.id);
        const myMemberships = myData.map(item => ({
          team: item.Team,
          role: item.Role
        }));
        setMemberships(myMemberships);

        // อ่านค่า selectedMembership เก่าจาก localStorage
        const savedSelectedMembership = localStorage.getItem("selectedMembership");
        if (savedSelectedMembership) {
          try {
            const parsed = JSON.parse(savedSelectedMembership);
            // ตรวจสอบว่าทีมยังอยู่ใน myMemberships หรือไม่ (optional)
            const found = myMemberships.find(m => m.team === parsed.team && m.role === parsed.role);
            if (found) {
              setSelectedMembership(found);
              return;
            }
          } catch (e) {
            console.warn("Invalid saved selectedMembership in localStorage");
          }
        }

        // ถ้าไม่มีค่าเก่าหรือไม่เจอทีม ให้ตั้งเป็นทีมแรก
        setSelectedMembership(myMemberships[0]);
      })
      .catch((err) => console.error("Failed to load data:", err));
  }, []);

  const evaluatees = useMemo(() => {
  if (!selectedMembership) return [];

  const savedData = JSON.parse(localStorage.getItem("evaluateesStatus") || "[]");
  const selfId = `self-${selectedMembership.role}`;

  const selfEval = {
    id: selfId,
    name: userInfo.fullName,
    role: selectedMembership.role,
    status: (savedData.find(e => e.id === selfId)?.status) || "incompleted",
    feedbackSaved: (savedData.find(e => e.id === selfId)?.feedbackSaved) || null
  };

  const others = allUsers
    .filter(u => {
      if (u.ID === userInfo.id) return false;
      if (u.Team !== selectedMembership.team) return false;
      if (selectedMembership.role === "Sponsor") {
        return ["Member", "Co-sponsor", "Main-sponsor"].includes(u.Role);
      }
      if (selectedMembership.role === "Co-sponsor") {
        return ["Member", "Sponsor", "Main-sponsor"].includes(u.Role);
      }
      if (selectedMembership.role === "Member") {
        return ["Member", "Sponsor", "Main-sponsor"].includes(u.Role);
      }
      if (selectedMembership.role === "Main-sponsor") {
        return ["Co-sponsor", "Member"].includes(u.Role);
      }
      return false;
    })
    .map(u => {
      const saved = savedData.find(e => e.id === u.ID);
      return {
        id: u.ID,
        name: u["Full Name"],
        role: u.Role,
        status: saved ? saved.status : "incompleted",
        feedbackSaved: saved ? saved.feedbackSaved : null
      };
    });

  return [selfEval, ...others]; // ดัน self-evaluation ไว้บนสุด
}, [allUsers, selectedMembership]);


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
    const savedData = JSON.parse(localStorage.getItem("evaluateesStatus") || "[]");
    const updatedData = savedData.filter(e => e.id !== skipCandidateId);
    updatedData.push({ id: skipCandidateId, status: "completed", feedbackSaved: null });
    localStorage.setItem("evaluateesStatus", JSON.stringify(updatedData));
    setShowConfirmSkip(false);
    setSkipCandidateId(null);
    window.location.reload(); // reload เพื่ออัพเดตสถานะ
  };

const cancelSkip = () => {
  setShowConfirmSkip(false);
  setSkipCandidateId(null);
};

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
                        <button className="action-button btn-edit" onClick={() => continueEvaluate(e.id)}>
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
                            <FaBan /> Skip
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
            * ปุ่ม Skip ใช้ในกรณีที่ไม่เคยร่วมงานกัน
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

