export const INDUSTRIES = [
  { value: 'Manufacturing', label: 'Manufacturing & Industrial Production' },
  { value: 'Food Processing', label: 'Food & Beverage Processing' },
  { value: 'Chemicals & Petrochemicals', label: 'Chemicals & Petrochemicals' },
  { value: 'Automotive & Electronics', label: 'Automotive & Precision Engineering' },
  { value: 'Textiles & Apparel', label: 'Textiles, Garments & Apparel' },
  { value: 'Pharmaceuticals & Healthcare', label: 'Pharmaceuticals & Healthcare' },
  { value: 'Information Technology', label: 'IT, Software & Data Centers' },
  { value: 'Renewable Energy', label: 'Renewable Energy & Power Plants' },
  { value: 'Construction & Real Estate', label: 'Construction & Infrastructure' },
  { value: 'Hospitality & Tourism', label: 'Hospitality, Hotels & Restaurants' },
  { value: 'Retail & Warehousing', label: 'Retail, Logistics & Warehousing' },
];

export const SUB_SECTORS = {
  'Manufacturing': [
    { value: 'Automotive Components', label: 'Automotive Components & Fasteners' },
    { value: 'Precision Engineering', label: 'Precision Engineering & Tooling' },
    { value: 'General Machinery', label: 'General Industrial Machinery' },
    { value: 'Fabricated Metal Products', label: 'Fabricated Metal & Casting' },
    { value: 'Plastics & Polymers', label: 'Plastic Processing & Moulding' },
    { value: 'Electrical Equipment', label: 'Electrical Goods & Switchgear' },
  ],
  'Food Processing': [
    { value: 'Dairy Products', label: 'Dairy & Milk Products' },
    { value: 'Bakery & Confectionery', label: 'Bakery, Snacks & Confectionery' },
    { value: 'Beverages & Packaged Water', label: 'Packaged Drinking Water & Beverages' },
    { value: 'Grain & Flour Milling', label: 'Grain, Rice & Flour Milling' },
    { value: 'Meat & Seafood Processing', label: 'Meat, Poultry & Seafood Processing' },
    { value: 'Edible Oils & Fats', label: 'Edible Oil Refining & Processing' },
  ],
  'Chemicals & Petrochemicals': [
    { value: 'Specialty Chemicals', label: 'Specialty & Fine Chemicals' },
    { value: 'Industrial Solvents', label: 'Industrial Solvents & Resins' },
    { value: 'Paints & Coatings', label: 'Paints, Varnishes & Coatings' },
    { value: 'Fertilizers & Agrochem', label: 'Agrochemicals & Fertilizers' },
    { value: 'Basic Industrial Chemicals', label: 'Basic Industrial & Inorganic Chemicals' },
  ],
  'Automotive & Electronics': [
    { value: 'Automobile Components', label: 'Auto Ancillaries & Sub-assemblies' },
    { value: 'Electric Vehicles & Batteries', label: 'EV Manufacturing & Battery Assembly' },
    { value: 'Consumer Electronics & PCB', label: 'Electronics, PCB & SMT Assembly' },
    { value: 'Precision Auto Tooling', label: 'Auto Tooling, Jigs & Fixtures' },
  ],
  'Textiles & Apparel': [
    { value: 'Garment Manufacturing', label: 'Readymade Garments & Stitching' },
    { value: 'Spinning & Weaving', label: 'Spinning Mills & Weaving' },
    { value: 'Textile Processing & Dyeing', label: 'Wet Processing, Dyeing & Bleaching' },
    { value: 'Technical Textiles', label: 'Technical Textiles & Non-Woven' },
  ],
  'Pharmaceuticals & Healthcare': [
    { value: 'Formulations & Tablets', label: 'Finished Dosage Forms (Formulations)' },
    { value: 'Active Pharmaceutical Ingredients (API)', label: 'Active Pharmaceutical Ingredients (APIs)' },
    { value: 'Medical Devices & Diagnostics', label: 'Medical Devices & Surgical Consumables' },
    { value: 'Ayurvedic & Nutraceuticals', label: 'Ayush & Nutraceutical Products' },
  ],
  'Information Technology': [
    { value: 'Software Development', label: 'Software Product Development & SaaS' },
    { value: 'IT Enabled Services (ITeS)', label: 'BPO / KPO / IT Enabled Services' },
    { value: 'Data Center Operations', label: 'Tier III / IV Data Centers' },
  ],
};

export const STATES = [
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
];

