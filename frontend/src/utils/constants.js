export const INDUSTRIES = [
  { value: 'Manufacturing', label: 'Manufacturing & Industrial Production' },
  { value: 'Food Processing', label: 'Food & Beverage Processing' },
  { value: 'Chemicals & Petrochemicals', label: 'Chemicals & Petrochemicals' },
  { value: 'Information Technology', label: 'IT, Software & Data Centers' },
  { value: 'Textiles & Apparel', label: 'Textiles, Garments & Apparel' },
  { value: 'Pharmaceuticals & Healthcare', label: 'Pharmaceuticals & Healthcare' },
  { value: 'Renewable Energy', label: 'Renewable Energy & Power Plants' },
  { value: 'Construction & Real Estate', label: 'Construction & Infrastructure' },
  { value: 'Hospitality & Tourism', label: 'Hospitality, Hotels & Restaurants' },
  { value: 'Automotive & Electronics', label: 'Automotive & Precision Engineering' },
  { value: 'Retail & Warehousing', label: 'Retail, Logistics & Warehousing' },
];

export const BUSINESS_TYPES = [
  { value: 'Private Limited Company', label: 'Private Limited Company (Pvt. Ltd.)' },
  { value: 'Public Limited Company', label: 'Public Limited Company (Ltd.)' },
  { value: 'Limited Liability Partnership', label: 'Limited Liability Partnership (LLP)' },
  { value: 'Partnership Firm', label: 'Registered Partnership Firm' },
  { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
];

export const POLLUTION_CATEGORIES = [
  { value: 'Red', label: 'Red Category (Heavy / High Pollution Potential)' },
  { value: 'Orange', label: 'Orange Category (Medium Pollution Potential)' },
  { value: 'Green', label: 'Green Category (Low Pollution Potential)' },
  { value: 'White', label: 'White Category (Practically Non-Polluting)' },
  { value: '', label: 'Not Applicable / Exempted' },
];

export const PRIORITY_STYLES = {
  High: {
    bg: 'bg-[#FCEEEE]',
    text: 'text-[#C93D3D]',
    border: 'border-[#F8CDCD]',
    dot: 'bg-[#E05252]',
  },
  Medium: {
    bg: 'bg-[#FEF6E8]',
    text: 'text-[#B87707]',
    border: 'border-[#FDE2B2]',
    dot: 'bg-[#F2A51A]',
  },
  Low: {
    bg: 'bg-[#E6F2F2]',
    text: 'text-[#006B68]',
    border: 'border-[#BFE0DF]',
    dot: 'bg-[#006B68]',
  },
};

export const STATUS_STYLES = {
  // Application statuses
  Draft: { bg: 'bg-[#F0F4F4]', text: 'text-[#4D5C61]', border: 'border-[#DDE4E4]', label: 'Draft' },
  Incomplete: { bg: 'bg-[#FEF6E8]', text: 'text-[#B87707]', border: 'border-[#FDE2B2]', label: 'Incomplete' },
  Ready: { bg: 'bg-[#E6F2F2]', text: 'text-[#006B68]', border: 'border-[#BFE0DF]', label: 'Ready to Submit' },
  Submitted: { bg: 'bg-[#E8F6F1]', text: 'text-[#159A72]', border: 'border-[#C2EAD9]', label: 'Submitted' },
  Complete: { bg: 'bg-[#E8F6F1]', text: 'text-[#159A72]', border: 'border-[#C2EAD9]', label: 'Complete' },

  // Document & Field statuses
  Missing: { bg: 'bg-[#FCEEEE]', text: 'text-[#C93D3D]', border: 'border-[#F8CDCD]', label: 'Missing' },
  Uploaded: { bg: 'bg-[#E6F2F2]', text: 'text-[#006B68]', border: 'border-[#BFE0DF]', label: 'Uploaded' },
  Verifying: { bg: 'bg-[#FEF6E8]', text: 'text-[#B87707]', border: 'border-[#FDE2B2]', label: 'AI Verifying...' },
  Verified: { bg: 'bg-[#E8F6F1]', text: 'text-[#159A72]', border: 'border-[#C2EAD9]', label: 'AI Verified' },
  Rejected: { bg: 'bg-[#FCEEEE]', text: 'text-[#C93D3D]', border: 'border-[#F8CDCD]', label: 'Rejected' },
  Pending: { bg: 'bg-[#FEF6E8]', text: 'text-[#B87707]', border: 'border-[#FDE2B2]', label: 'Pending Fill' },
  Completed: { bg: 'bg-[#E8F6F1]', text: 'text-[#159A72]', border: 'border-[#C2EAD9]', label: 'Completed' },
  'Not Started': { bg: 'bg-[#F0F4F4]', text: 'text-[#4D5C61]', border: 'border-[#DDE4E4]', label: 'Not Started' },
  Required: { bg: 'bg-[#FEF6E8]', text: 'text-[#B87707]', border: 'border-[#FDE2B2]', label: 'Required' },
};

export const USER_ROLES = {
  APPLICANT: 'applicant',
  OFFICER: 'officer',
  ADMIN: 'admin',
};
