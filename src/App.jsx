import { useState } from "react";

const SECTIONS = ["patient", "clinical", "investigations", "scores", "result"];

const SECTION_LABELS = {
  patient: "Patient Details",
  clinical: "Clinical Presentation",
  investigations: "Investigations",
  scores: "Risk Scores",
  result: "Triage Recommendation",
};

const ECG_OPTIONS = [
  "Normal sinus rhythm",
  "Left ventricular hypertrophy",
  "Right ventricular hypertrophy",
  "Atrial fibrillation",
  "ST elevation",
  "ST depression",
  "T-wave inversion",
  "Bundle branch block (LBBB)",
  "Bundle branch block (RBBB)",
  "Signs of pulmonary hypertension",
  "Not available",
];

const ECHO_OPTIONS = [
  "Normal LV function (EF ≥55%)",
  "Mildly reduced LV function (EF 45–54%)",
  "Moderately reduced LV function (EF 30–44%)",
  "Severely reduced LV function (EF <30%)",
  "Mitral stenosis",
  "Mitral regurgitation",
  "Aortic stenosis",
  "Aortic regurgitation",
  "Tricuspid regurgitation",
  "Pericardial effusion",
  "Pulmonary hypertension",
  "Congenital defect",
  "Not available",
];

const SYMPTOMS = [
  "Dyspnoea at rest",
  "Dyspnoea on exertion",
  "Orthopnoea",
  "Chest pain",
  "Syncope/pre-syncope",
  "Palpitations",
  "Leg oedema",
  "Haemoptysis",
  "Cyanosis",
  "Poor feeding (paediatric)",
];

const initialForm = {
  // Patient
  age: "",
  sex: "",
  weight: "",
  state: "",
  facility_level: "",
  // Clinical
  symptoms: [],
  nyha: "",
  duration_weeks: "",
  htn: false,
  dm: false,
  ckd: false,
  copd: false,
  prior_cardiac_surgery: false,
  // ECG
  ecg_findings: [],
  // Echo
  echo_findings: [],
  // Labs
  haemoglobin: "",
  wbc: "",
  platelets: "",
  sodium: "",
  potassium: "",
  urea: "",
  creatinine: "",
  // Scores
  euroscore_available: false,
  euroscore_value: "",
  urgency: "",
};

