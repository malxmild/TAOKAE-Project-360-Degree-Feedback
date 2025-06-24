import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate,  useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "./EvaluationForm.css";
import TruePerformanceImg from '../assets/True_Performance.png';

// Section 1: 4C Core Values
const coreValues = [
  { key: "compassion", label: "COMPASSION (เห็นอกเห็นใจกัน)", description: "คิดถึงผู้อื่นและส่วนรวมเสมือนเป็นตนเอง รู้สึกเห็นใจ และพร้อมทำความเข้าใจสุขทุกข์ของผู้อื่น เพื่อให้ทุกชีวิตและโลกของพวกเราดีขึ้นในทุกวัน" },
  { key: "credibility", label: "CREDIBILITY (เชื่อถือได้)", description: "ความเชื่อใจที่สร้างจากความมุ่งมั่น ทุ่มเท และไม่ย่อท้อที่จะสร้างผลลัพธ์ให้ประสบความสำเร็จอย่างเต็มประสิทธิภาพเสมอ" },
  { key: "co_creation", label: "CO-CREATION (ร่วมกันสร้างสรรค์และเรียนรู้)", description: "ร่วมแรงร่วมใจภายในเป็นหนึ่ง ประสานพลังและความร่วมมือกับพันธมิตรเพื่อร่วมสร้างสรรค์และเรียนรู้ในการพัฒนาสิ่งใหม่" },
  { key: "courage", label: "COURAGE (กล้าคิดกล้าทำ)", description: "กล้าคิด กล้าลงมือทำสิ่งใหม่ ๆ แม้ต้องเผชิญกับความลำบากและท้าทาย พร้อมเปลี่ยนมุมมองเพื่อหาทางเลือกใหม่ ๆ ให้ตรงใจลูกค้าเสมอ" },
];

// Section 2: Operational Values
const operationalValues = [
  { key: "productivity", label: "Productivity Based", description: "Strive to achieve excellent performance, productivity & economic values. Push beyond limits to generate revenue, reduce cost, and exceed customer's expectations." },
  { key: "high_quality", label: "High Quality Products & Services", description: "Continuously assess, develop, & deliver higher quality of works to ensure excellent products, solutions, & services." },
  { key: "dynamic_agile", label: "Dynamic & Agile", description: "Understand current business situation and adapt self accordingly. Analyze business risk, recover quickly from crisis and provide solutions." },
  { key: "open_transparent", label: "Open, Transparent, & Collaboration", description: "Eager to learn, seek feedback & opportunities for further development. Break silos & work collaborative to achieve economic values." },
  { key: "customer_centric", label: "Customer-Centric / Market-Driven", description: "Empathize with markets & customers’ needs. Contribute to products & solutions solving their pain-points & promote loyalty." },
  { key: "data_driven", label: "Data Driven", description: "Deliver results through accurate & meaningful data. Use data to track progress & find ways to enhance outcomes. Anticipate problems & offer solutions based on data." },
  { key: "innovation", label: "Innovation", description: "Never settle for what is and seeks ways to improve on all aspects. Initiate new ideas, create prototype, fail quickly, and learn to improve." },
  { key: "empowerment", label: "Empowerment", description: "Find ways for self & others to take actions effectively while considering calculated risks. Promote sense of trust & accountability within and across teams." },
];

// Section 3: True Performance
const performanceValues = [
  { key: "contribution_org", label: "Contribution to the Organization (การสร้างคุณค่าให้กับองค์กร)" },
  { key: "innovation_org", label: "Innovation for the Organization (สร้างสรรค์สิ่งใหม่เพื่อองค์กร)" },
  { key: "contribution_team", label: "Contribution to Team (การสร้างคุณค่าให้กับทีม)" },
];

const scoreOptions = [
  { value: 1, label: "Caution" },
  { value: 2, label: "Partially Meet" },
  { value: 3, label: "Good Achievement" },
  { value: 4, label: "Beyond Expectation" },
  { value: 5, label: "True Excellence" },
];

export default function EvaluationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  let savedData = [];
    try {
      savedData = JSON.parse(localStorage.getItem("evaluateesStatus")) || [];
    } catch {
      savedData = [];
    }

  const existing = savedData.find(e => e.evaluateeId === id);

  const initialFormData = useMemo(() => {
    return existing?.feedbackSaved || {
      core: Object.fromEntries(coreValues.map(q => [q.key, 0])),
      operational: Object.fromEntries(operationalValues.map(q => [q.key, 0])),
      performance: Object.fromEntries(performanceValues.map(q => [q.key, 0])),
      performanceComments: { contribution: "", innovation: "", team: "" },
      strengths: "", developments: ""
    };
  }, [existing]);

  const [formData, setFormData] = useState(initialFormData);

  const [evaluateeInfo, setEvaluateeInfo] = useState(null);

  useEffect(() => {
  if (id.startsWith("self-")) {
    const selfInfo = JSON.parse(localStorage.getItem("selfInfo"));
    if (selfInfo) {
      const role = id.replace("self-", ""); // ดึง role จาก id เช่น self-Sponsor => Sponsor
      setEvaluateeInfo({
        "Full Name": selfInfo.fullName,
        "Role": role
      });
    } else {
      console.error("ไม่พบ selfInfo ใน localStorage");
    }
  } else {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((res) => res.json())
      .then((data) => setEvaluateeInfo(data.find(u => u.ID === id)))
      .catch((err) => console.error("Failed to load evaluatee info:", err));
  }
}, [id]);

