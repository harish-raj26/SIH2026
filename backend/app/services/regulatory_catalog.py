"""
Authoritative Statutory Regulatory Catalog for Byte Forge / BizClear.
Curated from official government regulatory sources:
- National Single Window System (NSWS)
- Tamil Nadu Single Window Portal (Guidance TN)
- Tamil Nadu Pollution Control Board (TNPCB)
- Directorate of Industrial Safety and Health (DISH)
- Tamil Nadu Fire & Rescue Services (TNFRS)
- Directorate of Boilers, Tamil Nadu
- TANGEDCO & CEIG
- DGFT, FSSAI, PESO, EPFO, ESIC, CDSCO, CGWA
"""

import json
from app.models.approval import Approval


STATUTORY_APPROVALS_CATALOG = [
    # -------------------------------------------------------------
    # 1. COMPANY / BUSINESS REGISTRATION
    # -------------------------------------------------------------
    {
        "approval_name": "MCA Company / LLP Incorporation & CIN",
        "description": "Statutory corporate registration and issuance of Corporate Identification Number (CIN) or LLPIN under the Companies Act, 2013 / Limited Liability Partnership Act, 2008.",
        "authority": "Ministry of Corporate Affairs (MCA)",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Company / Business Registration",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "legal_forms": ["Private Limited Company", "Public Limited Company", "Limited Liability Partnership"]
        },
        "documents_required": [
            "Digital Signature Certificate (DSC) of Directors/Partners",
            "Director Identification Number (DIN) / DPIN",
            "Memorandum of Association (MoA) and Articles of Association (AoA)",
            "Identity and Address Proofs of Promoters/Directors",
            "Registered Office Address Proof (Utility Bill & NOC)"
        ],
        "fees": "Based on authorized capital (₹1,000 - ₹15,000, SPICe+ exempt under ₹15 Lakh capital)",
        "validity": "Lifetime (subject to annual compliance filings)",
        "timeline": "3 - 7 working days",
        "application_url": "https://www.mca.gov.in/content/mca/global/en/home.html",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": [],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Udyam MSME Registration Certificate",
        "description": "Statutory registration for Micro, Small and Medium Enterprises under the MSMED Act, 2006 to avail statutory subsidies, priority lending, and state concessions.",
        "authority": "Ministry of Micro, Small and Medium Enterprises",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Company / Business Registration",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": False,
        "conditions": {
            "investment_max": 500000000
        },
        "documents_required": [
            "Aadhaar Number of Entrepreneur / Authorized Signatory",
            "PAN Card of the Business Entity",
            "Bank Account Details (IFSC & Account No)",
            "NIC Code for Business Activity"
        ],
        "fees": "Nil (Government Free Service)",
        "validity": "Permanent / Lifetime",
        "timeline": "Instant / 1 - 2 working days",
        "application_url": "https://udyamregistration.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": [],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Goods and Services Tax (GST) Registration",
        "description": "Mandatory tax registration under the Central and State GST Acts for business operations and interstate supply.",
        "authority": "Central Board of Indirect Taxes and Customs (CBIC) / State Commercial Tax Dept",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Tax & Financial",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "always": True
        },
        "documents_required": [
            "PAN Card of the Business Entity",
            "Proof of Business Constitution / Incorporation Certificate",
            "Proof of Principal Place of Business (Rental Agreement / Property Tax Receipt / NOC)",
            "Bank Account Statement / Cancelled Cheque",
            "Aadhaar & Photographs of Authorized Signatories"
        ],
        "fees": "Nil",
        "validity": "Lifetime (Active while compliant)",
        "timeline": "3 - 7 working days",
        "application_url": "https://www.gst.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 2. LAND & BUILDING PERMITS
    # -------------------------------------------------------------
    {
        "approval_name": "DTCP / CMDA Industrial Planning Permission & Building Permit",
        "description": "Statutory land development permission and factory building layout sanction under the Tamil Nadu Town and Country Planning Act, 1971 / Tamil Nadu Combined Development and Building Rules (TNCDBR).",
        "authority": "Directorate of Town & Country Planning (DTCP) / Chennai Metropolitan Development Authority (CMDA)",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Land & Building",
        "level": "State",
        "stage": "Land & Construction",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Registered Land Title Deed / Sale Deed / Lease Agreement",
            "Patta / Chitta / FMB Sketch / Encumbrance Certificate",
            "Key Plan, Site Plan, and Detailed Building Layout Drawings (AutoDCR formatted)",
            "Structural Stability Certificate from Licensed Structural Engineer",
            "Combined NOC from Fire Dept, DISH and Local Body"
        ],
        "fees": "₹25 - ₹100 per sq. metre based on built-up area and local development charges",
        "validity": "5 Years for construction completion",
        "timeline": "30 - 45 working days",
        "application_url": "https://tnswp.com/",
        "source_url": "https://www.tn.gov.in/dtcp/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "SIPCOT / SIDCO Industrial Land Allotment & Possession Clearance",
        "description": "Clearance for industrial plot/shed allotment, sub-lease registration, and infrastructure handover in government industrial complexes.",
        "authority": "State Industries Promotion Corporation of Tamil Nadu (SIPCOT) / SIDCO",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Land & Building",
        "level": "State",
        "stage": "Land & Construction",
        "mandatory": True,
        "conditions": {
            "land_types": ["Industrial / SIPCOT / SIDCO", "Industrial Estate"]
        },
        "documents_required": [
            "Detailed Project Report (DPR) with investment and employment projections",
            "Entity Incorporation Documents & PAN Card",
            "Power, Water, and Effluent Generation Requirements Statement",
            "Allotment Application and EMD payment receipt"
        ],
        "fees": "Plot upfront lease deposit + annual maintenance charges",
        "validity": "99-Year Leasehold / Agreement period",
        "timeline": "21 - 30 working days",
        "application_url": "https://sipcot.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 3. POLLUTION CONTROL & ENVIRONMENT
    # -------------------------------------------------------------
    {
        "approval_name": "TNPCB Consent to Establish (CTE) under Water & Air Acts",
        "description": "Mandatory prior consent before commencing any industrial plant construction or installation of machinery under Section 25 of the Water Act, 1974 and Section 21 of the Air Act, 1981.",
        "authority": "Tamil Nadu Pollution Control Board (TNPCB)",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Pollution Control",
        "level": "State",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "pollution_categories": ["Red", "Orange", "Green"]
        },
        "documents_required": [
            "Site Plan and Layout Plan showing manufacturing units, ETP/STP and emission stacks",
            "Detailed Project Report (DPR) & Manufacturing Process Flow Chart",
            "Water Balance Chart (Raw water source, process, domestic & recycling)",
            "Effluent Treatment Plant (ETP) / Sewage Treatment Plant (STP) design proposal",
            "Air Pollution Control Measures (APCM) / Chimney stack details & DG set acoustics",
            "Land ownership/lease document and DTCP approval"
        ],
        "fees": "₹5,000 to ₹1,50,000+ based on Gross Fixed Assets (GFA) investment tier",
        "validity": "Up to 5 Years (until commercial commissioning)",
        "timeline": "30 - 45 working days",
        "application_url": "https://tnpcb.gov.in/ocmms/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Pollution Control Board",
        "dependencies": ["DTCP / CMDA Industrial Planning Permission & Building Permit"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "TNPCB Consent to Operate (CTO) under Water & Air Acts",
        "description": "Statutory operating consent required before commissioning commercial production or operating manufacturing machinery under the Water Act, 1974 and Air Act, 1981.",
        "authority": "Tamil Nadu Pollution Control Board (TNPCB)",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Pollution Control",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "pollution_categories": ["Red", "Orange", "Green"]
        },
        "documents_required": [
            "Copy of valid TNPCB Consent to Establish (CTE)",
            "Completion and commissioning report of ETP / STP and APCM installations",
            "Third-party analysis report of treated trade effluent / treated sewage / stack emission",
            "Photographs of installed machinery, ETP, STP, energy meters and flow meters",
            "DISH Factory Plan Approval copy"
        ],
        "fees": "Annual / Multi-year fee based on GFA tier (₹10,000 to ₹3,00,000+)",
        "validity": "1 to 5 Years (Renewable; Red: 5 yrs, Orange: 10 yrs, Green: 14 yrs)",
        "timeline": "30 working days",
        "application_url": "https://tnpcb.gov.in/ocmms/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Pollution Control Board",
        "dependencies": ["TNPCB Consent to Establish (CTE) under Water & Air Acts", "DISH Factory Plan Approval under Factories Act, 1948"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Hazardous Waste Management Authorization (Form 2)",
        "description": "Statutory authorization for collection, generation, treatment, storage, transport, and disposal of hazardous waste under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016.",
        "authority": "Tamil Nadu Pollution Control Board (TNPCB)",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Waste Management",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "hazardous_materials": True
        },
        "documents_required": [
            "Form 1 Application with Process Details and Waste Characterization",
            "Copy of valid CTE / CTO",
            "Emergency Response Plan (ERP) and On-Site Crisis Management Plan",
            "Proof of membership with Common Hazardous Waste Treatment, Storage & Disposal Facility (TSDF)",
            "Details of dedicated impervious hazardous waste storage room with containment dyke"
        ],
        "fees": "₹7,500 to ₹25,000 based on quantity and investment tier",
        "validity": "5 Years (Renewable)",
        "timeline": "45 working days",
        "application_url": "https://tnpcb.gov.in/ocmms/",
        "source_url": "https://tnpcb.gov.in/",
        "source_type": "Tamil Nadu Pollution Control Board",
        "dependencies": ["TNPCB Consent to Establish (CTE) under Water & Air Acts"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Extended Producer Responsibility (EPR) Registration for Plastic / E-Waste",
        "description": "Mandatory registration for Producers, Importers, Brand Owners (PIBOs) and Manufacturers generating plastic packaging or electrical waste under EPR Guidelines.",
        "authority": "Central Pollution Control Board (CPCB) / TNPCB",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Waste Management",
        "level": "Central",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "waste_types": ["Solid Waste", "Effluent / Wastewater", "Hazardous Waste", "E-waste"]
        },
        "documents_required": [
            "PAN, GST and Company Incorporation Certificate",
            "TNPCB CTE / CTO copy",
            "Action Plan for collection and recycling targets through registered recyclers",
            "Annual Plastic/Packaging material turnover audit certificate"
        ],
        "fees": "₹10,000 to ₹1,00,000 based on quantity tier",
        "validity": "5 Years",
        "timeline": "30 working days",
        "application_url": "https://eprplastic.cpcb.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["TNPCB Consent to Establish (CTE) under Water & Air Acts"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 4. FACTORY & LABOUR CLEARANCES
    # -------------------------------------------------------------
    {
        "approval_name": "DISH Factory Plan Approval under Factories Act, 1948",
        "description": "Statutory approval of factory layout, ventilation, safety clearances, and internal machinery placement drawings under Section 6 of the Factories Act, 1948 and Tamil Nadu Factories Rules, 1950.",
        "authority": "Directorate of Industrial Safety and Health (DISH), Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "State",
        "stage": "Land & Construction",
        "mandatory": True,
        "conditions": {
            "factory": True,
            "employees_gte": 10
        },
        "documents_required": [
            "Factory Building Layout Plans in triplicate (Blueprints showing machinery, aisles, emergency exits)",
            "Process flow chart and manufacturing description",
            "Land ownership/lease deed and approved DTCP plan",
            "Form No. 1 with manufacturing particulars and horsepower details",
            "Stability Certificate from Competent Person"
        ],
        "fees": "₹500 to ₹2,500 based on horsepower & workforce schedule",
        "validity": "Permanent for approved layout (Revision required if layout changes)",
        "timeline": "30 working days",
        "application_url": "https://dish.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Directorate of Industrial Safety and Health",
        "dependencies": ["DTCP / CMDA Industrial Planning Permission & Building Permit"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "DISH Factory Licence (Registration & Grant of Licence)",
        "description": "Statutory operating license issued under Section 6 & 7 of the Factories Act, 1948 for carrying out manufacturing with power (≥10 workers) or without power (≥20 workers).",
        "authority": "Directorate of Industrial Safety and Health (DISH), Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "factory": True,
            "employees_gte": 10
        },
        "documents_required": [
            "Form No. 2 Notice of Occupation and Application for Licence",
            "Copy of Approved Factory Plan from DISH",
            "Fire Dept Operational NOC",
            "TNPCB Consent to Establish / Operate copy",
            "Competent Person Stability Certificate for completed factory building (Form 1-A)",
            "Safety Officer Appointment Order (if workers > 500 or hazardous processes)"
        ],
        "fees": "Calculated per Schedule of Fees based on installed Horsepower (HP) and maximum worker strength (₹2,000 to ₹60,000/yr)",
        "validity": "1 to 10 Years (Multi-year renewal option)",
        "timeline": "30 working days",
        "application_url": "https://dish.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Directorate of Industrial Safety and Health",
        "dependencies": ["DISH Factory Plan Approval under Factories Act, 1948", "TNPCB Consent to Establish (CTE) under Water & Air Acts", "Fire and Rescue Services Initial Fire NOC / MSB Clearance"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "EPFO Employer Registration under EPF & MP Act, 1952",
        "description": "Mandatory social security registration for industrial establishments and commercial entities with 20 or more employees under Employees' Provident Funds Act.",
        "authority": "Employees' Provident Fund Organisation (EPFO), Ministry of Labour",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "employees_gte": 20
        },
        "documents_required": [
            "Company PAN, Certificate of Incorporation, MoA/AoA",
            "Proof of Address and Electricity bill of establishment",
            "Specimen Signatures of Authorized Signatories",
            "Employee details and wage register setup"
        ],
        "fees": "Nil",
        "validity": "Lifetime code",
        "timeline": "1 - 3 working days",
        "application_url": "https://unifiedportal-emp.epfindia.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "ESIC Employer Registration under ESI Act, 1948",
        "description": "Mandatory healthcare and medical insurance registration for factories and specified establishments employing 10 or more persons earning ≤₹21,000/month.",
        "authority": "Employees' State Insurance Corporation (ESIC), Ministry of Labour",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "employees_gte": 10
        },
        "documents_required": [
            "Entity Registration Certificate & PAN Card",
            "List of all employees with date of joining and gross salary",
            "Bank Cancelled Cheque and Registered Address proof",
            "Digital Signature Certificate of employer"
        ],
        "fees": "Nil",
        "validity": "Lifetime 17-digit code",
        "timeline": "1 - 3 working days",
        "application_url": "https://www.esic.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Contract Labour Principal Employer Registration (Form I)",
        "description": "Statutory registration for principal employers deploying 20 or more contract workers under the Contract Labour (Regulation and Abolition) Act, 1970.",
        "authority": "Joint Commissioner of Labour / Labour Department, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "employees_gte": 20
        },
        "documents_required": [
            "Form I Application signed by Principal Employer",
            "Copy of Factory License / Registration Certificate",
            "Details of contractor agencies and work orders",
            "List of nature of work and maximum contractor workforce count"
        ],
        "fees": "₹200 to ₹5,000 based on contractor worker slab",
        "validity": "Valid until contractor terms or establishment changes",
        "timeline": "15 working days",
        "application_url": "https://labour.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["DISH Factory Licence (Registration & Grant of Licence)"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Standing Orders Certification under Industrial Employment Act",
        "description": "Mandatory certification of formal service rules, work shifts, disciplinary procedures, and leaves for establishments employing 50 or more industrial workmen under Industrial Employment (Standing Orders) Act, 1946.",
        "authority": "Certifying Officer / Joint Commissioner of Labour, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Factory & Labour",
        "level": "State",
        "stage": "Operation",
        "mandatory": True,
        "conditions": {
            "employees_gte": 50
        },
        "documents_required": [
            "Draft Standing Orders in English & Tamil (5 copies)",
            "List of workmen employed in each category (permanent, probationer, temporary, apprentice)",
            "Trade Union representation details or elected representatives list",
            "Factory Licence copy"
        ],
        "fees": "₹500",
        "validity": "Permanent (Amendment submission needed for modifications)",
        "timeline": "60 working days",
        "application_url": "https://labour.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["DISH Factory Licence (Registration & Grant of Licence)"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 5. FIRE & SAFETY APPROVALS
    # -------------------------------------------------------------
    {
        "approval_name": "Fire and Rescue Services Initial Fire NOC / MSB Clearance",
        "description": "Prior fire safety layout clearance and advisory recommendation for industrial building drawings, hydrants, and access under the Tamil Nadu Fire Service Act, 1985.",
        "authority": "Directorate of Fire and Rescue Services, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Fire & Safety",
        "level": "State",
        "stage": "Land & Construction",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Architectural Site Plan and Floor Plans showing fire hydrants, hose reels, fire escapes & emergency stairs",
            "Building cross-sections, height details and road approach width (min 6-9 metres)",
            "Storage plan for raw materials and combustible stock",
            "Fire water static reservoir capacity calculations"
        ],
        "fees": "Inspection fee based on built-up area and plinth tier",
        "validity": "Valid during construction (Converts to Final NOC on inspection)",
        "timeline": "21 working days",
        "application_url": "https://www.tnfrs.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Fire and Rescue Services",
        "dependencies": ["DTCP / CMDA Industrial Planning Permission & Building Permit"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Fire and Rescue Services Final Operational Fire License / NOC",
        "description": "Final operational Fire Safety Certificate following on-site physical inspection of installed firefighting equipment, sprinkler systems, alarms, and fire pump readiness.",
        "authority": "Directorate of Fire and Rescue Services, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Fire & Safety",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Copy of Initial Fire NOC",
            "Fire protection system installation completion certificate from licensed vendor",
            "Pressure testing report for fire hydrants and auto-sprinklers",
            "Trained fire-fighting crew certificate and mock drill logbook"
        ],
        "fees": "₹2,500 to ₹10,000 depending on floor area",
        "validity": "1 Year (Mandatory Annual Renewal)",
        "timeline": "15 working days",
        "application_url": "https://www.tnfrs.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Fire and Rescue Services",
        "dependencies": ["Fire and Rescue Services Initial Fire NOC / MSB Clearance"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 6. BOILER & PRESSURE VESSEL CLEARANCES
    # -------------------------------------------------------------
    {
        "approval_name": "Boiler Registration & Certificate of Inspection (Indian Boilers Act, 1923)",
        "description": "Mandatory hydrostatic testing, registration number engraving, and annual operating certificate under Section 7 of the Indian Boilers Act, 1923 before firing any steam boiler / economizer.",
        "authority": "Directorate of Boilers, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Other Regulatory Approvals",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "boiler": True
        },
        "documents_required": [
            "Boiler Maker's Certificate (Form II, Form III, Form IV) from IBR approved manufacturer",
            "IBR certified steam pipeline layout and welding inspection reports",
            "Hydrostatic pressure test inspection certificate",
            "Certified Boiler Attendant / Boiler Operation Engineer (BOE) appointment details",
            "Safety valve test and calibration certificate"
        ],
        "fees": "₹3,000 to ₹25,000 based on boiler heating surface area (sq. metres)",
        "validity": "12 Months (Mandatory annual hydrostatic re-inspection)",
        "timeline": "21 working days",
        "application_url": "https://www.tn.gov.in/boilers/",
        "source_url": "https://tnswp.com/",
        "source_type": "Directorate of Boilers, Tamil Nadu",
        "dependencies": ["DISH Factory Plan Approval under Factories Act, 1948", "TNPCB Consent to Establish (CTE) under Water & Air Acts"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Approval of Steam Pipeline & Fabrication Layout",
        "description": "Prior scrutiny and drawing approval for steam pipes, valves, and headers operating under pressure exceeding 3.5 kg/cm² or internal diameter > 25.4 mm under IBR.",
        "authority": "Directorate of Boilers, Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Other Regulatory Approvals",
        "level": "State",
        "stage": "Land & Construction",
        "mandatory": True,
        "conditions": {
            "boiler": True
        },
        "documents_required": [
            "Isometric drawings and fabrication details of steam pipeline",
            "IBR Form III-A / III-B Material test certificates of pipes and fittings",
            "IBR certified welder qualification certificates (Form XIII)",
            "Radiography / NDT test reports of welded joints"
        ],
        "fees": "₹2,000 per drawing submission + inspection fee",
        "validity": "Permanent for approved layout",
        "timeline": "15 working days",
        "application_url": "https://www.tn.gov.in/boilers/",
        "source_url": "https://tnswp.com/",
        "source_type": "Directorate of Boilers, Tamil Nadu",
        "dependencies": ["DISH Factory Plan Approval under Factories Act, 1948"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 7. ELECTRICITY & UTILITIES
    # -------------------------------------------------------------
    {
        "approval_name": "TANGEDCO Industrial Power Connection (HT / LT)",
        "description": "Sanction and energization of High Tension (11kV / 22kV / 33kV) or Low Tension (415V 3-phase) industrial electricity tariff connection for factory operations.",
        "authority": "Tamil Nadu Generation and Distribution Corporation (TANGEDCO)",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Electricity & Utilities",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Proof of ownership / lease agreement of premises with property tax receipt",
            "Approved Building Layout & DTCP/CMDA sanction",
            "Wiring completion certificate by Licensed Electrical Contractor",
            "Demand notice payment and Earnest Money Deposit (EMD)",
            "CEIG Safety Approval (for HT connections > 112 kW or generator installations)"
        ],
        "fees": "Development charges + Security Deposit based on contracted demand (kVA / kW)",
        "validity": "Permanent (subject to monthly consumption charges and tariff compliance)",
        "timeline": "15 days for LT, 30 - 60 days for HT (depending on transformer/feeder work)",
        "application_url": "https://www.tangedco.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["DTCP / CMDA Industrial Planning Permission & Building Permit"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "CEIG Electrical Safety Certificate (HT Substation & DG Set Approval)",
        "description": "Statutory safety inspection and energization sanction for High Tension substations, transformers, captive diesel generators, and capacitor banks under Central Electricity Authority (CEA) Regulations, 2023.",
        "authority": "Chief Electrical Inspector to Government (CEIG), Tamil Nadu",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Electricity & Utilities",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "power_gte": 100
        },
        "documents_required": [
            "Single Line Diagram (SLD) of HT Substation / Switchyard and Earth Mat design",
            "Test certificates of Transformers, Breakers, CTs, PTs and Relays from NABL lab",
            "DG Set acoustic enclosure and exhaust emission test report",
            "Earth resistance test report signed by Chartered Electrical Engineer",
            "TNPCB DG set chimney height clearance"
        ],
        "fees": "₹2,500 to ₹15,000 based on total KVA capacity",
        "validity": "Annual / Biennial Inspection Certificate",
        "timeline": "21 working days",
        "application_url": "https://tneig.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["TANGEDCO Industrial Power Connection (HT / LT)"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 8. WATER & GROUNDWATER
    # -------------------------------------------------------------
    {
        "approval_name": "Ground Water Abstraction NOC (WRD / CGWA)",
        "description": "Statutory permit for extraction and industrial use of groundwater through borewells/tubewells under the Tamil Nadu Ground Water (Development and Management) Act / CGWA Guidelines.",
        "authority": "Water Resources Department (WRD), Tamil Nadu / Central Ground Water Authority",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Water",
        "level": "State",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Hydrogeological report by NABET accredited consultant showing aquifer yield",
            "Water balance chart & Flow meter installation proposal with telemetry",
            "Rainwater Harvesting (RWH) and artificial recharge structural plan",
            "Site location GPS coordinates and Revenue village categorization (Safe / Semi-critical / Critical / Over-exploited)"
        ],
        "fees": "₹10,000 application fee + ground water abstraction charges per cubic metre",
        "validity": "2 to 3 Years (Renewable)",
        "timeline": "45 working days",
        "application_url": "https://cgwa-noc.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Water Resources Department / CGWA",
        "dependencies": ["DTCP / CMDA Industrial Planning Permission & Building Permit"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 9. IMPORT / EXPORT & FOREIGN TRADE
    # -------------------------------------------------------------
    {
        "approval_name": "DGFT Importer Exporter Code (IEC) Registration",
        "description": "Mandatory 10-digit identification code issued by the Directorate General of Foreign Trade (DGFT) for engaging in international import and export operations.",
        "authority": "Directorate General of Foreign Trade (DGFT), Ministry of Commerce",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Import / Export",
        "level": "Central",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "import_export": True
        },
        "documents_required": [
            "Company PAN Card",
            "Certificate of Incorporation / Partnership Deed",
            "Bank Certificate / Pre-printed cancelled cheque with business name",
            "Registered office address proof (Electricity bill / Rent agreement)",
            "Aadhaar / Passport copy of Authorized Director / Partner"
        ],
        "fees": "₹500 (One-time government application fee)",
        "validity": "Lifetime (Mandatory annual online validation between April-June)",
        "timeline": "1 - 2 working days",
        "application_url": "https://www.dgft.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Customs ICEGATE & Port Registration (AD Code)",
        "description": "Registration of Authorised Dealer (AD) Code and Indian Customs EDI Gateway (ICEGATE) account for electronic filing of Bill of Entry (imports) and Shipping Bills (exports).",
        "authority": "Central Board of Indirect Taxes and Customs (CBIC) / ICEGATE",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Import / Export",
        "level": "Central",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "import_export": True
        },
        "documents_required": [
            "Copy of DGFT IEC Certificate",
            "Bank Authorised Dealer (AD) Code letter on bank letterhead",
            "GST Registration Certificate",
            "Class 3 Combo Digital Signature Certificate (DSC) for ICEGATE"
        ],
        "fees": "Nil",
        "validity": "Lifetime (Linked to Bank Account & Port)",
        "timeline": "3 - 5 working days",
        "application_url": "https://www.icegate.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["DGFT Importer Exporter Code (IEC) Registration"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 10. HAZARDOUS MATERIALS & EXPLOSIVES (PESO)
    # -------------------------------------------------------------
    {
        "approval_name": "PESO Petroleum / Solvents / Compressed Gas Storage License",
        "description": "Statutory prior storage license under the Petroleum Rules, 2002 / Gas Cylinders Rules, 2016 for storing Class A, B, or C petroleum products, industrial solvents, or compressed gas cylinders exceeding exempt thresholds.",
        "authority": "Petroleum and Explosives Safety Organization (PESO), Ministry of Commerce",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Sector Specific",
        "level": "Central",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "hazardous_materials": True
        },
        "documents_required": [
            "Site layout and safety distance drawings (Safety zone / Dyke walls) prepared by approved draughtsman",
            "District Magistrate / District Collector No Objection Certificate (DM NOC)",
            "Fire Department Final NOC copy",
            "Fabrication and hydro-testing certificate of storage tanks / pressure vessels from approved third-party inspector",
            "Flame-proof electrical fittings certificate (CEIG / PESO approved)"
        ],
        "fees": "₹2,500 to ₹50,000 depending on stored volume (kilo litres / metric tonnes)",
        "validity": "3 to 5 Years (Renewable)",
        "timeline": "45 - 60 working days",
        "application_url": "https://peso.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["Fire and Rescue Services Final Operational Fire License / NOC", "DISH Factory Plan Approval under Factories Act, 1948"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 11. SECTOR-SPECIFIC CLEARANCES (FOOD / PHARMA / AUTO)
    # -------------------------------------------------------------
    {
        "approval_name": "FSSAI State / Central Manufacturing Food License",
        "description": "Statutory licensing under Section 31 of the Food Safety and Standards Act, 2006 for manufacturing, processing, packaging, or storage of food and beverage products.",
        "authority": "Food Safety and Standards Authority of India (FSSAI) / Tamil Nadu Food Safety Dept",
        "jurisdiction": "Central",
        "state": "All",
        "district": "All",
        "sector": "Food Processing",
        "sub_sector": "All",
        "category": "Sector Specific",
        "level": "Central",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "sectors": ["Food Processing", "Food & Beverage Processing", "Hospitality & Tourism"]
        },
        "documents_required": [
            "Form B Application on FoSCoS portal",
            "Layout plan of the food processing unit with dimensions and designated food safety zones",
            "List of Directors/Partners with ID and address proof",
            "Name and list of machinery and equipment along with installed capacity & horsepower",
            "Water testing analysis report from NABL/FSSAI accredited lab (potability report)",
            "Food Safety Management System (FSMS) plan / HACCP certificate and recall plan"
        ],
        "fees": "₹2,000 to ₹7,500 per year based on annual turnover / production capacity tier",
        "validity": "1 to 5 Years (Renewable)",
        "timeline": "30 - 45 working days",
        "application_url": "https://foscos.fssai.gov.in/",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["TNPCB Consent to Establish (CTE) under Water & Air Acts", "DISH Factory Licence (Registration & Grant of Licence)"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Drug Manufacturing License (Form 25 / Form 28 under Drugs & Cosmetics Act)",
        "description": "Statutory license for manufacture of pharmaceuticals, APIs, formulations, or medical devices in compliance with Good Manufacturing Practices (Schedule M) under Drugs and Cosmetics Act, 1940.",
        "authority": "Drugs Control Administration, Tamil Nadu / CDSCO",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "Pharmaceuticals & Healthcare",
        "sub_sector": "All",
        "category": "Sector Specific",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "sectors": ["Pharmaceuticals & Healthcare", "Chemicals & Petrochemicals"]
        },
        "documents_required": [
            "Form 24 / 27 Application with Master Formula Records",
            "Factory plan conforming to Schedule M (cleanroom HVAC, air handling units, AHU validation)",
            "Appointment of Approved Technical Staff (Approved Manufacturing & Analytical Chemists)",
            "List of laboratory testing equipment and validation protocols",
            "TNPCB CTE and CTO copy"
        ],
        "fees": "₹7,500 + ₹300 per product inspection fee",
        "validity": "5 Years (Renewable)",
        "timeline": "60 - 90 working days",
        "application_url": "https://www.drugscontrol.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Tamil Nadu Single Window Portal",
        "dependencies": ["DISH Factory Licence (Registration & Grant of Licence)", "TNPCB Consent to Operate (CTO) under Water & Air Acts"],
        "priority": "High",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Legal Metrology Packaged Commodities (LMPC) Registration",
        "description": "Mandatory manufacturer/packer registration for pre-packaged commodities under Rule 27 of the Legal Metrology (Packaged Commodities) Rules, 2011.",
        "authority": "Department of Legal Metrology, Tamil Nadu / Ministry of Consumer Affairs",
        "jurisdiction": "State",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Sector Specific",
        "level": "State",
        "stage": "Pre-Operation",
        "mandatory": True,
        "conditions": {
            "factory": True
        },
        "documents_required": [
            "Application on official portal with specimen label / packaging artwork",
            "Incorporation Certificate & GST Registration",
            "Factory License / Municipal Trade License copy",
            "List of pre-packaged product names and package net weights/volumes"
        ],
        "fees": "₹500 per registration",
        "validity": "Lifetime",
        "timeline": "15 working days",
        "application_url": "https://tnlabour.tn.gov.in/legal-metrology",
        "source_url": "https://www.nsws.gov.in/portal/approvals",
        "source_type": "National Single Window System (NSWS)",
        "dependencies": ["DISH Factory Licence (Registration & Grant of Licence)"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },

    # -------------------------------------------------------------
    # 12. LOCAL AUTHORITY & MUNICIPAL PERMITS
    # -------------------------------------------------------------
    {
        "approval_name": "Municipal Corporation / Panchayat Dangerous & Offensive (D&O) Trade Licence",
        "description": "Statutory local authority operating license under Tamil Nadu District Municipalities Act, 1920 / Tamil Nadu Panchayats Act, 1994 for operating machinery and industrial trades.",
        "authority": "Local Municipal Corporation / Town Panchayat / Village Panchayat",
        "jurisdiction": "Local",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Local Authority",
        "level": "Local",
        "stage": "Operation",
        "mandatory": True,
        "conditions": {
            "always": True
        },
        "documents_required": [
            "Application form signed by authorized representative",
            "Property tax receipt of premises or rental deed",
            "TNPCB Consent to Operate (CTO) or White category acknowledgement",
            "DISH Factory License copy",
            "Fire Department NOC"
        ],
        "fees": "₹1,000 to ₹15,000 annual license fee based on installed HP and trade category",
        "validity": "1 Financial Year (Annual renewal before April 30)",
        "timeline": "15 working days",
        "application_url": "https://tnurbanepay.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Local authority / municipality / corporation",
        "dependencies": ["TNPCB Consent to Operate (CTO) under Water & Air Acts", "DISH Factory Licence (Registration & Grant of Licence)"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },
    {
        "approval_name": "Professional Tax Employer Registration",
        "description": "Mandatory employer enrollment with local municipal corporation or town panchayat for deduction and payment of half-yearly employee professional tax under Tamil Nadu Municipal Laws.",
        "authority": "Local Municipal Corporation / Municipality",
        "jurisdiction": "Local",
        "state": "Tamil Nadu",
        "district": "All",
        "sector": "All",
        "sub_sector": "All",
        "category": "Tax & Financial",
        "level": "Local",
        "stage": "Pre-Establishment",
        "mandatory": True,
        "conditions": {
            "employees_gte": 1
        },
        "documents_required": [
            "Entity Incorporation Certificate & PAN Card",
            "Proof of premises address in municipal jurisdiction",
            "List of employees and designated salary slabs"
        ],
        "fees": "Nil for registration (tax remitted half-yearly based on salary brackets)",
        "validity": "Lifetime enrollment code",
        "timeline": "7 working days",
        "application_url": "https://tnurbanepay.tn.gov.in/",
        "source_url": "https://tnswp.com/",
        "source_type": "Local authority / municipality / corporation",
        "dependencies": ["MCA Company / LLP Incorporation & CIN"],
        "priority": "Medium",
        "last_verified": "2026-03-01",
        "active": True
    },
]


def seed_regulatory_catalog(db_session):
    """Seed or update the statutory regulatory catalog into the approvals table."""
    for item in STATUTORY_APPROVALS_CATALOG:
        existing = db_session.query(Approval).filter(
            Approval.approval_name == item["approval_name"]
        ).first()

        conditions_str = json.dumps(item.get("conditions", {}))
        docs_str = json.dumps(item.get("documents_required", []))
        deps_str = json.dumps(item.get("dependencies", []))

        if not existing:
            approval_record = Approval(
                name=item["approval_name"],
                approval_name=item["approval_name"],
                description=item.get("description"),
                authority=item["authority"],
                jurisdiction=item.get("jurisdiction", "State"),
                state=item.get("state", "Tamil Nadu"),
                district=item.get("district", "All"),
                sector=item.get("sector", "All"),
                sub_sector=item.get("sub_sector", "All"),
                category=item.get("category", "Other Regulatory Approvals"),
                level=item.get("level", "State"),
                stage=item.get("stage", "Pre-Operation"),
                mandatory=item.get("mandatory", True),
                conditions=conditions_str,
                documents_required=docs_str,
                fees=item.get("fees"),
                validity=item.get("validity"),
                timeline=item.get("timeline"),
                application_url=item.get("application_url"),
                source_url=item.get("source_url"),
                source_type=item.get("source_type", "Official Government Source"),
                dependencies=deps_str,
                priority=item.get("priority", "Medium"),
                status="Required" if item.get("mandatory", True) else "Conditional",
                last_verified=item.get("last_verified", "2026-03-01"),
                active=item.get("active", True)
            )
            db_session.add(approval_record)
        else:
            # Update fields in case catalog metadata evolved
            existing.name = item["approval_name"]
            existing.approval_name = item["approval_name"]
            existing.authority = item["authority"]
            existing.jurisdiction = item.get("jurisdiction", "State")
            existing.category = item.get("category", "Other Regulatory Approvals")
            existing.stage = item.get("stage", "Pre-Operation")
            existing.mandatory = item.get("mandatory", True)
            existing.conditions = conditions_str
            existing.documents_required = docs_str
            existing.fees = item.get("fees")
            existing.validity = item.get("validity")
            existing.timeline = item.get("timeline")
            existing.application_url = item.get("application_url")
            existing.source_url = item.get("source_url")
            existing.source_type = item.get("source_type", "Official Government Source")
            existing.dependencies = deps_str
            existing.priority = item.get("priority", "Medium")
            existing.last_verified = item.get("last_verified", "2026-03-01")
            existing.active = item.get("active", True)

    db_session.commit()