function caratLogic(form) {
  let score = 0;
  let flags = [];
  let dataGaps = [];

  // Age
  const age = parseInt(form.age);
  if (age > 65) { score += 2; flags.push("Age >65 increases operative risk"); }
  if (age < 5) { score += 3; flags.push("Paediatric patient — specialist paediatric cardiothoracic input required"); }

  // NYHA
  if (form.nyha === "III") { score += 2; flags.push("NYHA Class III — significant functional limitation"); }
  if (form.nyha === "IV") { score += 4; flags.push("NYHA Class IV — severe functional limitation, possible emergency referral"); }

  // Symptoms
  if (form.symptoms.includes("Dyspnoea at rest")) { score += 3; flags.push("Dyspnoea at rest — haemodynamic compromise likely"); }
  if (form.symptoms.includes("Syncope/pre-syncope")) { score += 3; flags.push("Syncope — consider critical aortic stenosis or arrhythmia"); }
  if (form.symptoms.includes("Haemoptysis")) { score += 2; flags.push("Haemoptysis — consider mitral stenosis or pulmonary pathology"); }
  if (form.symptoms.includes("Cyanosis")) { score += 4; flags.push("Cyanosis — urgent evaluation required"); }

  // ECG
  if (form.ecg_findings.includes("ST elevation")) { score += 5; flags.push("ST elevation — emergency cardiac referral required"); }
  if (form.ecg_findings.includes("Signs of pulmonary hypertension")) { score += 3; flags.push("ECG signs of pulmonary hypertension"); }
  if (form.ecg_findings.includes("Not available")) { dataGaps.push("ECG not performed — strongly recommended before referral decision"); }

  // Echo
  if (form.echo_findings.includes("Severely reduced LV function (EF <30%)")) { score += 4; flags.push("Severely reduced EF — high surgical risk, urgent cardiology review"); }
  if (form.echo_findings.includes("Moderately reduced LV function (EF 30–44%)")) { score += 2; flags.push("Moderately reduced LV function"); }
  if (form.echo_findings.includes("Aortic stenosis")) { score += 2; flags.push("Aortic stenosis — severity quantification needed if not done"); }
  if (form.echo_findings.includes("Pulmonary hypertension")) { score += 3; flags.push("Pulmonary hypertension on echo — increases surgical risk significantly"); }
  if (form.echo_findings.includes("Congenital defect")) { score += 2; flags.push("Congenital defect — specialist paediatric/adult congenital input needed"); }
  if (form.echo_findings.includes("Not available")) { dataGaps.push("Echocardiography not performed — essential for surgical planning"); }

  // Labs
  const hb = parseFloat(form.haemoglobin);
  if (hb && hb < 8) { score += 3; flags.push(`Haemoglobin ${hb} g/dL — severe anaemia increases perioperative risk`); }
  else if (hb && hb < 10) { score += 1; flags.push(`Haemoglobin ${hb} g/dL — moderate anaemia, optimise before surgery`); }

  const creat = parseFloat(form.creatinine);
  if (creat && creat > 200) { score += 3; flags.push(`Creatinine ${creat} μmol/L — significant renal impairment, escalates operative risk`); }
  else if (creat && creat > 130) { score += 1; flags.push(`Creatinine ${creat} μmol/L — mild-moderate renal impairment`); }

  const k = parseFloat(form.potassium);
  if (k && (k < 3.0 || k > 5.5)) { score += 2; flags.push(`Potassium ${k} mmol/L — electrolyte disturbance, correct before surgery`); }

  // Comorbidities
  if (form.htn) score += 1;
  if (form.dm) { score += 1; flags.push("Diabetes — wound healing and infection risk"); }
  if (form.ckd) { score += 2; flags.push("CKD — renal protection protocol required perioperatively"); }
  if (form.copd) { score += 1; flags.push("COPD — pulmonary function assessment recommended"); }
  if (form.prior_cardiac_surgery) { score += 3; flags.push("Prior cardiac surgery — redo sternotomy carries significantly elevated risk"); }

  // EuroSCORE
  const euro = parseFloat(form.euroscore_value);
  if (form.euroscore_available && euro) {
    if (euro > 10) { score += 4; flags.push(`EuroSCORE II ${euro}% — high operative mortality risk`); }
    else if (euro > 5) { score += 2; flags.push(`EuroSCORE II ${euro}% — intermediate operative risk`); }
    else { flags.push(`EuroSCORE II ${euro}% — low operative risk`); }
  } else {
    dataGaps.push("EuroSCORE II not calculated — consider calculating if patient is a surgical candidate");
  }

  // Urgency override
  if (form.urgency === "emergency") score = Math.max(score, 15);
  if (form.urgency === "urgent") score = Math.max(score, 10);

  // Decision
  let decision, decisionColor, decisionBg, actionSteps;

  if (score >= 12 || form.symptoms.includes("Cyanosis") || form.ecg_findings.includes("ST elevation")) {
    decision = "EMERGENCY REFERRAL";
    decisionColor = "#FF3B30";
    decisionBg = "rgba(255,59,48,0.08)";
    actionSteps = [
      "Transfer to nearest cardiothoracic centre immediately",
      "Stabilise haemodynamics en route — IV access, oxygen, monitoring",
      "Contact receiving cardiothoracic team by phone before transfer",
      "Send all available investigations with the patient",
      "Document transfer time and patient condition at departure",
    ];
  } else if (score >= 7) {
    decision = "URGENT REFERRAL";
    decisionColor = "#FF9500";
    decisionBg = "rgba(255,149,0,0.08)";
    actionSteps = [
      "Refer to cardiothoracic centre within 2–4 weeks",
      "Optimise reversible risk factors before referral (anaemia, electrolytes, infection)",
      "Ensure echocardiography and ECG are completed and included in referral letter",
      "Calculate EuroSCORE II if not already done",
      "Commence appropriate medical therapy while awaiting specialist review",
    ];
  } else if (score >= 3) {
    decision = "ELECTIVE REFERRAL";
    decisionColor = "#34C759";
    decisionBg = "rgba(52,199,89,0.08)";
    actionSteps = [
      "Refer to cardiothoracic outpatient clinic — routine appointment",
      "Complete all investigations prior to referral (ECG, echo, bloods, CXR)",
      "Optimise medical management of comorbidities",
      "Counsel patient about likely surgical pathway and what to expect",
      "Review in 4–6 weeks if no deterioration while awaiting appointment",
    ];
  } else {
    decision = "MANAGE LOCALLY";
    decisionColor = "#007AFF";
    decisionBg = "rgba(0,122,255,0.08)";
    actionSteps = [
      "Continue medical management at current facility",
      "Complete outstanding investigations",
      "Review clinical status in 4–6 weeks",
      "Reassess for referral if symptoms progress or new findings emerge",
      "Consider cardiology opinion if available locally before specialist referral",
    ];
  }

  return { decision, decisionColor, decisionBg, score, flags, dataGaps, actionSteps };
}

