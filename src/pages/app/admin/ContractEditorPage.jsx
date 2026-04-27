import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import { useToast } from '../../../context/ToastContext';
import { usePlatformSettings } from '../../../hooks/usePlatformSettings';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import {
  HiDocumentText,
  HiPlusCircle,
  HiTrash,
  HiArrowUp,
  HiArrowDown,
  HiEye,
  HiArrowPath,
  HiChevronLeft,
  HiShieldCheck,
  HiScale,
  HiClipboardDocumentList,
  HiPencilSquare,
  HiCheckCircle,
  HiArrowUturnLeft,
  HiArrowUturnRight,
  HiListBullet,
  HiQueueList,
} from 'react-icons/hi2';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const P      = '#D4AF37';
const OS     = '#111111';
const BORDER = '#E5E7EB';
const SURF   = '#F9FAFB';
const LGRAY  = '#6B7280';

// ─────────────────────────────────────────────────────────────────────────────
// Document definitions
// ─────────────────────────────────────────────────────────────────────────────
const DOCS = [
  {
    key: 'contract',
    label: 'Territory Agreement',
    icon: HiDocumentText,
    desc: 'The Territory Partner Agreement shown to directors before they sign.',
    settingKey: 'contract_template',
    accentColor: '#D4AF37',
    accentBg: 'rgba(212,175,55,0.08)',
    type: 'sections',
  },
  {
    key: 'privacy',
    label: 'Privacy Policy',
    icon: HiShieldCheck,
    desc: 'Privacy Policy displayed to all platform users on the legal pages.',
    settingKey: 'privacy_policy_html',
    accentColor: '#1D4ED8',
    accentBg: 'rgba(29,78,216,0.07)',
    type: 'richtext',
  },
  {
    key: 'tos',
    label: 'Terms of Service',
    icon: HiScale,
    desc: 'Terms of Service governing use of the NLVListings platform.',
    settingKey: 'tos_html',
    accentColor: '#1F4D3A',
    accentBg: 'rgba(31,77,58,0.07)',
    type: 'richtext',
  },
  {
    key: 'rules',
    label: 'Platform Rules',
    icon: HiClipboardDocumentList,
    desc: 'Conduct rules and guidelines for all users on the platform.',
    settingKey: 'platform_rules_html',
    accentColor: '#7C3AED',
    accentBg: 'rgba(124,58,237,0.07)',
    type: 'richtext',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Default section contract (Territory Agreement)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { num: '1', title: 'PURPOSE', body: `This Agreement establishes the Territory Partner's participation within the NLVListings platform and broader New Leaf Vision ecosystem.\n\nThe Territory Partner is granted the opportunity to operate within a defined geographic area ("Territory") and participate in platform-generated opportunities, subject to the terms of this Agreement.` },
  { num: '2', title: 'TERRITORY RIGHTS', body: `The Company may grant the Territory Partner priority or exclusive rights within a defined geographic region.\n\nSuch rights may include:\n• Priority or exclusive access to platform-generated leads\n• Market positioning within the Territory\n• First access to certain listings, buyers, or opportunities\n• Participation in localized growth of the platform\n\nThe scope, boundaries, and exclusivity of the Territory shall be defined separately and may evolve over time. The Company reserves the right to review and adjust Territory structures as the platform grows.` },
  { num: '3', title: 'PLATFORM PARTICIPATION', body: `The Territory Partner may:\n• Access and utilize the NLVListings platform\n• Participate in platform-generated leads\n• List, market, and promote properties\n• Engage with buyers and sellers within the ecosystem\n• Introduce opportunities aligned with the New Leaf Vision network\n\nParticipation is subject to compliance with platform rules and policies.` },
  { num: '4', title: 'PLATFORM LEADS AND TRANSACTIONS', body: `Any lead generated through the platform shall be considered a "Platform Lead." This includes:\n• Inquiries submitted through listings\n• Direct messages or contact requests\n• Referrals within the ecosystem\n• Leads generated through platform marketing\n\nAny transaction involving a Platform Lead shall be considered a "Platform Transaction," regardless of where the transaction is completed.` },
  { num: '5', title: 'LEAD ATTRIBUTION', body: `The Company maintains records of all Platform Leads through its systems.\n• Platform records shall serve as the primary reference for attribution\n• Attribution remains valid for a defined period (as outlined in platform policies)\n• The Company retains final discretion in determining attribution` },
  { num: '6', title: 'NON-CIRCUMVENTION', body: `The Territory Partner agrees not to:\n• Bypass the platform to avoid fees or obligations\n• Redirect Platform Leads outside the ecosystem\n• Complete transactions privately with Platform Leads\n\nAny attempt to circumvent the platform may result in enforcement actions, including suspension or termination.` },
  { num: '7', title: 'NEW LEAF VISION ECOSYSTEM', body: `The Territory Partner acknowledges that NLVListings is part of a broader ecosystem including:\n• Construction systems and development projects\n• Buyer demand generated through New Leaf Vision\n• Future services such as digital infrastructure, education, and transaction systems\n\nThe Territory Partner may:\n• Introduce clients to New Leaf Vision opportunities\n• Participate in project-related transactions\n• Access development and pre-sale opportunities when available\n\nParticipation in such opportunities is subject to Company discretion and program availability.` },
  { num: '8', title: 'DEVELOPMENT AND PROJECT ACCESS', body: `The Company may provide Territory Partners with access to:\n• Pre-construction or pre-sale opportunities\n• Off-market or early-stage developments\n• Projects associated with the New Leaf Vision ecosystem\n\nAccess is not guaranteed and may depend on:\n• Level of activity\n• Compliance with platform standards\n• Market availability` },
  { num: '9', title: 'BRAND AND REPRESENTATION', body: `The Territory Partner may promote listings and opportunities within the platform. However:\n• The Partner may not represent themselves as an employee or agent of the Company\n• All branding must comply with Company guidelines` },
  { num: '10', title: 'PLATFORM SYSTEMS AND COMMUNICATION', body: `The Territory Partner agrees to utilize the Company's systems where required, including:\n• CRM systems\n• Lead management tools\n• Communication platforms\n\nThis ensures proper tracking, attribution, and ecosystem integrity.` },
  { num: '11', title: 'MEDIA AND CONTENT', body: `The Territory Partner retains ownership of submitted content. However, the Company is granted a non-exclusive license to use such content for:\n• Platform display\n• Marketing\n• Promotional purposes` },
  { num: '12', title: 'TERM AND TERMINATION', body: `This Agreement remains in effect until terminated by either party.\n\nThe Company reserves the right to:\n• Modify Territory access\n• Revoke exclusivity\n• Suspend or terminate participation\n\nin cases of:\n• Breach of agreement\n• Misuse of the platform\n• Failure to maintain activity standards` },
  { num: '13', title: 'NO GUARANTEE', body: `The Company does not guarantee:\n• Lead volume\n• Transaction outcomes\n• Financial results\n\nParticipation is based on opportunity, not assurance.` },
  { num: '14', title: 'PLATFORM ROLE', body: `NLVListings is a technology platform only. The Company:\n• Is not a real estate broker\n• Does not participate in transactions\n• Does not represent buyers or sellers\n\nThe Territory Partner is solely responsible for compliance with applicable laws and licensing requirements.` },
  { num: '15', title: 'GOVERNING LAW', body: `This Agreement shall be governed by the laws of the State of Delaware.` },
];

// ─────────────────────────────────────────────────────────────────────────────
// Default HTML for rich text documents
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_HTML = {
  privacy: `<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us when you create an account, post listings, or contact us. This includes your name, email address, phone number, and any content you submit.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, maintain, and improve our services</li>
  <li>Process transactions and send related information</li>
  <li>Send technical notices, updates, and support messages</li>
  <li>Respond to your comments and questions</li>
  <li>Monitor and analyze usage and trends</li>
</ul>

<h2>3. Information Sharing</h2>
<p>We do not share your personal information with third parties except as described in this policy. We may share information with vendors and service providers who need access to perform services on our behalf.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Cookies</h2>
<p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information to improve your experience.</p>

<h2>6. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at <strong>support@nlvlistings.com</strong>.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with a revised effective date.</p>

<h2>8. Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us at <strong>support@nlvlistings.com</strong>.</p>`,

  tos: `<h2>1. Platform Overview</h2>
<p>NLVListings is an online platform designed to connect buyers, sellers, and real estate professionals. NLVListings is a <strong>technology platform only</strong> and is not a licensed real estate brokerage.</p>

<h2>2. Eligibility</h2>
<p>You must be at least 18 years of age and legally able to enter into contracts to use this platform. By registering, you confirm that you meet these requirements.</p>

<h2>3. Account Responsibilities</h2>
<p>You are responsible for:</p>
<ul>
  <li>Maintaining the confidentiality of your account credentials</li>
  <li>All activities that occur under your account</li>
  <li>Providing accurate and current information</li>
  <li>Notifying us immediately of any unauthorized access</li>
</ul>

<h2>4. Listings and Content</h2>
<p>All listings must be accurate and comply with applicable laws. You retain ownership of content you submit but grant us a non-exclusive license to display it on the platform.</p>

<h2>5. Prohibited Activities</h2>
<p>You agree not to:</p>
<ul>
  <li>Post false or misleading information</li>
  <li>Circumvent platform systems or fees</li>
  <li>Harass or harm other users</li>
  <li>Violate any applicable laws or regulations</li>
</ul>

<h2>6. Fees and Payments</h2>
<p>Subscription fees are billed in advance and are non-refundable except as required by law. We reserve the right to modify pricing with reasonable notice.</p>

<h2>7. Termination</h2>
<p>We may terminate or suspend your account at our discretion for violations of these Terms. You may cancel your account at any time through your billing settings.</p>

<h2>8. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, NLVListings shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>

<h2>9. Governing Law</h2>
<p>These Terms shall be governed by the laws of the State of Delaware, without regard to conflict of law principles.</p>`,

  rules: `<h2>1. Listing Standards</h2>
<p>All listings must be accurate, complete, and represent properties you are authorized to list. Listings must include clear photographs and truthful descriptions.</p>

<h2>2. Professional Conduct</h2>
<p>All users must maintain professional conduct at all times, including:</p>
<ul>
  <li>Treating all parties with respect and fairness</li>
  <li>Responding to inquiries in a timely manner</li>
  <li>Honoring commitments made through the platform</li>
</ul>

<h2>3. Lead Handling</h2>
<p>Platform-generated leads must be handled exclusively through the platform's systems. Circumventing lead attribution or directing clients outside the platform is strictly prohibited.</p>

<h2>4. Commission and Fee Transparency</h2>
<p>All fees and commission arrangements must be disclosed clearly and honestly to all parties involved in a transaction.</p>

<h2>5. Prohibited Content</h2>
<p>The following content is strictly prohibited:</p>
<ul>
  <li>Discriminatory listings or communications</li>
  <li>False or misleading property information</li>
  <li>Spam or unsolicited marketing</li>
  <li>Content that violates fair housing laws</li>
</ul>

<h2>6. Compliance with Laws</h2>
<p>All users must comply with applicable real estate laws, licensing requirements, and fair housing regulations in their jurisdiction.</p>

<h2>7. Reporting Violations</h2>
<p>Report any suspected violations to <strong>support@nlvlistings.com</strong>. We take all reports seriously and investigate promptly.</p>

<h2>8. Enforcement</h2>
<p>Violations of these rules may result in content removal, account suspension, or permanent termination. Repeated violations will result in permanent bans from the platform.</p>`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Section editor utilities (Territory Agreement)
// ─────────────────────────────────────────────────────────────────────────────
function renumber(sections) {
  return sections.map((s, i) => ({ ...s, num: String(i + 1) }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview modal (Territory Agreement)
// ─────────────────────────────────────────────────────────────────────────────
function PreviewModal({ sections, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <HiDocumentText size={20} color={P} />
            <h2 className="text-base font-bold text-gray-900">Territory Partner Agreement — Preview</h2>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1 rounded-lg border border-gray-200">Close</button>
        </div>
        <div className="overflow-y-auto px-6 py-5" style={{ flex: 1 }}>
          <h3 className="text-center font-bold text-gray-900 mb-1" style={{ fontSize: 17 }}>TERRITORY PARTNER AGREEMENT</h3>
          <p className="text-center text-xs text-gray-500 mb-6">NLVListings Platform — New Leaf Vision</p>
          {sections.map(s => (
            <div key={s.num} className="mb-5">
              <h4 className="font-bold text-sm mb-1" style={{ color: OS }}>{s.num}. {s.title}</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich Text Editor
// ─────────────────────────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Sync external value → editor (only when value changes from outside)
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (isUpdatingRef.current) return;
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const exec = useCallback((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const ToolBtn = ({ title, icon: Icon, command, commandValue, active, label }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); exec(command, commandValue); }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: label ? 'auto' : 30, height: 30, borderRadius: 6,
        border: '1px solid ' + (active ? '#D4AF37' : BORDER),
        background: active ? 'rgba(212,175,55,0.1)' : '#fff',
        color: active ? '#B8962E' : '#374151',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
        padding: label ? '0 8px' : 0,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = SURF; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
    >
      {Icon ? <Icon size={14} /> : label}
    </button>
  );

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
        padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: SURF,
      }}>
        <ToolBtn title="Bold (Ctrl+B)" label="B" command="bold" />
        <ToolBtn title="Italic (Ctrl+I)" label="I" command="italic" />
        <ToolBtn title="Underline (Ctrl+U)" label="U" command="underline" />
        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
        <ToolBtn title="Heading 1" label="H1" command="formatBlock" commandValue="h2" />
        <ToolBtn title="Heading 2" label="H2" command="formatBlock" commandValue="h3" />
        <ToolBtn title="Paragraph" label="¶" command="formatBlock" commandValue="p" />
        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
        <ToolBtn title="Bullet List" icon={HiListBullet} command="insertUnorderedList" />
        <ToolBtn title="Numbered List" icon={HiQueueList} command="insertOrderedList" />
        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
        <ToolBtn title="Undo (Ctrl+Z)" icon={HiArrowUturnLeft} command="undo" />
        <ToolBtn title="Redo (Ctrl+Y)" icon={HiArrowUturnRight} command="redo" />
        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
        <ToolBtn title="Remove Formatting" label="Tx" command="removeFormat" />
        <span style={{ fontSize: 11, color: LGRAY, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          Paste from Word/Docs is supported
        </span>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={() => { setTimeout(() => onChange(editorRef.current?.innerHTML || ''), 0); }}
        data-placeholder={placeholder}
        style={{
          minHeight: 400,
          padding: '16px 18px',
          fontSize: 14,
          lineHeight: 1.75,
          color: '#1F2937',
          outline: 'none',
          overflowY: 'auto',
          fontFamily: 'inherit',
        }}
        className="rich-editor"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Card
// ─────────────────────────────────────────────────────────────────────────────
function DocCard({ doc, onClick, lastSaved }) {
  const Icon = doc.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 12, padding: '22px 20px', borderRadius: 16, textAlign: 'left', width: '100%',
        border: `1.5px solid ${BORDER}`, background: '#fff', cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = doc.accentColor;
        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.08)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: doc.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={doc.accentColor} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: OS, marginBottom: 4 }}>{doc.label}</div>
        <div style={{ fontSize: 12, color: LGRAY, lineHeight: 1.5 }}>{doc.desc}</div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: lastSaved ? '#22C55E' : '#9CA3AF' }}>
          {lastSaved ? `Saved` : 'Default content'}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
          color: doc.accentColor, padding: '4px 10px', borderRadius: 99,
          background: doc.accentBg,
        }}>
          <HiPencilSquare size={13} />
          Edit
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section-based editor (Territory Agreement)
// ─────────────────────────────────────────────────────────────────────────────
function ContractSectionEditor({ sections, setSections, isSaving, onSave, onReset, isLoading }) {
  const [showPreview, setShowPreview] = useState(false);

  const update = (idx, field, val) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const move = (idx, dir) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSections(renumber(next));
  };

  const addSection = () =>
    setSections(prev => renumber([...prev, { num: '', title: 'NEW SECTION', body: '' }]));

  const removeSection = (idx) => {
    if (sections.length <= 1) return;
    setSections(prev => renumber(prev.filter((_, i) => i !== idx)));
  };

  return (
    <>
      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
        style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
        <HiDocumentText size={16} className="mt-0.5 flex-shrink-0" style={{ color: P }} />
        <span>
          Changes take effect immediately for directors who have <strong>not yet signed</strong>.
          Already-signed agreements are not retroactively altered.
        </span>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          <HiEye size={15} />
          Preview
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
        >
          Reset to Default
        </button>
        <Button variant="gold" onClick={onSave} isLoading={isSaving} style={{ marginLeft: 'auto' }}>
          Save Agreement
        </Button>
      </div>

      {/* Sections */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(k => <Skeleton key={k} width="100%" height="160px" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((section, idx) => (
            <div key={idx} style={{
              background: '#fff', border: `1px solid ${BORDER}`,
              borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, background: SURF,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 6, background: P,
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {section.num}
                </span>
                <input
                  value={section.title}
                  onChange={e => update(idx, 'title', e.target.value)}
                  placeholder="Section title"
                  style={{
                    flex: 1, fontSize: 13, fontWeight: 700, color: OS,
                    border: 'none', outline: 'none', background: 'transparent',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                />
                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                    <HiArrowUp size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === sections.length - 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                    <HiArrowDown size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => removeSection(idx)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <HiTrash size={14} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <textarea
                  value={section.body}
                  onChange={e => update(idx, 'body', e.target.value)}
                  placeholder="Section body text…"
                  rows={5}
                  style={{
                    width: '100%', fontSize: 13, color: '#374151',
                    border: `1px solid ${BORDER}`, borderRadius: 8,
                    padding: '10px 12px', resize: 'vertical', outline: 'none',
                    lineHeight: 1.6, fontFamily: 'inherit', background: '#fff',
                  }}
                  onFocus={e => { e.target.style.borderColor = P; }}
                  onBlur={e => { e.target.style.borderColor = BORDER; }}
                />
                <p style={{ fontSize: 11, color: LGRAY, marginTop: 4 }}>
                  Use • for bullet points. Press Enter for new lines.
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
          >
            <HiPlusCircle size={18} />
            Add Section
          </button>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button variant="gold" onClick={onSave} isLoading={isSaving}>Save Agreement</Button>
      </div>

      {showPreview && <PreviewModal sections={sections} onClose={() => setShowPreview(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich text document editor
// ─────────────────────────────────────────────────────────────────────────────
function RichDocEditor({ doc, htmlValue, onChange, isSaving, onSave, isLoading }) {
  return (
    <>
      {/* Info banner */}
      <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
        <doc.icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: doc.accentColor }} />
        <span>
          Edits are saved to the platform database. The public-facing legal page will reflect your changes.
          Paste formatted text from Word or Google Docs — formatting is preserved.
        </span>
      </div>

      {/* Save action */}
      <div className="flex justify-end mb-4">
        <Button variant="gold" onClick={onSave} isLoading={isSaving}>
          <HiCheckCircle size={15} />
          Save {doc.label}
        </Button>
      </div>

      {/* Editor */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(k => <Skeleton key={k} width="100%" height="60px" />)}
        </div>
      ) : (
        <RichTextEditor
          value={htmlValue}
          onChange={onChange}
          placeholder={`Start typing your ${doc.label}…`}
        />
      )}

      <div className="flex justify-end mt-6">
        <Button variant="gold" onClick={onSave} isLoading={isSaving}>
          Save {doc.label}
        </Button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function ContractEditorPage() {
  const { addToast } = useToast();
  const { settings, isLoading, updateSetting, refresh } = usePlatformSettings();

  const [activeDoc, setActiveDoc] = useState(null); // null | doc key
  const [isSaving, setIsSaving]   = useState(false);

  // Territory agreement sections state
  const [sections, setSections] = useState([]);

  // Rich text states
  const [privacyHtml, setPrivacyHtml] = useState('');
  const [tosHtml,     setTosHtml]     = useState('');
  const [rulesHtml,   setRulesHtml]   = useState('');

  // Initialise states from settings on load
  useEffect(() => {
    if (isLoading) return;
    setSections(settings.contract_template || DEFAULT_SECTIONS);
    setPrivacyHtml(settings.privacy_policy_html || DEFAULT_HTML.privacy);
    setTosHtml(settings.tos_html               || DEFAULT_HTML.tos);
    setRulesHtml(settings.platform_rules_html  || DEFAULT_HTML.rules);
  }, [settings, isLoading]);

  const handleSave = async () => {
    const doc = DOCS.find(d => d.key === activeDoc);
    if (!doc) return;

    setIsSaving(true);

    let key, value;
    if (doc.type === 'sections') {
      key = 'contract_template';
      value = sections;
    } else {
      key = doc.settingKey;
      value = activeDoc === 'privacy' ? privacyHtml
            : activeDoc === 'tos'     ? tosHtml
            : rulesHtml;
    }

    const { error } = await updateSetting(key, value);
    setIsSaving(false);

    if (error) {
      addToast({ type: 'error', title: 'Save failed', desc: error.message });
    } else {
      addToast({ type: 'success', title: `${doc.label} saved`, desc: 'Changes are now live on the platform.' });
    }
  };

  const handleContractReset = () => {
    if (!window.confirm('Reset Territory Agreement to the original default text? This cannot be undone.')) return;
    setSections(DEFAULT_SECTIONS);
  };

  const activeDocDef = DOCS.find(d => d.key === activeDoc);

  return (
    <AppLayout role="admin">
      <style>{`
        .rich-editor:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        .rich-editor h1, .rich-editor h2 {
          font-size: 16px; font-weight: 700; color: #111; margin: 16px 0 6px;
        }
        .rich-editor h3 {
          font-size: 14px; font-weight: 700; color: #374151; margin: 12px 0 4px;
        }
        .rich-editor p { margin: 0 0 8px; }
        .rich-editor ul, .rich-editor ol {
          margin: 6px 0 10px 20px; padding: 0;
        }
        .rich-editor li { margin-bottom: 4px; }
        .rich-editor strong { font-weight: 700; }
        .rich-editor em { font-style: italic; }
        .rich-editor u { text-decoration: underline; }
      `}</style>

      <div style={{ padding: 'clamp(16px, 4vw, 32px)', minHeight: '100vh', background: SURF }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {activeDoc && (
              <button
                onClick={() => setActiveDoc(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: '#fff',
                  fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = SURF}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <HiChevronLeft size={15} />
                All Documents
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeDocDef ? activeDocDef.label : 'Document Editor'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeDocDef
                  ? activeDocDef.desc
                  : 'Select a document below to edit its content.'}
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            title="Refresh settings"
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            <HiArrowPath size={16} className="text-gray-500" />
          </button>
        </div>

        {/* ── Document cards (landing) ─────────────────────────────────── */}
        {!activeDoc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {DOCS.map(doc => (
              <DocCard
                key={doc.key}
                doc={doc}
                onClick={() => setActiveDoc(doc.key)}
                lastSaved={
                  doc.type === 'sections'
                    ? !!settings.contract_template
                    : !!settings[doc.settingKey]
                }
              />
            ))}
          </div>
        )}

        {/* ── Editor panel ─────────────────────────────────────────────── */}
        {activeDoc && (
          <div style={{
            background: '#fff', borderRadius: 16,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            {/* Editor header strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
              background: SURF,
            }}>
              {activeDocDef && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: activeDocDef.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <activeDocDef.icon size={18} color={activeDocDef.accentColor} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: OS }}>{activeDocDef?.label}</div>
                <div style={{ fontSize: 11, color: LGRAY }}>
                  {activeDocDef?.type === 'sections'
                    ? `${sections.length} sections`
                    : 'Rich text — supports copy/paste from Word, Google Docs, etc.'}
                </div>
              </div>
            </div>

            {/* Editor body */}
            <div style={{ padding: '20px 24px' }}>
              {activeDoc === 'contract' && (
                <ContractSectionEditor
                  sections={sections}
                  setSections={setSections}
                  isSaving={isSaving}
                  onSave={handleSave}
                  onReset={handleContractReset}
                  isLoading={isLoading}
                />
              )}
              {activeDoc === 'privacy' && (
                <RichDocEditor
                  doc={activeDocDef}
                  htmlValue={privacyHtml}
                  onChange={setPrivacyHtml}
                  isSaving={isSaving}
                  onSave={handleSave}
                  isLoading={isLoading}
                />
              )}
              {activeDoc === 'tos' && (
                <RichDocEditor
                  doc={activeDocDef}
                  htmlValue={tosHtml}
                  onChange={setTosHtml}
                  isSaving={isSaving}
                  onSave={handleSave}
                  isLoading={isLoading}
                />
              )}
              {activeDoc === 'rules' && (
                <RichDocEditor
                  doc={activeDocDef}
                  htmlValue={rulesHtml}
                  onChange={setRulesHtml}
                  isSaving={isSaving}
                  onSave={handleSave}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