export const TAMIL_NADU_DISTRICTS = [
  { value: 'Coimbatore', label: 'Coimbatore' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Kanchipuram', label: 'Kanchipuram' },
  { value: 'Chengalpattu', label: 'Chengalpattu' },
  { value: 'Tiruvallur', label: 'Tiruvallur' },
  { value: 'Tiruppur', label: 'Tiruppur' },
  { value: 'Salem', label: 'Salem' },
  { value: 'Erode', label: 'Erode' },
  { value: 'Madurai', label: 'Madurai' },
  { value: 'Tiruchirappalli', label: 'Tiruchirappalli' },
  { value: 'Vellore', label: 'Vellore' },
  { value: 'Ranipet', label: 'Ranipet' },
  { value: 'Hosur / Krishnagiri', label: 'Krishnagiri (Hosur)' },
  { value: 'Thoothukudi', label: 'Thoothukudi' },
  { value: 'Tirunelveli', label: 'Tirunelveli' },
  { value: 'Cuddalore', label: 'Cuddalore' },
  { value: 'Dindigul', label: 'Dindigul' },
  { value: 'Thanjavur', label: 'Thanjavur' },
];

export const BUSINESS_ACTIVITIES = [
  { value: 'Manufacturing', label: 'Manufacturing / Industrial Production' },
  { value: 'Service', label: 'Service Provider / Consulting' },
  { value: 'Trading', label: 'Commercial Trading / Wholesale Distribution' },
  { value: 'Storage & Warehousing', label: 'Logistics, Warehousing & Cold Storage' },
  { value: 'R&D', label: 'Research & Development (R&D) / Testing Lab' },
];

export const LAND_TYPES = [
  { value: 'Industrial', label: 'Government Industrial Complex (SIPCOT / SIDCO)' },
  { value: 'Private Industrial Land', label: 'Private Industrial Land / Designated Zone' },
  { value: 'Commercial', label: 'Commercial Urban Premises' },
  { value: 'Converted Land', label: 'Converted Non-Agricultural Land' },
];

export const WASTE_GENERATION_TYPES = [
  { value: 'Solid & Non-hazardous', label: 'Non-hazardous Solid Waste' },
  { value: 'Effluent / Wastewater', label: 'Trade Effluent / Industrial Wastewater' },
  { value: 'Hazardous Waste', label: 'Chemical / Hazardous Waste' },
  { value: 'E-waste', label: 'Electronic & Electrical Waste' },
  { value: 'None / Negligible', label: 'Negligible / Only Municipal Solid Waste' },
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
  { value: 'Exempt', label: 'Not Applicable / Exempted' },
];

export const APPROVAL_CATEGORIES = [
  'Company / Business Registration',
  'Land & Building',
  'Factory & Labour',
  'Environment',
  'Pollution Control',
  'Fire & Safety',
  'Electricity & Utilities',
  'Water',
  'Waste Management',
  'Tax & Financial',
  'Sector Specific',
  'Import / Export',
  'Local Authority',
  'Other Regulatory Approvals'
];

export const LIFECYCLE_STAGES = [
  'Pre-Establishment',
  'Land & Construction',
  'Pre-Operation',
  'Operation',
  'Ongoing Compliance / Renewal'
];

export const STATUTORY_STATUS_STYLES = {
  REQUIRED: {
    bg: 'bg-[#FCEEEE]',
    text: 'text-[#C93D3D]',
    border: 'border-[#F8CDCD]',
    dot: 'bg-[#E05252]',
    label: 'Required',
    desc: 'Statutorily mandatory based on enterprise profile'
  },
  CONDITIONAL: {
    bg: 'bg-[#FEF6E8]',
    text: 'text-[#B87707]',
    border: 'border-[#FDE2B2]',
    dot: 'bg-[#F2A51A]',
    label: 'Conditional',
    desc: 'Applies under specific operational thresholds or triggers'
  },
  NEEDS_VERIFICATION: {
    bg: 'bg-[#EBF3FF]',
    text: 'text-[#1D63CB]',
    border: 'border-[#C5DBF8]',
    dot: 'bg-[#2A75E6]',
    label: 'Needs Verification',
    desc: 'Requires department verification or missing parameter input'
  },
};

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
  REQUIRED: { bg: 'bg-[#FCEEEE]', text: 'text-[#C93D3D]', border: 'border-[#F8CDCD]', label: 'Required' },
  CONDITIONAL: { bg: 'bg-[#FEF6E8]', text: 'text-[#B87707]', border: 'border-[#FDE2B2]', label: 'Conditional' },
  NEEDS_VERIFICATION: { bg: 'bg-[#EBF3FF]', text: 'text-[#1D63CB]', border: 'border-[#C5DBF8]', label: 'Needs Verification' },
};

export const USER_ROLES = {
  APPLICANT: 'applicant',
  OFFICER: 'officer',
  ADMIN: 'admin',
};