const location = useLocation();
const isEdit = location.state?.isEdit || false;

const [showWarning, setShowWarning] = useState(false);
const [goBackConfirmed, setGoBackConfirmed] = useState(false);

useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (isEdit && !goBackConfirmed) {
      e.preventDefault();
      e.returnValue = ""; // สำหรับบางเบราว์เซอร์
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isEdit, goBackConfirmed]);

const saveData = useCallback((status, data = null) => {
  const payload = data || formData;
  const existingData = JSON.parse(localStorage.getItem("evaluateesStatus")) || [];
  const updatedData = existingData.filter(e => e.evaluateeId !== id);
  updatedData.push({ evaluateeId: id, status, feedbackSaved: payload });
  localStorage.setItem("evaluateesStatus", JSON.stringify(updatedData));
}, [id, formData]);

  useEffect(() => {
    if (!existing || existing.status !== "completed") {
      saveData("inprogress", formData); // <-- ตอนนี้ยังเซฟ id ไม่ได้
      fetch("http://localhost:5000/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatorId: "90010683",
          evaluateeId: id,
          status: "inprogress",
          feedback: formData
        }),
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to mark inprogress");
        return res.json();
      })
      .catch(err => console.error("Failed to sync inprogress:", err));
    }
  }, [existing, formData, saveData, id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // รวบรวมทุกคะแนนทั้งหมด
    const allScores = [
      ...Object.entries(formData.core),
      ...Object.entries(formData.operational),
      ...Object.entries(formData.performance),
    ];

    // หาว่าข้อไหนยังเป็น 0 (ยังไม่เลือก)
    const missingScore = allScores.find(([key, value]) => !value || value === 0);

    if (missingScore) {
      const missingKey = missingScore[0];
      document.getElementById(`question-${missingKey}`).scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่ง");
      return;
    }

    // ตรวจสอบช่องข้อความ
    if (!formData.performanceComments.contribution) {
      document.getElementById('contribution-comment').scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลการสร้างคุณค่าให้กับองค์กร");
      return;
    }

    if (!formData.performanceComments.innovation) {
      document.getElementById('innovation-comment').scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลสร้างสรรค์สิ่งใหม่เพื่อองค์กร");
      return;
    }

    if (!formData.performanceComments.team) {
      document.getElementById('team-comment').scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลการสร้างคุณค่าให้กับทีม");
      return;
    }

    if (!formData.strengths) {
      document.getElementById('strengths').scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลสิ่งที่เป็นจุดแข็ง");
      return;
    }

    if (!formData.developments) {
      document.getElementById('developments').scrollIntoView({ behavior: 'smooth' });
      alert("กรุณากรอกข้อมูลสิ่งที่ควรพัฒนา");
      return;
    }

    // บันทึก localStorage ก่อน
  saveData("completed", formData);

  // หา record ใน localStorage (ตอนนี้ใช้ id เป็น key)
  const savedData = JSON.parse(localStorage.getItem("evaluateesStatus")) || [];
  const existingEntry = savedData.find(e => e.evaluateeId === id);
  if (!existingEntry) {
    alert("ไม่พบข้อมูลสำหรับบันทึก");
    return;
  }

    // เรียก API PUT ให้ถูกต้อง
    fetch(`http://localhost:5000/evaluations?evaluatorId=90010683&evaluateeId=${id}`)
      .then(res => res.json())
      .then(([entry]) => {
        if (!entry || !entry.id) throw new Error("ไม่พบข้อมูลเพื่ออัปเดต");

        return fetch(`http://localhost:5000/evaluations/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: entry.id,
            evaluatorId: "90010683",
            evaluateeId: id,
            status: "completed",
            feedback: formData,
          }),
        });
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save to server");
        return res.json();
      })
      .then(() => {
        alert("ส่งแบบฟอร์มเรียบร้อย");
        navigate("/userhome");
      })
      .catch((err) => {
        console.error("Submit error:", err);
        alert("เกิดข้อผิดพลาดในการบันทึก");
      });

  };

  const renderScoreGroup = (questions, partKey) => (
    <>
      {questions.map((q) => (
        <div key={q.key} id={`question-${q.key}`} className="question-block">
          <label className="question-label">{q.label}</label>
          {q.description && (
            <div className="question-description">
              {q.description}
            </div>
          )}

          <div className="score-labels" style={{ display: "flex", justifyContent: "space-around" }}>
            {scoreOptions.map((opt) => (
              <div key={opt.value} style={{ flex: 1, textAlign: "center" }}>
                {opt.label}
              </div>
            ))}
          </div>

          <div className="score-radio-group">
          {scoreOptions.map((opt) => (
            <label key={opt.value} className="score-option">
              <input
                type="radio"
                name={q.key}
                value={opt.value}
                checked={formData[partKey][q.key] === opt.value}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    [partKey]: {
                      ...prev[partKey],
                      [q.key]: parseInt(e.target.value),
                    },
                  }));
                }}
              />
              <div className="score-circle"></div>
              <div className="score-value">{opt.value}</div>
            </label>
          ))}
        </div>
        </div>
      ))}
    </>
  );

  const handleBack = () => {
  if (isEdit) {
    setShowWarning(true);  // แสดงป๊อปอัพเตือน
  } else {
    navigate(-1);          // ถ้าไม่ใช่ mode แก้ไข ย้อนกลับทันที
  }
};


  return (
    <div className="form-container">
      <div className="header">
        <div className="header-left">
        <button
          type="button"
          className="btn-back-header"
          onClick={handleBack}
          aria-label="ย้อนกลับ"
        >
          <FiArrowLeft size={24} />
        </button>
        TAOKAE Project 360 Degree Feedback
        </div>
        <div className="header-right">
          {evaluateeInfo ? (
  <>
            {/* สำหรับ desktop */}
            <div className="evaluatee-desktop">
              <div className="label">
                {id.startsWith("self-") ? "ประเมินตัวเอง:" : "ผู้ถูกประเมิน:"}
              </div>
              <div className="name">{evaluateeInfo["Full Name"]}</div>
              <div className="role">{evaluateeInfo.Role}</div>
            </div>

            {/* สำหรับ mobile */}
            <div className="evaluatee-mobile">
              <span className="label">
                {id.startsWith("self-") ? "ประเมินตัวเอง: " : "ผู้ถูกประเมิน: "}
              </span>
              <span className="name">{evaluateeInfo["Full Name"]}</span>
              <span className="role"> ({evaluateeInfo.Role})</span>
            </div>
          </>
        ) : (
          <div>Loading...</div>
        )}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <h4>Section 1: 4C Core Values</h4>
        {renderScoreGroup(coreValues, "core")}

        <h4>Section 2: Operational Values</h4>
        {renderScoreGroup(operationalValues, "operational")}

        <h4>Section 3: True Performance</h4>
        <img 
          src={TruePerformanceImg} 
          alt="คำอธิบายรูปภาพ" 
          style={{ maxWidth: "100%", marginBottom: "20px" }} 
        />
        {renderScoreGroup(performanceValues, "performance")}

        <div className="question-block">
          <label>
            ข้อมูลสนับสนุนด้านการสร้างคุณค่าให้กับองค์กร<br />
            <span style={{ fontSize: "0.9em", color: "#000" }}>
              Identify your reason for rating Contribution to the Organization
            </span>
          </label>
          <textarea
          id="contribution-comment"
            rows={3}
            className="google-form-textarea"
            value={formData.performanceComments.contribution}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                performanceComments: { ...prev.performanceComments, contribution: e.target.value },
              }))
            }
          />
        </div>

        <div className="question-block">
          <label>
            ข้อมูลสนับสนุนด้านสร้างสรรค์สิ่งใหม่เพื่อองค์กร<br />
            <span style={{ fontSize: "0.9em", color: "#000" }}>
              Identify your reason for rating Innovation for the Organization
            </span>
          </label>
          <textarea
            id="innovation-comment"
            rows={3}
            className="google-form-textarea"
            value={formData.performanceComments.innovation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                performanceComments: { ...prev.performanceComments, innovation: e.target.value },
              }))
            }
          />
        </div>

        <div className="question-block">
          <label>
            ข้อมูลสนับสนุนด้านการสร้างคุณค่าให้กับทีม<br />
            <span style={{ fontSize: "0.9em", color: "#000" }}>
            Identify your reason for rating Contribution to Team
            </span>
          </label>
          <textarea
            id="team-comment"
            rows={3}
            className="google-form-textarea"
            value={formData.performanceComments.team}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                performanceComments: { ...prev.performanceComments, team: e.target.value },
              }))
            }
          />
        </div>

        <h4>Section 4: Overall Performance</h4>
        <div className="question-block">
          <label>สิ่งที่เป็นจุดแข็ง (Strengths)</label><br />
          <textarea
          id="strengths"
            rows={3}
            className="google-form-textarea"
            value={formData.strengths}
            onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))}
          />
        </div>

        <div className="question-block">
          <label>สิ่งที่ควรพัฒนา (Development Areas)</label><br />
          <textarea
            id="developments"
            rows={3}
            className="google-form-textarea"
            value={formData.developments}
            onChange={(e) => setFormData((prev) => ({ ...prev, developments: e.target.value }))}
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">Submit</button>
        </div>
        
      </form>
      {showWarning && (
        <div className="confirm-evaluate-overlay">
          <div className="confirm-evaluate-modal">
            <p>หากมีการเปลี่ยนแปลงการประเมิน กรุณากดส่งอีกครั้ง</p>
            <div className="confirm-evaluate-buttons">
              <button className="btn-no" onClick={() => setShowWarning(false)}>รับทราบ</button>
              <button className="btn-yes" onClick={() => {
                setGoBackConfirmed(true);
                navigate("/userhome");
              }}>ไม่เปลี่ยนแปลงคะแนน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
