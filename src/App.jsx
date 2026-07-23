import { useState } from "react";

const SECTIONS = ["patient", "clinical", "examination", "investigations", "scores", "result"];

const SECTION_LABELS = {
  patient: "Patient Details",
  clinical: "Clinical Presentation",
  examination: "Clinical Examination",
  investigations: "Investigations",
  scores: "Risk Scores",
  result: "Triage Recommendation",
};

// Expanded to full cardiothoracic scope per Dr. Alioke
const CARDIAC_SYMPTOMS = [
  "Dyspnoea at rest",
  "Dyspnoea on exertion",
  "Orthopnoea",
  "Paroxysmal nocturnal dyspnoea",
  "Chest pain",
  "Palpitations",
  "Syncope/pre-syncope",
  "Leg oedema",
  "Cyanosis",
  "Poor feeding (paediatric)",
  "Fatigue/reduced exercise tolerance",
];

const PULMONARY_SYMPTOMS = [
  "Haemoptysis",
  "Chronic cough",
  "Productive cough",
  "Wheeze",
  "Stridor",
  "Recurrent chest infections",
  "Pleuritic chest pain",
];

const OESOPHAGEAL_SYMPTOMS = [
  "Dysphagia (difficulty swallowing)",
  "Odynophagia (painful swallowing)",
  "Regurgitation",
  "Heartburn / acid reflux",
  "Unexplained weight loss",
  "Vomiting blood",
];

const VASCULAR_SYMPTOMS = [
  "Tearing/ripping chest or back pain",
  "Claudication (limb pain on walking)",
  "Cold/numb limb",
  "Pulsatile abdominal mass",
  "Limb colour change",
];

const ECG_OPTIONS = [
  "Normal sinus rhythm",
  "Left ventricular hypertrophy",
  "Right ventricular hypertrophy",
  "Atrial fibrillation",
  "Atrial flutter",
  "ST elevation",
  "ST depression",
  "T-wave inversion",
  "Bundle branch block (LBBB)",
  "Bundle branch block (RBBB)",
  "Signs of pulmonary hypertension",
  "Heart block (1st/2nd/3rd degree)",
  "Ventricular tachycardia",
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
  "Pulmonary stenosis",
  "Pericardial effusion",
  "Cardiac tamponade",
  "Pulmonary hypertension",
  "Congenital defect",
  "Intracardiac mass/thrombus",
  "Aortic root dilatation",
  "Not available",
];