export default function CARAT() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const section = SECTIONS[step];

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleArray(field, value) {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  }

  function goNext() {
    if (step === SECTIONS.length - 2) {
      setResult(caratLogic(form));
    }
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
  }

  function goBack() {
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 200);
  }

  function reset() {
    setForm(initialForm);
    setResult(null);
    setStep(0);
  }

  const progress = ((step) / (SECTIONS.length - 1)) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0F1E",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#E8EAF0",
      padding: "0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <span style={{
            fontSize: "26px",
            fontWeight: "700",
            letterSpacing: "0.12em",
            color: "#C8A97E",
            fontFamily: "'Georgia', serif",
          }}>CARAT</span>
          <span style={{
            fontSize: "11px",
            color: "rgba(200,169,126,0.6)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
          }}>Cardiothoracic AI Referral & Triage</span>
        </div>
        <div style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.05em",
          textAlign: "right",
          fontFamily: "'Georgia', serif",
        }}>
          <div>Sub-Saharan Africa</div>
          <div style={{ color: "rgba(200,169,126,0.5)", marginTop: "2px" }}>Prototype v0.1</div>
        </div>
      </div>

      {/* Progress bar */}
      {section !== "result" && (
        <div style={{ height: "2px", background: "rgba(255,255,255,0.06)" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #C8A97E, #E8C99E)",
            transition: "width 0.4s ease",
          }} />
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
        padding: "40px 24px 80px",
        opacity: animating ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}>
       <a 
         href="/Feedback_Form.html" 
         target="_blank" 
         rel="noopener noreferrer" 
         style={{
           display: 'inline-block',
           padding: '10px 20px',
           backgroundColor: '#0070f3',
           color: 'white',
           textDecoration: 'none',
           borderRadius: '5px',
           fontWeight: 'bold',
           marginTop: '20px'
         }}
       >
         Give Feedback
       </a>
       {/* Section header */}
      {section !== "result" && (

        {/* Section header */}
        {section !== "result" && (
          <div style={{ marginBottom: "36px" }}>
            <div style={{
              fontSize: "11px",
              color: "rgba(200,169,126,0.6)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: "'Georgia', serif",
            }}>
              Step {step + 1} of {SECTIONS.length - 1}
            </div>
            <h2 style={{
              fontSize: "28px",
              fontWeight: "400",
              color: "#E8EAF0",
              margin: 0,
              letterSpacing: "0.01em",
            }}>{SECTION_LABELS[section]}</h2>
          </div>
        )}

        {/* PATIENT */}
        {section === "patient" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <FieldRow>
              <Field label="Age (years)">
                <Input value={form.age} onChange={v => update("age", v)} placeholder="e.g. 42" type="number" />
              </Field>
              <Field label="Sex">
                <Select value={form.sex} onChange={v => update("sex", v)}
                  options={["", "Male", "Female"]} />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Weight (kg)">
                <Input value={form.weight} onChange={v => update("weight", v)} placeholder="e.g. 68" type="number" />
              </Field>
              <Field label="State / Region">
                <Input value={form.state} onChange={v => update("state", v)} placeholder="e.g. Lagos" />
              </Field>
            </FieldRow>
            <Field label="Referring Facility Level">
              <Select value={form.facility_level} onChange={v => update("facility_level", v)}
                options={["", "Primary Health Centre", "General Hospital", "State Specialist Hospital", "Federal Teaching Hospital"]} />
            </Field>
          </div>
        )}

        {/* CLINICAL */}
        {section === "clinical" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Field label="Presenting Symptoms (select all that apply)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {SYMPTOMS.map(s => (
                  <Tag key={s} active={form.symptoms.includes(s)} onClick={() => toggleArray("symptoms", s)}>{s}</Tag>
                ))}
              </div>
            </Field>
            <FieldRow>
              <Field label="NYHA Functional Class">
                <Select value={form.nyha} onChange={v => update("nyha", v)}
                  options={["", "I", "II", "III", "IV"]} />
              </Field>
              <Field label="Duration of Symptoms">
                <Select value={form.duration_weeks} onChange={v => update("duration_weeks", v)}
                  options={["", "<1 week", "1–4 weeks", "1–3 months", "3–12 months", ">1 year"]} />
              </Field>
            </FieldRow>
            <Field label="Comorbidities">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {[
                  ["htn", "Hypertension"],
                  ["dm", "Diabetes Mellitus"],
                  ["ckd", "Chronic Kidney Disease"],
                  ["copd", "COPD"],
                  ["prior_cardiac_surgery", "Prior Cardiac Surgery"],
                ].map(([field, label]) => (
                  <Tag key={field} active={form[field]} onClick={() => update(field, !form[field])}>{label}</Tag>
                ))}
              </div>
            </Field>
            <Field label="Clinical Urgency">
              <Select value={form.urgency} onChange={v => update("urgency", v)}
                options={["", "Elective", "Urgent", "Emergency"]}
                valueMap={{ "": "", "Elective": "elective", "Urgent": "urgent", "Emergency": "emergency" }} />
            </Field>
          </div>
        )}

        {/* INVESTIGATIONS */}
        {section === "investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <Field label="ECG Findings (select all that apply)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {ECG_OPTIONS.map(o => (
                  <Tag key={o} active={form.ecg_findings.includes(o)} onClick={() => toggleArray("ecg_findings", o)}>{o}</Tag>
                ))}
              </div>
            </Field>
            <Field label="Echocardiography Findings (select all that apply)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {ECHO_OPTIONS.map(o => (
                  <Tag key={o} active={form.echo_findings.includes(o)} onClick={() => toggleArray("echo_findings", o)}>{o}</Tag>
                ))}
              </div>
            </Field>
            <div>
              <div style={{ fontSize: "13px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
                Full Blood Count
              </div>
              <FieldRow>
                <Field label="Haemoglobin (g/dL)">
                  <Input value={form.haemoglobin} onChange={v => update("haemoglobin", v)} placeholder="e.g. 11.2" type="number" />
                </Field>
                <Field label="WBC (×10⁹/L)">
                  <Input value={form.wbc} onChange={v => update("wbc", v)} placeholder="e.g. 7.4" type="number" />
                </Field>
                <Field label="Platelets (×10⁹/L)">
                  <Input value={form.platelets} onChange={v => update("platelets", v)} placeholder="e.g. 220" type="number" />
                </Field>
              </FieldRow>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
                Electrolytes, Urea & Creatinine
              </div>
              <FieldRow>
                <Field label="Sodium (mmol/L)">
                  <Input value={form.sodium} onChange={v => update("sodium", v)} placeholder="e.g. 138" type="number" />
                </Field>
                <Field label="Potassium (mmol/L)">
                  <Input value={form.potassium} onChange={v => update("potassium", v)} placeholder="e.g. 4.1" type="number" />
                </Field>
              </FieldRow>
              <FieldRow style={{ marginTop: "12px" }}>
                <Field label="Urea (mmol/L)">
                  <Input value={form.urea} onChange={v => update("urea", v)} placeholder="e.g. 5.8" type="number" />
                </Field>
                <Field label="Creatinine (μmol/L)">
                  <Input value={form.creatinine} onChange={v => update("creatinine", v)} placeholder="e.g. 88" type="number" />
                </Field>
              </FieldRow>
            </div>
          </div>
        )}

        {/* SCORES */}
        {section === "scores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{
              background: "rgba(200,169,126,0.06)",
              border: "1px solid rgba(200,169,126,0.15)",
              borderRadius: "8px",
              padding: "20px",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "15px", color: "#C8A97E" }}>EuroSCORE II</p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>
                The European System for Cardiac Operative Risk Evaluation predicts in-hospital mortality after cardiac surgery. It incorporates age, sex, renal function, NYHA class, LV function, pulmonary hypertension, and operative urgency among 18 variables.
              </p>
            </div>
            <Field label="EuroSCORE II Available?">
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                {["Yes", "No"].map(opt => (
                  <Tag key={opt}
                    active={form.euroscore_available === (opt === "Yes")}
                    onClick={() => update("euroscore_available", opt === "Yes")}>
                    {opt}
                  </Tag>
                ))}
              </div>
            </Field>
            {form.euroscore_available && (
              <Field label="EuroSCORE II Value (%)">
                <Input value={form.euroscore_value} onChange={v => update("euroscore_value", v)} placeholder="e.g. 3.5" type="number" />
              </Field>
            )}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "8px",
              padding: "16px 20px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              lineHeight: "1.7",
            }}>
              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Note on EuroSCORE II in West Africa:</strong> EuroSCORE II was developed on European patient populations. Evidence from Nigeria and broader Sub-Saharan Africa suggests it may not be well-calibrated for local disease phenotypes, particularly rheumatic heart disease and hypertensive cardiomyopathy. CARAT incorporates EuroSCORE II as one input while acknowledging this limitation.
            </div>
          </div>
        )}

        {/* RESULT */}
        {section === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Decision banner */}
            <div style={{
              background: result.decisionBg,
              border: `1px solid ${result.decisionColor}40`,
              borderLeft: `4px solid ${result.decisionColor}`,
              borderRadius: "8px",
              padding: "28px 28px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px", fontFamily: "'Georgia', serif" }}>
                CARAT Triage Recommendation
              </div>
              <div style={{ fontSize: "30px", fontWeight: "700", color: result.decisionColor, letterSpacing: "0.06em", marginBottom: "8px" }}>
                {result.decision}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
                Composite risk score: {result.score} — Clinician review required before action
              </div>
            </div>

            {/* Action steps */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "24px" }}>
              <div style={{ fontSize: "12px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                Recommended Actions
              </div>
              {result.actionSteps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: "22px", height: "22px", borderRadius: "50%",
                    background: `${result.decisionColor}20`,
                    border: `1px solid ${result.decisionColor}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: result.decisionColor, fontWeight: "700",
                  }}>{i + 1}</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6" }}>{s}</div>
                </div>
              ))}
            </div>

            {/* Clinical flags */}
            {result.flags.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "24px" }}>
                <div style={{ fontSize: "12px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                  Clinical Flags Identified
                </div>
                {result.flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                    <div style={{ color: "#FF9500", fontSize: "14px", marginTop: "1px" }}>⚑</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: "1.5" }}>{f}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Data gaps */}
            {result.dataGaps.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "24px" }}>
                <div style={{ fontSize: "12px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                  Investigations Recommended
                </div>
                {result.dataGaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                    <div style={{ color: "#007AFF", fontSize: "14px", marginTop: "1px" }}>○</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: "1.5" }}>{g}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.25)",
              lineHeight: "1.7",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "20px",
            }}>
              <strong style={{ color: "rgba(255,255,255,0.35)" }}>Important:</strong> CARAT is a clinical decision-support prototype and does not replace clinician judgement. All referral decisions must be made by a qualified healthcare professional with direct knowledge of the patient. This tool is designed to augment, not automate, clinical decision-making in resource-limited settings.
            </div>

            {/* Reset */}
            <button onClick={reset} style={{
              background: "transparent",
              border: "1px solid rgba(200,169,126,0.3)",
              color: "#C8A97E",
              borderRadius: "6px",
              padding: "14px",
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginTop: "8px",
              fontFamily: "'Georgia', serif",
            }}>
              Assess New Patient
            </button>
          </div>
        )}

        {/* Navigation */}
        {section !== "result" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px" }}>
            {step > 0 ? (
              <button onClick={goBack} style={navBtnStyle("secondary")}>← Back</button>
            ) : <div />}
            <button onClick={goNext} style={navBtnStyle("primary")}>
              {step === SECTIONS.length - 2 ? "Generate Recommendation →" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function navBtnStyle(type) {
  return {
    background: type === "primary" ? "linear-gradient(135deg, #C8A97E, #A8885E)" : "transparent",
    border: type === "primary" ? "none" : "1px solid rgba(255,255,255,0.15)",
    color: type === "primary" ? "#0A0F1E" : "rgba(255,255,255,0.5)",
    borderRadius: "6px",
    padding: "14px 28px",
    fontSize: "13px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontWeight: type === "primary" ? "700" : "400",
    fontFamily: "'Georgia', serif",
  };
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", color: "rgba(200,169,126,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldRow({ children, style }) {
  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", ...style }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        padding: "12px 14px",
        color: "#E8EAF0",
        fontSize: "15px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "'Georgia', serif",
      }}
    />
  );
}

function Select({ value, onChange, options, valueMap }) {
  return (
    <select
      value={value}
      onChange={e => onChange(valueMap ? valueMap[e.target.value] ?? e.target.value : e.target.value)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        padding: "12px 14px",
        color: value ? "#E8EAF0" : "rgba(255,255,255,0.3)",
        fontSize: "15px",
        outline: "none",
        width: "100%",
        cursor: "pointer",
        fontFamily: "'Georgia', serif",
      }}
    >
      {options.map(o => (
        <option key={o} value={o} style={{ background: "#0A0F1E" }}>{o || "Select..."}</option>
      ))}
    </select>
  );
}

function Tag({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(200,169,126,0.15)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(200,169,126,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "20px",
        padding: "7px 14px",
        color: active ? "#C8A97E" : "rgba(255,255,255,0.5)",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "'Georgia', serif",
      }}
    >
      {children}
    </button>
  );
}