const initialForm = {
  // Patient
  age: "",
  sex: "",
  weight: "",
  state: "",
  facility_level: "",
  // Clinical
  cardiac_symptoms: [],
  pulmonary_symptoms: [],
  oesophageal_symptoms: [],
  vascular_symptoms: [],
  other_symptoms: "",
  nyha: "",
  duration_weeks: "",
  htn: false,
  dm: false,
  ckd: false,
  copd: false,
  rheumatic_fever: false,
  smoking: false,
  prior_cardiac_surgery: false,
  // Examination
  jvp: "",
  murmur: "",
  murmur_detail: "",
  leg_oedema: "",
  lung_findings: "",
  bp_systolic: "",
  bp_diastolic: "",
  heart_rate: "",
  spo2: "",
  other_exam: "",
  // ECG
  ecg_findings: [],
  ecg_other: "",
  // Echo
  echo_findings: [],
  echo_other: "",
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

  const age = parseInt(form.age);
  if (age > 65) { score += 2; flags.push("Age >65 — increases operative risk"); }
  if (age < 5) { score += 3; flags.push("Paediatric patient — specialist paediatric cardiothoracic input required"); }

  if (form.nyha === "III") { score += 2; flags.push("NYHA Class III — significant functional limitation"); }
  if (form.nyha === "IV") { score += 4; flags.push("NYHA Class IV — severe functional limitation"); }

  // Cardiac symptoms
  if (form.cardiac_symptoms.includes("Dyspnoea at rest")) { score += 3; flags.push("Dyspnoea at rest — haemodynamic compromise likely"); }
  if (form.cardiac_symptoms.includes("Syncope/pre-syncope")) { score += 3; flags.push("Syncope — consider critical aortic stenosis or arrhythmia"); }
  if (form.cardiac_symptoms.includes("Cyanosis")) { score += 4; flags.push("Cyanosis — urgent evaluation required"); }

  // Pulmonary symptoms
  if (form.pulmonary_symptoms.includes("Haemoptysis")) { score += 2; flags.push("Haemoptysis — consider mitral stenosis, pulmonary malignancy or TB"); }
  if (form.pulmonary_symptoms.includes("Stridor")) { score += 3; flags.push("Stridor — airway compromise, urgent assessment needed"); }

  // Oesophageal symptoms
  if (form.oesophageal_symptoms.includes("Dysphagia (difficulty swallowing)")) { score += 2; flags.push("Dysphagia — consider oesophageal malignancy or mediastinal mass"); }
  if (form.oesophageal_symptoms.includes("Unexplained weight loss")) { score += 2; flags.push("Unexplained weight loss with dysphagia — high suspicion for oesophageal malignancy"); }
  if (form.oesophageal_symptoms.includes("Vomiting blood")) { score += 3; flags.push("Haematemesis — emergency assessment required"); }

  // Vascular symptoms
  if (form.vascular_symptoms.includes("Tearing/ripping chest or back pain")) { score += 5; flags.push("Tearing chest/back pain — suspect aortic dissection, EMERGENCY referral"); }
  if (form.vascular_symptoms.includes("Cold/numb limb")) { score += 3; flags.push("Acute limb ischaemia — time-critical vascular emergency"); }

  // Examination findings
  if (form.jvp === "elevated") { score += 2; flags.push("Elevated JVP — raised venous pressure, consider cardiac failure or tamponade"); }
  if (form.jvp === "severely_elevated") { score += 3; flags.push("Severely elevated JVP — possible cardiac tamponade or severe right heart failure"); }
  if (form.murmur === "yes") { score += 1; flags.push(`Cardiac murmur present${form.murmur_detail ? ` — ${form.murmur_detail}` : " — echocardiography essential"}`); }
  if (form.leg_oedema === "moderate") { score += 1; flags.push("Moderate leg oedema — consider cardiac or hepatic cause"); }
  if (form.leg_oedema === "severe") { score += 2; flags.push("Severe leg oedema — significant fluid overload"); }
  if (form.lung_findings === "crepitations") { score += 1; flags.push("Pulmonary crepitations — possible pulmonary oedema"); }
  if (form.lung_findings === "reduced_breath_sounds") { score += 2; flags.push("Reduced breath sounds — consider effusion, collapse or mass"); }

  const spo2 = parseFloat(form.spo2);
  if (spo2 && spo2 < 90) { score += 4; flags.push(`SpO₂ ${spo2}% — severe hypoxaemia, emergency assessment`); }
  else if (spo2 && spo2 < 94) { score += 2; flags.push(`SpO₂ ${spo2}% — significant hypoxaemia`); }

  // ECG
  if (form.ecg_findings.includes("ST elevation")) { score += 5; flags.push("ST elevation — emergency cardiac referral required"); }
  if (form.ecg_findings.includes("Ventricular tachycardia")) { score += 5; flags.push("Ventricular tachycardia — life-threatening arrhythmia"); }
  if (form.ecg_findings.includes("Signs of pulmonary hypertension")) { score += 3; flags.push("ECG signs of pulmonary hypertension"); }
  if (form.ecg_findings.includes("Heart block (1st/2nd/3rd degree)")) { score += 2; flags.push("Heart block — cardiology review required"); }
  if (form.ecg_findings.includes("Not available")) { dataGaps.push("ECG not performed — strongly recommended before referral decision"); }

  // Echo
  if (form.echo_findings.includes("Severely reduced LV function (EF <30%)")) { score += 4; flags.push("Severely reduced EF — high surgical risk, urgent cardiology review"); }
  if (form.echo_findings.includes("Moderately reduced LV function (EF 30–44%)")) { score += 2; flags.push("Moderately reduced LV function"); }
  if (form.echo_findings.includes("Cardiac tamponade")) { score += 5; flags.push("Cardiac tamponade — emergency pericardiocentesis may be required"); }
  if (form.echo_findings.includes("Aortic stenosis")) { score += 2; flags.push("Aortic stenosis — severity quantification needed if not done"); }
  if (form.echo_findings.includes("Pulmonary hypertension")) { score += 3; flags.push("Pulmonary hypertension — increases surgical risk significantly"); }
  if (form.echo_findings.includes("Congenital defect")) { score += 2; flags.push("Congenital defect — specialist paediatric/adult congenital input needed"); }
  if (form.echo_findings.includes("Not available")) { dataGaps.push("Echocardiography not performed — essential for surgical planning"); }

  // Labs
  const hb = parseFloat(form.haemoglobin);
  if (hb && hb < 8) { score += 3; flags.push(`Haemoglobin ${hb} g/dL — severe anaemia, increases perioperative risk`); }
  else if (hb && hb < 10) { score += 1; flags.push(`Haemoglobin ${hb} g/dL — moderate anaemia, optimise before surgery`); }

  const creat = parseFloat(form.creatinine);
  if (creat && creat > 200) { score += 3; flags.push(`Creatinine ${creat} μmol/L — significant renal impairment`); }
  else if (creat && creat > 130) { score += 1; flags.push(`Creatinine ${creat} μmol/L — mild-moderate renal impairment`); }

  const k = parseFloat(form.potassium);
  if (k && (k < 3.0 || k > 5.5)) { score += 2; flags.push(`Potassium ${k} mmol/L — electrolyte disturbance, correct before surgery`); }

  // Comorbidities
  if (form.htn) score += 1;
  if (form.dm) { score += 1; flags.push("Diabetes — wound healing and infection risk"); }
  if (form.ckd) { score += 2; flags.push("CKD — renal protection protocol required perioperatively"); }
  if (form.copd) { score += 1; flags.push("COPD — pulmonary function assessment recommended"); }
  if (form.rheumatic_fever) { score += 1; flags.push("History of rheumatic fever — evaluate for valvular disease"); }
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

  if (form.urgency === "emergency") score = Math.max(score, 15);
  if (form.urgency === "urgent") score = Math.max(score, 10);

  let decision, decisionColor, decisionBg, actionSteps;

  if (score >= 12 || form.cardiac_symptoms.includes("Cyanosis") || form.ecg_findings.includes("ST elevation") || form.ecg_findings.includes("Ventricular tachycardia") || form.echo_findings.includes("Cardiac tamponade") || form.vascular_symptoms.includes("Tearing/ripping chest or back pain")) {
    decision = "EMERGENCY REFERRAL";
    decisionColor = "#DC2626";
    decisionBg = "rgba(220,38,38,0.07)";
    actionSteps = [
      "Transfer to nearest cardiothoracic centre immediately — do not delay",
      "Stabilise haemodynamics en route — IV access, oxygen, continuous monitoring",
      "Contact receiving cardiothoracic team by phone before transfer",
      "Send all available investigations with the patient",
      "Document transfer time and patient condition at departure",
    ];
  } else if (score >= 7) {
    decision = "URGENT REFERRAL";
    decisionColor = "#D97706";
    decisionBg = "rgba(217,119,6,0.07)";
    actionSteps = [
      "Refer to cardiothoracic centre within 2–4 weeks",
      "Optimise reversible risk factors before referral (anaemia, electrolytes, infection)",
      "Ensure echocardiography and ECG are completed and included in referral letter",
      "Calculate EuroSCORE II if not already done",
      "Commence appropriate medical therapy while awaiting specialist review",
    ];
  } else if (score >= 3) {
    decision = "ELECTIVE REFERRAL";
    decisionColor = "#16A34A";
    decisionBg = "rgba(22,163,74,0.07)";
    actionSteps = [
      "Refer to cardiothoracic outpatient clinic — routine appointment",
      "Complete all investigations prior to referral (ECG, echo, bloods, CXR)",
      "Optimise medical management of comorbidities",
      "Counsel patient about likely surgical pathway and what to expect",
      "Review in 4–6 weeks if no deterioration while awaiting appointment",
    ];
  } else {
    decision = "MANAGE LOCALLY";
    decisionColor = "#0284C7";
    decisionBg = "rgba(2,132,199,0.07)";
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

const COLORS = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  borderMid: "#CBD5E1",
  text: "#1E293B",
  textMid: "#475569",
  textLight: "#94A3B8",
  blue: "#0284C7",
  blueDark: "#0369A1",
  gold: "#92754A",
  goldLight: "#B8956A",
};

export default function CARAT() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const section = SECTIONS[step];

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function toggleArray(field, value) {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  }
  function goNext() {
    if (step === SECTIONS.length - 2) setResult(caratLogic(form));
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
  }
  function goBack() {
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 200);
  }
  function reset() { setForm(initialForm); setResult(null); setStep(0); }

  const progress = (step / (SECTIONS.length - 1)) * 100;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Georgia', serif", color: COLORS.text, display: "flex", flexDirection: "column", width: "100%", overflowX: "hidden" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.white, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "0.12em", color: COLORS.blue }}>CARAT</span>
          <span style={{ fontSize: "10px", color: COLORS.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Cardiothoracic AI Referral & Triage</span>
        </div>
        <div style={{ fontSize: "10px", color: COLORS.textLight, textAlign: "right" }}>
          <div style={{ color: COLORS.textMid }}>Sub-Saharan Africa</div>
          <div style={{ color: COLORS.gold, marginTop: "2px" }}>Prototype v0.2</div>
        </div>
      </div>

      {/* Progress */}
      {section !== "result" && (
        <div style={{ height: "3px", background: COLORS.border }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.goldLight})`, transition: "width 0.4s ease" }} />
        </div>
      )}

      {/* Feedback button */}
      <a href="/Feedback_Form.html" target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: "24px", right: "24px", backgroundColor: COLORS.blue, color: "#fff", padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: "700", fontSize: "13px", zIndex: 10000, boxShadow: "0 4px 14px rgba(0,0,0,0.15)", letterSpacing: "0.04em" }}>
        💬 Give Feedback
      </a>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: "700px", margin: "0 auto", width: "100%", padding: "36px 24px 100px", opacity: animating ? 0 : 1, transition: "opacity 0.2s ease" }}>

        {/* Step header */}
        {section !== "result" && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
              Step {step + 1} of {SECTIONS.length - 1}
            </div>
            <h2 style={{ fontSize: "26px", fontWeight: "400", color: COLORS.text, margin: 0 }}>{SECTION_LABELS[section]}</h2>
          </div>
        )}

        {/* ── PATIENT ── */}
        {section === "patient" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <FieldRow>
              <Field label="Age (years)"><Input value={form.age} onChange={v => update("age", v)} placeholder="e.g. 42" type="number" /></Field>
              <Field label="Sex"><CSelect value={form.sex} onChange={v => update("sex", v)} options={["", "Male", "Female"]} /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Weight (kg)"><Input value={form.weight} onChange={v => update("weight", v)} placeholder="e.g. 68" type="number" /></Field>
              <Field label="State / Region"><Input value={form.state} onChange={v => update("state", v)} placeholder="e.g. Lagos" /></Field>
            </FieldRow>
            <Field label="Referring Facility Level">
              <CSelect value={form.facility_level} onChange={v => update("facility_level", v)}
                options={["", "Primary Health Centre", "General Hospital", "State Specialist Hospital", "Federal Teaching Hospital", "Private Hospital"]} />
            </Field>
          </div>
        )}

        {/* ── CLINICAL ── */}
        {section === "clinical" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <SymptomGroup label="Cardiac Symptoms" items={CARDIAC_SYMPTOMS} field="cardiac_symptoms" form={form} toggleArray={toggleArray} />
            <SymptomGroup label="Pulmonary Symptoms" items={PULMONARY_SYMPTOMS} field="pulmonary_symptoms" form={form} toggleArray={toggleArray} />
            <SymptomGroup label="Oesophageal Symptoms" items={OESOPHAGEAL_SYMPTOMS} field="oesophageal_symptoms" form={form} toggleArray={toggleArray} />
            <SymptomGroup label="Vascular Symptoms" items={VASCULAR_SYMPTOMS} field="vascular_symptoms" form={form} toggleArray={toggleArray} />
            <Field label="Other symptoms not listed above">
              <textarea value={form.other_symptoms} onChange={e => update("other_symptoms", e.target.value)}
                placeholder="Describe any additional symptoms..." rows={2}
                style={{ width: "100%", background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: COLORS.text, fontSize: "14px", fontFamily: "'Georgia', serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </Field>
            <FieldRow>
              <Field label="NYHA Functional Class">
                <CSelect value={form.nyha} onChange={v => update("nyha", v)} options={["", "I", "II", "III", "IV"]} />
              </Field>
              <Field label="Duration of Symptoms">
                <CSelect value={form.duration_weeks} onChange={v => update("duration_weeks", v)} options={["", "<1 week", "1–4 weeks", "1–3 months", "3–12 months", ">1 year"]} />
              </Field>
            </FieldRow>
            <Field label="Comorbidities">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {[["htn","Hypertension"],["dm","Diabetes Mellitus"],["ckd","Chronic Kidney Disease"],["copd","COPD"],["rheumatic_fever","Rheumatic Fever"],["smoking","Smoking"],["prior_cardiac_surgery","Prior Cardiac Surgery"]].map(([f, l]) => (
                  <Tag key={f} active={form[f]} onClick={() => update(f, !form[f])}>{l}</Tag>
                ))}
              </div>
            </Field>
            <Field label="Clinician-assessed Urgency">
              <CSelect value={form.urgency} onChange={v => update("urgency", v)}
                options={["", "Elective", "Urgent", "Emergency"]}
                valueMap={{ "": "", "Elective": "elective", "Urgent": "urgent", "Emergency": "emergency" }} />
            </Field>
          </div>
        )}

        {/* ── EXAMINATION ── */}
        {section === "examination" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <SectionDivider label="Vital Signs" />
            <FieldRow>
              <Field label="BP Systolic (mmHg)"><Input value={form.bp_systolic} onChange={v => update("bp_systolic", v)} placeholder="e.g. 130" type="number" /></Field>
              <Field label="BP Diastolic (mmHg)"><Input value={form.bp_diastolic} onChange={v => update("bp_diastolic", v)} placeholder="e.g. 85" type="number" /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Heart Rate (bpm)"><Input value={form.heart_rate} onChange={v => update("heart_rate", v)} placeholder="e.g. 88" type="number" /></Field>
              <Field label="SpO₂ (%)"><Input value={form.spo2} onChange={v => update("spo2", v)} placeholder="e.g. 97" type="number" /></Field>
            </FieldRow>

            <SectionDivider label="Cardiovascular Examination" />
            <Field label="Jugular Venous Pressure (JVP)">
              <CSelect value={form.jvp} onChange={v => update("jvp", v)}
                options={["", "Normal", "Mildly elevated", "Elevated", "Severely elevated", "Not assessed"]}
                valueMap={{ "": "", "Normal": "normal", "Mildly elevated": "mild", "Elevated": "elevated", "Severely elevated": "severely_elevated", "Not assessed": "not_assessed" }} />
            </Field>
            <Field label="Cardiac Murmur">
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                {[["yes","Yes — present"],["no","No"],["unsure","Unsure"]].map(([val, label]) => (
                  <Tag key={val} active={form.murmur === val} onClick={() => update("murmur", val)}>{label}</Tag>
                ))}
              </div>
            </Field>
            {form.murmur === "yes" && (
              <Field label="Describe the murmur (location, grade, radiation)">
                <Input value={form.murmur_detail} onChange={v => update("murmur_detail", v)} placeholder="e.g. Grade 3/6 systolic murmur at aortic area, radiating to carotids" />
              </Field>
            )}
            <Field label="Leg / Ankle Oedema">
              <CSelect value={form.leg_oedema} onChange={v => update("leg_oedema", v)}
                options={["", "None", "Mild (+1)", "Moderate (+2)", "Severe (+3/+4)"]}
                valueMap={{ "": "", "None": "none", "Mild (+1)": "mild", "Moderate (+2)": "moderate", "Severe (+3/+4)": "severe" }} />
            </Field>

            <SectionDivider label="Respiratory Examination" />
            <Field label="Lung Findings on Auscultation">
              <CSelect value={form.lung_findings} onChange={v => update("lung_findings", v)}
                options={["", "Clear", "Crepitations / crackles", "Wheeze", "Reduced breath sounds", "Pleural rub", "Not assessed"]}
                valueMap={{ "": "", "Clear": "clear", "Crepitations / crackles": "crepitations", "Wheeze": "wheeze", "Reduced breath sounds": "reduced_breath_sounds", "Pleural rub": "pleural_rub", "Not assessed": "not_assessed" }} />
            </Field>

            <Field label="Other examination findings (free text)">
              <textarea value={form.other_exam} onChange={e => update("other_exam", e.target.value)}
                placeholder="e.g. hepatomegaly, ascites, clubbing, pulsatile mass, lymphadenopathy..." rows={3}
                style={{ width: "100%", background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: COLORS.text, fontSize: "14px", fontFamily: "'Georgia', serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </Field>
          </div>
        )}

        {/* ── INVESTIGATIONS ── */}
        {section === "investigations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <Field label="ECG Findings (select all that apply)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {ECG_OPTIONS.map(o => (
                  <Tag key={o} active={form.ecg_findings.includes(o)} onClick={() => toggleArray("ecg_findings", o)}>{o}</Tag>
                ))}
              </div>
              <textarea value={form.ecg_other} onChange={e => update("ecg_other", e.target.value)}
                placeholder="Any additional ECG findings not listed above..." rows={2} style={{ marginTop: "10px", width: "100%", background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: COLORS.text, fontSize: "14px", fontFamily: "'Georgia', serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </Field>

            <Field label="Echocardiography Findings (select all that apply)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {ECHO_OPTIONS.map(o => (
                  <Tag key={o} active={form.echo_findings.includes(o)} onClick={() => toggleArray("echo_findings", o)}>{o}</Tag>
                ))}
              </div>
              <textarea value={form.echo_other} onChange={e => update("echo_other", e.target.value)}
                placeholder="Any additional echo findings not listed above..." rows={2} style={{ marginTop: "10px", width: "100%", background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: COLORS.text, fontSize: "14px", fontFamily: "'Georgia', serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </Field>

            <SectionDivider label="Full Blood Count" />
            <FieldRow>
              <Field label="Haemoglobin (g/dL)"><Input value={form.haemoglobin} onChange={v => update("haemoglobin", v)} placeholder="e.g. 11.2" type="number" /></Field>
              <Field label="WBC (×10⁹/L)"><Input value={form.wbc} onChange={v => update("wbc", v)} placeholder="e.g. 7.4" type="number" /></Field>
              <Field label="Platelets (×10⁹/L)"><Input value={form.platelets} onChange={v => update("platelets", v)} placeholder="e.g. 220" type="number" /></Field>
            </FieldRow>

            <SectionDivider label="Electrolytes, Urea & Creatinine" />
            <FieldRow>
              <Field label="Sodium (mmol/L)"><Input value={form.sodium} onChange={v => update("sodium", v)} placeholder="e.g. 138" type="number" /></Field>
              <Field label="Potassium (mmol/L)"><Input value={form.potassium} onChange={v => update("potassium", v)} placeholder="e.g. 4.1" type="number" /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Urea (mmol/L)"><Input value={form.urea} onChange={v => update("urea", v)} placeholder="e.g. 5.8" type="number" /></Field>
              <Field label="Creatinine (μmol/L)"><Input value={form.creatinine} onChange={v => update("creatinine", v)} placeholder="e.g. 88" type="number" /></Field>
            </FieldRow>
          </div>
        )}

        {/* ── SCORES ── */}
        {section === "scores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: "8px", padding: "18px 20px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "15px", color: COLORS.blue, fontWeight: "600" }}>EuroSCORE II</p>
              <p style={{ margin: 0, fontSize: "13px", color: COLORS.textMid, lineHeight: "1.65" }}>
                The European System for Cardiac Operative Risk Evaluation predicts in-hospital mortality after cardiac surgery, incorporating 18 variables including age, renal function, NYHA class, LV function, and operative urgency.
              </p>
            </div>
            <Field label="EuroSCORE II Available?">
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                {["Yes", "No"].map(opt => (
                  <Tag key={opt} active={form.euroscore_available === (opt === "Yes")} onClick={() => update("euroscore_available", opt === "Yes")}>{opt}</Tag>
                ))}
              </div>
            </Field>
            {form.euroscore_available && (
              <Field label="EuroSCORE II Value (%)">
                <Input value={form.euroscore_value} onChange={v => update("euroscore_value", v)} placeholder="e.g. 3.5" type="number" />
              </Field>
            )}
            <div style={{ background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: "8px", padding: "16px 18px", fontSize: "13px", color: "#78350F", lineHeight: "1.7" }}>
              <strong>Note on EuroSCORE II in West Africa:</strong> EuroSCORE II was developed on European patient populations. Evidence from Nigeria and Sub-Saharan Africa suggests it may not be well-calibrated for local disease phenotypes, particularly rheumatic heart disease and hypertensive cardiomyopathy. CARAT incorporates it as one input while acknowledging this limitation — a core reason why African-derived risk data is needed.
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {section === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: result.decisionBg, border: `1px solid ${result.decisionColor}30`, borderLeft: `4px solid ${result.decisionColor}`, borderRadius: "8px", padding: "26px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.textLight, marginBottom: "10px" }}>CARAT Triage Recommendation</div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: result.decisionColor, letterSpacing: "0.05em", marginBottom: "8px" }}>{result.decision}</div>
              <div style={{ fontSize: "13px", color: COLORS.textMid }}>Composite risk score: {result.score} — Clinician review required before action</div>
            </div>

            <ResultBlock title="Recommended Actions" color={result.decisionColor}>
              {result.actionSteps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
                  <div style={{ minWidth: "22px", height: "22px", borderRadius: "50%", background: `${result.decisionColor}18`, border: `1px solid ${result.decisionColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: result.decisionColor, fontWeight: "700", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: "14px", color: COLORS.textMid, lineHeight: "1.6" }}>{s}</div>
                </div>
              ))}
            </ResultBlock>

            {result.flags.length > 0 && (
              <ResultBlock title="Clinical Flags Identified">
                {result.flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "9px", alignItems: "flex-start" }}>
                    <span style={{ color: "#D97706", fontSize: "14px", flexShrink: 0 }}>⚑</span>
                    <div style={{ fontSize: "13px", color: COLORS.textMid, lineHeight: "1.5" }}>{f}</div>
                  </div>
                ))}
              </ResultBlock>
            )}

            {result.dataGaps.length > 0 && (
              <ResultBlock title="Investigations Recommended">
                {result.dataGaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "9px", alignItems: "flex-start" }}>
                    <span style={{ color: COLORS.blue, fontSize: "14px", flexShrink: 0 }}>○</span>
                    <div style={{ fontSize: "13px", color: COLORS.textMid, lineHeight: "1.5" }}>{g}</div>
                  </div>
                ))}
              </ResultBlock>
            )}

            <div style={{ fontSize: "12px", color: COLORS.textLight, lineHeight: "1.7", borderTop: `1px solid ${COLORS.border}`, paddingTop: "18px" }}>
              <strong style={{ color: COLORS.textMid }}>Important:</strong> CARAT is a clinical decision-support prototype and does not replace clinician judgement. All referral decisions must be made by a qualified healthcare professional with direct knowledge of the patient. This tool is designed to augment, not automate, clinical decision-making in resource-limited settings.
            </div>

            <button onClick={reset} style={{ background: "transparent", border: `1px solid ${COLORS.borderMid}`, color: COLORS.blue, borderRadius: "6px", padding: "13px", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Georgia', serif" }}>
              Assess New Patient
            </button>
          </div>
        )}

        {/* Navigation */}
        {section !== "result" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "44px" }}>
            {step > 0 ? (
              <button onClick={goBack} style={{ background: "transparent", border: `1px solid ${COLORS.borderMid}`, color: COLORS.textMid, borderRadius: "6px", padding: "13px 24px", fontSize: "13px", letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Georgia', serif" }}>← Back</button>
            ) : <div />}
            <button onClick={goNext} style={{ background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDark})`, border: "none", color: "#fff", borderRadius: "6px", padding: "13px 28px", fontSize: "13px", letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer", fontWeight: "700", fontFamily: "'Georgia', serif" }}>
              {step === SECTIONS.length - 2 ? "Generate Recommendation →" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function SymptomGroup({ label, items, field, form, toggleArray }) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px", fontWeight: "600" }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {items.map(s => (
          <Tag key={s} active={form[field].includes(s)} onClick={() => toggleArray(field, s)}>{s}</Tag>
        ))}
      </div>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ fontSize: "12px", color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase", paddingBottom: "8px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: "600", marginTop: "4px" }}>{label}</div>
  );
}

function ResultBlock({ title, children, color }) {
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "20px 22px" }}>
      <div style={{ fontSize: "11px", color: color || COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px", fontWeight: "600" }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
      <label style={{ fontSize: "12px", color: COLORS.textMid, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>{label}</label>
      {children}
    </div>
  );
}

function FieldRow({ children, style }) {
  return <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", ...style }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: COLORS.text, fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Georgia', serif" }} />
  );
}

function CSelect({ value, onChange, options, valueMap }) {
  return (
    <select value={value} onChange={e => onChange(valueMap ? (valueMap[e.target.value] ?? e.target.value) : e.target.value)}
      style={{ background: COLORS.white, border: `1px solid ${COLORS.borderMid}`, borderRadius: "6px", padding: "11px 13px", color: value ? COLORS.text : COLORS.textLight, fontSize: "14px", outline: "none", width: "100%", cursor: "pointer", fontFamily: "'Georgia', serif" }}>
      {options.map(o => <option key={o} value={o}>{o || "Select..."}</option>)}
    </select>
  );
}

function Tag({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? "#EFF6FF" : COLORS.white, border: `1px solid ${active ? COLORS.blue : COLORS.borderMid}`, borderRadius: "20px", padding: "7px 13px", color: active ? COLORS.blue : COLORS.textMid, fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'Georgia', serif", fontWeight: active ? "600" : "400" }}>
      {children}
    </button>
  );
}
